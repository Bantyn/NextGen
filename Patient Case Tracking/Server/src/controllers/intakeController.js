import dotenv from 'dotenv';
dotenv.config();

/**
 * Deterministic Clinical Red Flag Knowledge Base
 * Multilingual rules across English, Hindi, and Gujarati
 */
export const RED_FLAG_DEFINITIONS = [
  {
    category: 'CARDIOVASCULAR_EMERGENCY',
    priority: 'HIGH',
    triggers: [
      'crushing chest pain', 'chest pain radiating to arm', 'chest pain and sweating',
      'left arm pain', 'chest pressure and breathlessness', 'heart attack',
      'છાતીમાં ભારે દબાણ', 'છાતીનો દુખાવો ડાબા હાથમાં', 'છાતીમાં દુખાવો અને ખૂબ પરસેવો',
      'સીને મેં તેજ દર્દ', 'સીને કા દર્દ હાથ મેં', 'સીને મેં દબાવ ઔર પસીના',
      'सीने में तेज दर्द', 'सीने का दर्द बाएं हाथ में', 'सीने में भारी दबाव और सांस फूलना'
    ],
    reason: 'Possible acute coronary syndrome or myocardial ischemia. Immediate triage ECG and emergency physician evaluation required.',
    patient_instruction: {
      'en-IN': 'Some of the symptoms you described (chest pain/pressure) may require immediate medical attention. Please speak with a doctor or emergency staff right now.',
      'hi-IN': 'सीने में तेज दर्द और भारीपन के लक्षण तुरंत डॉक्टरी जांच की मांग करते हैं। कृपया तुरंत इमरजेंसी डॉक्टर या मेडिकल स्टाफ से संपर्क करें।',
      'gu-IN': 'છાતીમાં ભારે દબાણ અથવા દુખાવાના લક્ષણો તાત્કાલિક તબીબી તપાસ માંગી લે છે. કૃપા કરીને હમણાં જ ડૉક્ટર અથવા ઇમરજન્સી સ્ટાફનો સંપર્ક કરો.'
    }
  },
  {
    category: 'RESPIRATORY_DISTRESS',
    priority: 'HIGH',
    triggers: [
      'severe breathing difficulty', 'cannot breathe', 'gasping for air', 'stridor', 'choking',
      'શ્વાસ લેવામાં ખૂબ તકલીફ', 'શ્વાસ નથી લઈ શકાતો', 'દમ ઘૂંટાવો',
      'सांस लेने में बहुत तकलीफ', 'सांस नहीं आ रही', 'दम घुट रहा है'
    ],
    reason: 'Acute severe respiratory distress or airway compromise.',
    patient_instruction: {
      'en-IN': 'Severe difficulty in breathing requires immediate medical care. Please inform our clinical staff or emergency physician now.',
      'hi-IN': 'सांस लेने में गंभीर कठिनाई के लिए तुरंत डॉक्टरी मदद चाहिए। कृपया तुरंत मेडिकल स्टाफ से संपर्क करें।',
      'gu-IN': 'શ્વાસ લેવામાં ગંભીર તકલીફ માટે તાત્કાલિક તબીબી સહાય જરૂરી છે. કૃપા કરીને તરત જ મેડિકલ સ્ટાફને જણાવો.'
    }
  },
  {
    category: 'NEUROLOGICAL_EMERGENCY',
    priority: 'HIGH',
    triggers: [
      'sudden weakness', 'facial droop', 'slurred speech', 'cannot speak', 'one side paralyzed', 'sudden numbness',
      'અચાનક એક બાજુ નબળાઈ', 'મોઢું વાંકું થવું', 'બોલવામાં તકલીફ', 'અચાનક લકવો',
      'अचानक एक तरफ कमजोरी', 'मुंह टेढ़ा होना', 'बोलने में लड़खड़ाहट', 'अचानक लकवा'
    ],
    reason: 'Potential acute stroke or focal neurological deficit (FAST criteria).',
    patient_instruction: {
      'en-IN': 'Sudden weakness or speech difficulty requires immediate medical evaluation for stroke. Please notify medical staff immediately.',
      'hi-IN': 'अचानक कमजोरी या बोलने में कठिनाई स्ट्रोक का संकेत हो सकती है। कृपया तुरंत डॉक्टर या स्टाफ से संपर्क करें।',
      'gu-IN': 'અચાનક નબળાઈ અથવા બોલવામાં તકલીફ લકવાનો સંકેત હોઈ શકે છે. કૃપા કરીને તાત્કાલિક સ્ટાફને સંપર્ક કરો.'
    }
  },
  {
    category: 'SEVERE_BLEEDING',
    priority: 'HIGH',
    triggers: [
      'vomiting blood', 'coughing blood', 'large blood', 'black stool', 'uncontrolled bleeding',
      'ઉલ્ટીમાં લોહી', 'ખાંસીમાં લોહી', 'કાળા ઝાડા', 'લોહી બંધ ન થવું',
      'उल्टी में खून', 'खांसी में खून', 'काला मल', 'खून बहना बंद न होना'
    ],
    reason: 'Active severe gastrointestinal or respiratory hemorrhage.',
    patient_instruction: {
      'en-IN': 'Active bleeding or coughing/vomiting blood requires immediate medical review. Please consult medical staff now.',
      'hi-IN': 'उल्टी या खांसी में खून आना गंभीर हो सकता है। कृपया तुरंत डॉक्टर या मेडिकल स्टाफ को दिखाएं।',
      'gu-IN': 'ઉલ્ટી કે ખાંસીમાં લોહી આવવું ગંભીર સ્થિતિ હોઈ શકે છે. કૃપા કરીને તરત જ ડૉક્ટરનો સંપર્ક કરો.'
    }
  },
  {
    category: 'LOSS_OF_CONSCIOUSNESS',
    priority: 'HIGH',
    triggers: [
      'passed out', 'fainted', 'loss of consciousness', 'blackout', 'seizure', 'fits',
      'બેહોશ થઈ જવું', 'ચક્કર આવીને પડી જવું', 'ખેંચ આવવી',
      'बेहोश हो जाना', 'चक्कर खाकर गिरना', 'दौरा पड़ना'
    ],
    reason: 'Syncope, seizure, or altered level of consciousness.',
    patient_instruction: {
      'en-IN': 'Loss of consciousness or seizures require urgent medical assessment. Please alert the attending doctor immediately.',
      'hi-IN': 'बेहोशी या दौरा पड़ने के लक्षण तुरंत डॉक्टरी जांच की मांग करते हैं। कृपया तुरंत डॉक्टर को सूचित करें।',
      'gu-IN': 'બેહોશી અથવા ખેંચ આવવાના લક્ષણો માટે તાત્કાલિક ડૉક્ટરની તપાસ જરૂરી છે. કૃપા કરીને તરત જ સ્ટાફને જણાવો.'
    }
  }
];

