import fs from 'fs';
import path from 'path';
import dotenv from 'dotenv';
dotenv.config();

// Load clinical knowledge base data for server-side deterministic fallback
let ckbDatabase = [];
try {
  const ckbPath = path.resolve('src/data/clinical_knowledge_base.json');
  if (fs.existsSync(ckbPath)) {
    ckbDatabase = JSON.parse(fs.readFileSync(ckbPath, 'utf8'));
  }
} catch (err) {
  console.warn('[IntakeController] Could not load clinical_knowledge_base.json:', err.message);
}

function getCkbEntry(text = '', currentClinicalState = {}) {
  const searchStr = `${text} ${(currentClinicalState.chief_complaints || []).join(' ')} ${(currentClinicalState.symptoms || []).join(' ')}`.toLowerCase();

  for (const entry of ckbDatabase) {
    if (searchStr.includes(entry.complaint.toLowerCase())) return entry;
    if (entry.synonyms && entry.synonyms.some((s) => searchStr.includes(s.toLowerCase()))) return entry;
  }

  // Fallback generic clinical entry
  return (
    ckbDatabase[0] || {
      complaint_id: 'ckb_general',
      complaint: 'general symptom',
      questions: [
        {
          dimension: 'duration',
          priority: 10,
          question: {
            'en-IN': 'When did this symptom begin and how long have you had it?',
            'hi-IN': 'यह परेशानी कब शुरू हुई और आपको कितने समय से है?',
            'gu-IN': 'આ તકલીફ ક્યારે શરૂ થઈ અને તમને કેટલા સમયથી છે?',
          },
          quick_chips: {
            'en-IN': ['Since morning', '2-3 days', 'More than 1 week'],
            'hi-IN': ['आज सुबह से', '2-3 दिन से', 'एक हफ्ते से ज्यादा'],
            'gu-IN': ['આજ સવારથી', '૨-૩ દિવસથી', '૧ અઠવાડિયાથી વધુ'],
          },
        },
      ],
    }
  );
}

function selectNextCkbQuestion(ckbEntry, currentClinicalState = {}, langKey = 'en-IN') {
  const answered = new Set(currentClinicalState.answered_questions || []);

  if (currentClinicalState.duration && currentClinicalState.duration.length > 0) answered.add('duration');
  if (currentClinicalState.severity && currentClinicalState.severity.length > 0) answered.add('severity');
  if (currentClinicalState.onset && currentClinicalState.onset.length > 0) answered.add('onset');
  if (currentClinicalState.location && currentClinicalState.location.length > 0) {
    answered.add('location');
    answered.add('location_quadrant');
  }

  const remaining = (ckbEntry.questions || []).filter((q) => !answered.has(q.dimension));
  remaining.sort((a, b) => (b.priority || 0) - (a.priority || 0));

  if (remaining.length > 0) {
    const q = remaining[0];
    const qText = q.question?.[langKey] || q.question?.['en-IN'] || 'Please tell us more about this symptom.';
    const chips = q.quick_chips?.[langKey] || q.quick_chips?.['en-IN'] || [];
    return { question: qText, quick_chips: chips, is_complete: false };
  }

  const completed = {
    'gu-IN': 'તમારો સંપૂર્ણ તબીબી ઈતિહાસ સફળતાપૂર્વક નોંધી લેવામાં આવ્યો છે. અમે તેને ડૉક્ટરની સમીક્ષા માટે તૈયાર કર્યો છે.',
    'hi-IN': 'आपका संपूर्ण मेडिकल इतिहास सफलतापूर्वक दर्ज कर लिया गया है। हमने इसे डॉक्टर की समीक्षा के लिए तैयार कर दिया है।',
    'en-IN': 'Your medical history has been successfully recorded. We have prepared it for the doctor review.',
  };

  return {
    question: completed[langKey] || completed['en-IN'],
    quick_chips: [],
    is_complete: true,
  };
}


/**
 * Contextual Emergency Red Flag Checker
 * A bare symptom (e.g. "I have chest pain", "I have a headache") is NOT an immediate red flag.
 * Only explicit severe combinations (e.g. chest pain + cannot breathe / sweating / faintness) trigger immediate emergency.
 */
export function checkDeterministicRedFlags(text, currentClinicalState = {}) {
  if (!text) return null;
  const textLower = text.toLowerCase().trim();

  const hasChestPain =
    textLower.includes('chest') ||
    textLower.includes('heart attack') ||
    text.includes('છાતી') ||
    text.includes('सीना') ||
    text.includes('સીના') ||
    currentClinicalState.chief_complaints?.some((c) => String(c).toLowerCase().includes('chest') || String(c).includes('છાતી'));

  const hasSevereBreathingDifficulty =
    textLower.includes('cannot breathe') ||
    textLower.includes("can't breathe") ||
    textLower.includes('gasping') ||
    textLower.includes('choking') ||
    textLower.includes('stridor') ||
    textLower.includes('severe difficulty breathing') ||
    textLower.includes('severe breathlessness') ||
    text.includes('શ્વાસ નથી લઈ શકાતો') ||
    text.includes('શ્વાસ લેવામાં ખૂબ તકલીફ') ||
    text.includes('દમ ઘૂંટાવો') ||
    text.includes('સાંસ નહીં આ રહી') ||
    text.includes('सांस नहीं आ रही') ||
    text.includes('दम घुट रहा है');

  const hasSweatingOrRadiationOrFaint =
    textLower.includes('sweat') ||
    textLower.includes('radiat') ||
    textLower.includes('left arm') ||
    textLower.includes('faint') ||
    textLower.includes('dizzy') ||
    textLower.includes('crushing') ||
    text.includes('પરસેવો') ||
    text.includes('ડાબા હાથ') ||
    text.includes('ચક્કર') ||
    text.includes('પસીના') ||
    text.includes('बाएं हाथ') ||
    text.includes('चक्कर');

  const hasHighSeverity =
    textLower.includes('9/10') ||
    textLower.includes('10/10') ||
    textLower.includes('unbearable') ||
    textLower.includes('severe chest pain') ||
    text.includes('અસહ્ય') ||
    text.includes('ખૂબ તીવ્ર છાતી');

  // 1. Cardiovascular Emergency: Chest Pain + (Cannot Breathe OR Sweating/Arm radiation OR High Severity 9-10/10 OR Faintness)
  if (hasChestPain && (hasSevereBreathingDifficulty || hasSweatingOrRadiationOrFaint || hasHighSeverity || textLower.includes('heart attack'))) {
    return {
      detected: true,
      priority: 'HIGH',
      risk_state: 'URGENT_REVIEW_REQUIRED',
      category: 'CARDIOVASCULAR_EMERGENCY',
      reason: 'Chest pain combined with acute breathlessness, diaphoresis, radiation, or severe distress.',
      patient_instruction: {
        'en-IN': 'Some of the symptoms you described (chest discomfort with breathing difficulty/sweating) may require immediate medical attention. Please speak with a doctor or emergency staff right now.',
        'hi-IN': 'सीने में दर्द के साथ सांस लेने में कठिनाई या पसीना आना तुरंत डॉक्टरी जांच की मांग करता है। कृपया तुरंत डॉक्टर या मेडिकल स्टाफ से संपर्क करें।',
        'gu-IN': 'છાતીમાં દુખાવા સાથે શ્વાસ લેવામાં તકલીફ અથવા પરસેવો થવાના લક્ષણો તાત્કાલિક તબીબી તપાસ માંગી લે છે. કૃપા કરીને અત્યારે જ ડૉક્ટર અથવા તબીબી સ્ટાફનો સંપર્ક કરો.'
      }
    };
  }

  // 2. Acute Respiratory Distress
  if (hasSevereBreathingDifficulty) {
    return {
      detected: true,
      priority: 'HIGH',
      risk_state: 'URGENT_REVIEW_REQUIRED',
      category: 'RESPIRATORY_DISTRESS',
      reason: 'Acute severe respiratory distress or inability to breathe.',
      patient_instruction: {
        'en-IN': 'Severe difficulty in breathing requires immediate medical care. Please inform our clinical staff or emergency physician now.',
        'hi-IN': 'सांस लेने में गंभीर कठिनाई के लिए तुरंत डॉक्टरी मदद चाहिए। कृपया तुरंत मेडिकल स्टाफ से संपर्क करें।',
        'gu-IN': 'શ્વાસ લેવામાં ગંભીર તકલીફ માટે તાત્કાલિક તબીબી સહાય જરૂરી છે. કૃપા કરીને તરત જ મેડિકલ સ્ટાફને જણાવો.'
      }
    };
  }

  // 3. Acute Stroke / Neurological Emergency
  if (
    textLower.includes('sudden weakness') ||
    textLower.includes('facial droop') ||
    textLower.includes('slurred speech') ||
    textLower.includes('cannot speak') ||
    textLower.includes('one side paralyzed') ||
    text.includes('અચાનક એક બાજુ નબળાઈ') ||
    text.includes('મોઢું વાંકું') ||
    text.includes('બોલવામાં તકલીફ') ||
    text.includes('અચાનક લકવો') ||
    text.includes('अचानक लकवा') ||
    text.includes('मुंह टेढ़ा')
  ) {
    return {
      detected: true,
      priority: 'HIGH',
      risk_state: 'URGENT_REVIEW_REQUIRED',
      category: 'NEUROLOGICAL_EMERGENCY',
      reason: 'Potential acute stroke or focal neurological deficit.',
      patient_instruction: {
        'en-IN': 'Sudden weakness or speech difficulty requires immediate medical evaluation for stroke. Please notify medical staff immediately.',
        'hi-IN': 'अचानक कमजोरी या बोलने में कठिनाई स्ट्रोक का संकेत हो सकती है। कृपया तुरंत डॉक्टर या स्टाफ से संपर्क करें।',
        'gu-IN': 'અચાનક નબળાઈ અથવા બોલવામાં તકલીફ લકવાનો સંકેત હોઈ શકે છે. કૃપા કરીને તાત્કાલિક સ્ટાફને સંપર્ક કરો.'
      }
    };
  }

  // 4. Acute Severe Hemorrhage
  if (
    textLower.includes('vomiting blood') ||
    textLower.includes('coughing blood') ||
    textLower.includes('large blood') ||
    textLower.includes('black stool') ||
    textLower.includes('uncontrolled bleeding') ||
    text.includes('ઉલ્ટીમાં લોહી') ||
    text.includes('ખાંસીમાં લોહી') ||
    text.includes('કાળા ઝાડા') ||
    text.includes('ઉલ્ટી મેં ખૂન') ||
    text.includes('उल्टी में खून') ||
    text.includes('खांसी में खून')
  ) {
    return {
      detected: true,
      priority: 'HIGH',
      risk_state: 'URGENT_REVIEW_REQUIRED',
      category: 'SEVERE_BLEEDING',
      reason: 'Active severe gastrointestinal or respiratory hemorrhage.',
      patient_instruction: {
        'en-IN': 'Active bleeding or coughing/vomiting blood requires immediate medical review. Please consult medical staff now.',
        'hi-IN': 'उल्टी या खांसी में खून आना गंभीर हो सकता है। कृपया तुरंत डॉक्टर या मेडिकल स्टाफ को दिखाएं।',
        'gu-IN': 'ઉલ્ટી કે ખાંસીમાં લોહી આવવું ગંભીર સ્થિતિ હોઈ શકે છે. કૃપા કરીને તરત જ ડૉક્ટરનો સંપર્ક કરો.'
      }
    };
  }

  // 5. Syncope / Seizures
  if (
    textLower.includes('passed out') ||
    textLower.includes('loss of consciousness') ||
    textLower.includes('blackout') ||
    textLower.includes('seizure') ||
    textLower.includes('fits') ||
    text.includes('બેહોશ થઈ જવું') ||
    text.includes('ખેંચ આવવી') ||
    text.includes('बेहोश हो जाना') ||
    text.includes('दौरा पड़ना')
  ) {
    return {
      detected: true,
      priority: 'HIGH',
      risk_state: 'URGENT_REVIEW_REQUIRED',
      category: 'LOSS_OF_CONSCIOUSNESS',
      reason: 'Syncope, seizure, or altered level of consciousness.',
      patient_instruction: {
        'en-IN': 'Loss of consciousness or seizures require urgent medical assessment. Please alert the attending doctor immediately.',
        'hi-IN': 'बेहोशी या दौरा पड़ने के लक्षण तुरंत डॉक्टरी जांच की मांग करते हैं। कृपया तुरंत डॉक्टर को सूचित करें।',
        'gu-IN': 'બેહોશી અથવા ખેંચ આવવાના લક્ષણો માટે તાત્કાલિક ડૉક્ટરની તપાસ જરૂરી છે. કૃપા કરીને તરત જ સ્ટાફને જણાવો.'
      }
    };
  }

  return null;
}