/**
 * Deterministic Red Flag Checker
 */
export function checkDeterministicRedFlags(text) {
  if (!text) return null;
  const lower = text.toLowerCase();

  for (const def of RED_FLAG_DEFINITIONS) {
    for (const trigger of def.triggers) {
      if (lower.includes(trigger.toLowerCase()) || text.includes(trigger)) {
        return {
          detected: true,
          priority: def.priority,
          category: def.category,
          reason: def.reason,
          patient_instruction: def.patient_instruction,
        };
      }
    }
  }
  return null;
}

const INTAKE_SYSTEM_PROMPT = `You are the Senior Clinical History Assistant for "MediKiosk" (Team NextGen).
Your goal is to conduct an empathetic, intelligent, and context-aware pre-consultation clinical history.

SAFETY & COMPLIANCE MANDATES:
1. NEVER DIAGNOSE the patient (do NOT say "You have X disease").
2. NEVER PRESCRIBE medications or treatments.
3. NEVER claim clinical certainty.
4. Ask EXACTLY ONE question at a time. Keep it clear, empathetic, and under 30 words.
5. NEVER ask for information that is already provided in the clinical state.
6. If the patient corrects a symptom (e.g. "No, I don't have fever"), update the state and remove it.
7. If RED FLAG / EMERGENCY symptoms exist (crushing chest pain, acute dyspnea, stroke signs, severe hemorrhage), set red_flag.detected = true, priority = HIGH, and advise speaking with clinical staff immediately.
8. Adapt the language strictly according to the patient's preferred language (English, Hindi, or Gujarati).

CLINICAL REASONING PRIORITY:
Step 1: Emergency & Red Flag check.
Step 2: Clarify Chief Complaint & Location/Character (e.g. SOCRATES for pain).
Step 3: Onset, Duration, and Progression.
Step 4: Severity (1-10 scale or Mild/Moderate/Severe).
Step 5: Pertinent Associated Symptoms (e.g. Stomach pain -> vomiting, fever, bowel habits; Chest pain -> radiation, sweating, breathlessness).
Step 6: Relevant Past Medical History (Diabetes, HTN, etc.) and Current Medications.
Step 7: Check if minimum clinical history is complete (chief complaint + duration + severity + key associated symptoms + past history noted). When complete, set history_complete = true.

YOU MUST RESPOND WITH VALID STRICT JSON MATCHING THIS EXACT SCHEMA:
{
  "assistant_message": "Empathetic spoken response and the single next question in the patient's preferred language",
  "next_question": "The single follow-up question",
  "quick_chips": ["Short contextual response chip 1", "Chip 2", "Chip 3", "Chip 4"],
  "extracted_entities": {
    "chief_complaint": "Extracted chief complaint in English or null",
    "symptoms": ["Symptom 1", "Symptom 2"],
    "duration": "e.g. 3 days or null",
    "severity": "e.g. Severe / 7/10 or null",
    "onset": "e.g. Sudden / Gradual or null",
    "associated_symptoms": ["e.g. Nausea", "Vomiting"],
    "past_medical_history": ["e.g. Diabetes"],
    "current_medications": ["e.g. Metformin"],
    "allergies": [],
    "negated_symptoms": ["Symptom negated by patient"]
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

    // 1. Deterministic Red Flag Check First (Rule Engine)
    const ruleRedFlag = checkDeterministicRedFlags(patientText);
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

    // 2. Call Direct Groq Compound LLM for Context-Aware Clinical Reasoning
    const groqApiKey = process.env.GROQ_API_KEY;
    if (groqApiKey && groqApiKey.startsWith('gsk_')) {
      try {
        const groqRes = await fetch('https://api.groq.com/openai/v1/chat/completions', {
          method: 'POST',
          headers: {
            Authorization: `Bearer ${groqApiKey}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            model: 'groq/compound-mini',
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
            return res.status(200).json({
              success: true,
              ...parsed,
            });
          } catch (jsonErr) {
            console.warn('[Groq JSON Parse Failed, using fallback parser]:', jsonErr.message);
          }
        }
      } catch (groqErr) {
        console.warn('[Groq Intake API Call Exception]:', groqErr.message);
      }
    }

    // 3. Fallback: Intelligent Heuristic Response
    return res.status(200).json({
      success: true,
      assistant_message: `Understood. Could you tell me more about when this started and how severe it feels?`,
      next_question: `When did this start?`,
      quick_chips: ['Today', '1-2 days ago', 'More than a week ago'],
      extracted_entities: {
        symptoms: [patientText.slice(0, 30)],
      },
      red_flag: { detected: false, priority: 'LOW', reason: '' },
      history_complete: false,
      doctor_review_required: false,
      session_status: 'IN_PROGRESS',
    });
  } catch (err) {
    console.error('[handleIntakeChat Error]:', err);
    return res.status(500).json({
      success: false,
      error: err.message,
    });
  }
};