const INTAKE_SYSTEM_PROMPT = `You are the Senior Clinical History Assistant for "MediKiosk" (Team NextGen).
Your goal is to conduct an empathetic, intelligent, context-aware pre-consultation clinical history.

SAFETY & COMPLIANCE MANDATES:
1. NEVER DIAGNOSE the patient (do NOT say "You have X disease").
2. NEVER PRESCRIBE medications or treatments.
3. NEVER claim clinical certainty.
4. RED FLAG & CONTEXT-AWARE ESCALATION:
   - A bare symptom mention like "I have chest pain" or "I have a headache" is NOT an immediate red flag. Set risk_state = "ASSESSING", do not scare the patient, and gather risk context (onset, severity, radiation, breathing difficulty, sweating) one question at a time.
   - ONLY when an explicit severe/urgent combination is present (e.g. "severe chest pain + cannot breathe / sweating / faintness", "sudden stroke signs", "vomiting blood", "loss of consciousness"), set red_flag.detected = true, priority = HIGH, and advise speaking with clinical staff immediately.
5. PATIENT INTENT & QUESTIONS: If the patient asks a question (e.g. "Should I see a doctor?") or expresses distress ("મને કાઈ ખબર નથી પડતી"), YOU MUST FIRST ANSWER/REASSURE THEM EMPATHETICALLY before asking any follow-up question.
6. NEVER ask for information that is already provided in the clinical state (e.g. if duration or severity is already known, do not re-ask it).
7. Ask EXACTLY ONE question at a time. Keep it clear, natural, and under 30 words.
8. If the patient corrects a symptom (e.g. "No, I don't have fever"), update the state and remove it.
9. Adapt the language strictly according to the patient's preferred language (English, Hindi, or Gujarati).

CLINICAL REASONING PRIORITY:
Step 1: Contextual Red Flag check (Distinguish bare symptom vs explicit emergency combination).
Step 2: Detect Patient Intent (INITIAL_COMPLAINT, SYMPTOM_INFORMATION, PATIENT_QUESTION, REQUEST_FOR_MEDICAL_GUIDANCE, CORRECTION, STOP_REQUEST).
Step 3: If patient asked a question or asked for doctor advice, answer them directly.
Step 4: Clarify Chief Complaint & Location/Character (if not known).
Step 5: Duration & Onset (if not known).
Step 6: Severity / Pain Scale (if not known).
Step 7: Key Associated Symptoms & Risk Context (e.g. chest pain -> radiation, shortness of breath; joint pain -> stiffness, swelling).
Step 8: Check if minimum clinical history is complete. When complete, set history_complete = true.

YOU MUST RESPOND WITH VALID STRICT JSON MATCHING THIS EXACT SCHEMA:
{
  "assistant_message": "Direct response to patient question/concern + single next question in patient's preferred language",
  "intent": "INITIAL_COMPLAINT | SYMPTOM_INFORMATION | PATIENT_QUESTION | REQUEST_FOR_MEDICAL_GUIDANCE | CORRECTION | STOP_REQUEST",
  "risk_state": "LOW_RISK_CONTEXT | ASSESSING | POSSIBLE_RED_FLAG | URGENT_REVIEW_REQUIRED",
  "next_question": "The single follow-up question (or empty if history complete)",
  "quick_chips": ["Short contextual response chip 1", "Chip 2", "Chip 3", "Chip 4"],
  "extracted_entities": {
    "chief_complaint": "Extracted chief complaint in English or null",
    "symptoms": ["Symptom 1", "Symptom 2"],
    "duration": "e.g. 2 years or null",
    "severity": "e.g. 5/10 or null",
    "onset": "e.g. Gradual or null",
    "location": "e.g. Chest or null",
    "associated_symptoms": [],
    "past_medical_history": [],
    "medications": [],
    "negated_symptoms": []
  },
  "red_flag": {
    "detected": false,
    "priority": "LOW",
    "category": "",
    "reason": ""
  },
  "history_complete": false,
  "doctor_review_required": false,
  "session_status": "IN_PROGRESS"
}`;

/**
 * Handle AI Case-Taking Intake Chat Turn
 */
export const handleIntakeChat = async (req, res) => {
  try {
    const {
      session_id = 'session-' + Date.now(),
      patient_id = 'patient-001',
      patient_answer = '',
      message = '',
      language = 'English',
      opd_mode = 'GENERAL',
      current_clinical_state = {},
      conversation_history = [],
    } = req.body;

    const patientText = (patient_answer || message || '').trim();

    if (!patientText) {
      return res.status(400).json({
        success: false,
        error: 'Patient input text is required.',
      });
    }

    // 1. Contextual Red Flag Check First (Rule Engine)
    const ruleRedFlag = checkDeterministicRedFlags(patientText, current_clinical_state);
    if (ruleRedFlag && ruleRedFlag.detected) {
      const langKey = language.toLowerCase().startsWith('gu') ? 'gu-IN' : language.toLowerCase().startsWith('hi') ? 'hi-IN' : 'en-IN';
      const warningMsg = ruleRedFlag.patient_instruction[langKey] || ruleRedFlag.patient_instruction['en-IN'];

      // TODO: Future: Send real-time webhook alert to doctor/staff station and MongoDB
      const doctorAlert = {
        alert_id: `alert-${Date.now()}`,
        session_id,
        patient_id,
        priority: 'HIGH',
        status: 'PENDING_REVIEW',
        category: ruleRedFlag.category,
        reason: ruleRedFlag.reason,
        created_at: new Date().toISOString(),
      };

      return res.status(200).json({
        success: true,
        assistant_message: warningMsg,
        next_question: '',
        quick_chips: [],
        red_flag: {
          detected: true,
          priority: 'HIGH',
          category: ruleRedFlag.category,
          reason: ruleRedFlag.reason,
        },
        doctor_alert: doctorAlert,
        doctor_review_required: true,
        history_complete: false,
        session_status: 'URGENT_REVIEW_REQUIRED',
      });
    }

    // 2. Check if n8n Intake Webhook is available
    const n8nWebhook = process.env.N8N_INTAKE_WEBHOOK || process.env.N8N_WORKFLOW_URL;
    if (n8nWebhook && !n8nWebhook.includes('localhost:5678')) {
      try {
        const n8nRes = await fetch(n8nWebhook, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            session_id,
            patient_id,
            language,
            opd_mode,
            patient_answer: patientText,
            current_clinical_state,
            conversation_history,
          }),
        });

        if (n8nRes.ok) {
          const n8nData = await n8nRes.json();
          if (n8nData && (n8nData.assistant_message || n8nData.output || n8nData?.choices?.[0]?.message?.content)) {
            const assistantMsg = n8nData.assistant_message || n8nData.output || n8nData?.choices?.[0]?.message?.content;
            return res.status(200).json({
              success: true,
              assistant_message: assistantMsg,
              intent: n8nData.intent || 'SYMPTOM_INFORMATION',
              risk_state: n8nData.risk_state || 'ASSESSING',
              next_question: n8nData.next_question || assistantMsg,
              quick_chips: n8nData.quick_chips || [],
              extracted_entities: n8nData.extracted_entities || {},
              red_flag: n8nData.red_flag || { detected: false, priority: 'LOW' },
              history_complete: Boolean(n8nData.history_complete),
              doctor_review_required: Boolean(n8nData.doctor_review_required),
              session_status: n8nData.session_status || 'IN_PROGRESS',
            });
          }
        }
      } catch (n8nErr) {
        console.warn('[n8n Intake Webhook Call Failed, trying Groq AI]:', n8nErr.message);
      }
    }

    // 3. Call Direct Groq Compound / LLM for Context-Aware Clinical Reasoning
    const groqApiKey = process.env.GROQ_API_KEY;
    if (groqApiKey && groqApiKey.startsWith('gsk_')) {
      const candidateModels = ['openai/gpt-oss-120b', 'openai/gpt-oss-20b', 'qwen/qwen3.8-27b', 'groq/compound'];
      
      for (const model of candidateModels) {
        try {
          const groqRes = await fetch('https://api.groq.com/openai/v1/chat/completions', {
            method: 'POST',
            headers: {
              Authorization: `Bearer ${groqApiKey}`,
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({
              model,
              messages: [
                {
                  role: 'system',
                  content: INTAKE_SYSTEM_PROMPT,
                },
                {
                  role: 'user',
                  content: `Patient Input: "${patientText}"
Preferred Language: ${language}
OPD Mode: ${opd_mode}
Current Known Clinical State: ${JSON.stringify(current_clinical_state)}
Recent Conversation Turns: ${JSON.stringify(conversation_history.slice(-6))}`,
                },
              ],
              temperature: 0.2,
              max_tokens: 800,
            }),
          });

          if (groqRes.ok) {
            const data = await groqRes.json();
            const rawContent = data?.choices?.[0]?.message?.content;
            
            let cleaned = String(rawContent || '').trim();
            if (cleaned.startsWith('```json')) {
              cleaned = cleaned.replace(/^```json\s*/, '').replace(/\s*```$/, '');
            } else if (cleaned.startsWith('```')) {
              cleaned = cleaned.replace(/^```\s*/, '').replace(/\s*```$/, '');
            }

            try {
              const parsed = JSON.parse(cleaned);
              if (parsed && (parsed.assistant_message || parsed.next_question)) {
                return res.status(200).json({
                  success: true,
                  ...parsed,
                });
              }
            } catch (jsonErr) {
              console.warn(`[Groq JSON Parse Failed for ${model}]:`, jsonErr.message);
            }
          } else {
            const errBody = await groqRes.text().catch(() => '');
            console.warn(`[Groq API ${model} failed]:`, groqRes.status, errBody);
          }
        } catch (groqErr) {
          console.warn(`[Groq Intake API Call Exception for ${model}]:`, groqErr.message);
        }
      }
    }

    // 4. Deterministic CKB Fallback Engine (Zero-Downtime Local Clinical Intelligence)
    const langKey = language.toLowerCase().startsWith('gu') ? 'gu-IN' : language.toLowerCase().startsWith('hi') ? 'hi-IN' : 'en-IN';
    const ckb = getCkbEntry(patientText, current_clinical_state);
    const selected = selectNextCkbQuestion(ckb, current_clinical_state, langKey);

    return res.status(200).json({
      success: true,
      assistant_message: selected.question,
      intent: 'SYMPTOM_INFORMATION',
      risk_state: 'ASSESSING',
      next_question: selected.question,
      quick_chips: selected.quick_chips,
      extracted_entities: {
        chief_complaint: ckb.complaint,
        symptoms: [ckb.complaint],
      },
      red_flag: {
        detected: false,
        priority: 'LOW',
      },
      history_complete: selected.is_complete || false,
      doctor_review_required: false,
      session_status: selected.is_complete ? 'READY_FOR_SUMMARY' : 'IN_PROGRESS',
      source: 'local_clinical_knowledge_base',
    });
  } catch (err) {
    console.error('[handleIntakeChat Error]:', err);
    return res.status(500).json({
      success: false,
      error: 'Internal server error during clinical history reasoning.',
    });
  }
};

