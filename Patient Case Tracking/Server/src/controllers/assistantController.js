import dotenv from 'dotenv';
import {
  searchMedicine,
  getMedicineInfo,
  getSymptomGuidance,
  getWebsiteHelp,
  getFAQ,
  getContactInfo,
} from '../services/assistantService.js';

dotenv.config();

// Simple in-memory rate limiter: max 30 requests per minute per IP/session
const rateLimitMap = new Map();
const RATE_LIMIT_WINDOW_MS = 60 * 1000;
const MAX_REQUESTS_PER_WINDOW = 30;

function checkRateLimit(key) {
  const now = Date.now();
  const record = rateLimitMap.get(key) || { count: 0, resetTime: now + RATE_LIMIT_WINDOW_MS };

  if (now > record.resetTime) {
    record.count = 1;
    record.resetTime = now + RATE_LIMIT_WINDOW_MS;
    rateLimitMap.set(key, record);
    return true;
  }

  if (record.count >= MAX_REQUESTS_PER_WINDOW) {
    return false;
  }

  record.count++;
  rateLimitMap.set(key, record);
  return true;
}

// Clean up stale rate limits every 5 minutes
setInterval(() => {
  const now = Date.now();
  for (const [k, v] of rateLimitMap.entries()) {
    if (now > v.resetTime) rateLimitMap.delete(k);
  }
}, 5 * 60 * 1000);

/**
 * Contextual Emergency Red Flag Evaluator
 */
function evaluateContextualEmergency(text) {
  if (!text) return null;
  const t = text.toLowerCase();

  const hasChestPain = t.includes('chest') || t.includes('heart attack') || text.includes('છાતી') || text.includes('सीना');
  const hasSevereBreathing = t.includes('cannot breathe') || t.includes("can't breathe") || t.includes('gasping') || text.includes('શ્વાસ નથી લઈ શકાતો') || text.includes('सांस नहीं आ रही');
  const hasDiaphoresisOrRadiation = t.includes('sweat') || t.includes('left arm') || t.includes('jaw') || text.includes('પરસેવો') || text.includes('પસીના') || text.includes('पसीना');
  const hasSevereDistress = t.includes('9/10') || t.includes('10/10') || t.includes('unbearable') || t.includes('crushing');

  if (hasChestPain && (hasSevereBreathing || hasDiaphoresisOrRadiation || hasSevereDistress || t.includes('heart attack'))) {
    return {
      urgent: true,
      category: 'CARDIOVASCULAR_EMERGENCY',
      reason: 'Chest pain combined with shortness of breath, radiating pain, or severe distress.',
    };
  }

  if (hasSevereBreathing) {
    return {
      urgent: true,
      category: 'RESPIRATORY_DISTRESS',
      reason: 'Acute severe difficulty in breathing or gasping.',
    };
  }

  if (t.includes('vomiting blood') || t.includes('coughing blood') || text.includes('ઉલ્ટીમાં લોહી') || text.includes('उल्टी में खून')) {
    return {
      urgent: true,
      category: 'SEVERE_HEMORRHAGE',
      reason: 'Active respiratory or gastrointestinal bleeding.',
    };
  }

  if (t.includes('facial droop') || t.includes('slurred speech') || t.includes('sudden paralysis') || text.includes('અચાનક લકવો') || text.includes('अचानक लकवा')) {
    return {
      urgent: true,
      category: 'STROKE_EMERGENCY',
      reason: 'Signs of acute stroke or focal neurological deficit.',
    };
  }

  if (t.includes('passed out') || t.includes('loss of consciousness') || text.includes('બેહોશ') || text.includes('बेहोश')) {
    return {
      urgent: true,
      category: 'LOSS_OF_CONSCIOUSNESS',
      reason: 'Syncope or sudden loss of consciousness.',
    };
  }

  return null;
}

/**
 * Prompt Injection & Abuse Sanitizer
 */
function sanitizeInput(text) {
  if (!text || typeof text !== 'string') return '';
  let sanitized = text.slice(0, 800).trim();

  // Strip system override patterns
  const injectionPatterns = [
    /ignore (all )?previous instructions/gi,
    /system prompt/gi,
    /show (me )?(the )?database/gi,
    /drop collection/gi,
    /\$where/gi,
    /execute (this )?query/gi,
  ];

  for (const pattern of injectionPatterns) {
    sanitized = sanitized.replace(pattern, '[filtered]');
  }

  return sanitized;
}

/**
 * Intent Classifier
 */
function classifyIntent(text) {
  const t = text.toLowerCase();

  if (t.includes('medicine') || t.includes('tablet') || t.includes('syrup') || t.includes('paracetamol') || t.includes('dolo') || t.includes('azithromycin') || t.includes('cetirizine') || t.includes('pantoprazole') || t.includes('ibuprofen') || t.includes('ors') || t.includes('દવા') || t.includes('दवा') || t.includes('गोली')) {
    return 'MEDICINE_INFORMATION';
  }

  if (t.includes('headache') || t.includes('cold') || t.includes('cough') || t.includes('fever') || t.includes('acidity') || t.includes('pain') || t.includes('દુખાવો') || t.includes('તાવ') || t.includes('ખાંસી') || t.includes('बुखार') || t.includes('दर्द') || t.includes('खांसी')) {
    return 'SYMPTOM_GUIDANCE';
  }

  if (t.includes('contact') || t.includes('phone') || t.includes('helpline') || t.includes('emergency number') || t.includes('ambulance') || t.includes('નંબર') || t.includes('ફોન') || t.includes('फोन') || t.includes('संपर्क')) {
    return 'CONTACT';
  }

  if (t.includes('abha') || t.includes('faq') || t.includes('privacy') || t.includes('security') || t.includes('data') || t.includes('how does') || t.includes('કેવી રીતે') || t.includes('कैसे')) {
    return 'FAQ';
  }

  if (t.includes('register') || t.includes('checkin') || t.includes('intake') || t.includes('ocr') || t.includes('upload') || t.includes('doctor') || t.includes('kiosk') || t.includes('tracking') || t.includes('queue') || t.includes('token') || t.includes('ઓપીડી') || t.includes('ओपीडी')) {
    return 'WEBSITE_HELP';
  }

  return 'GENERAL_HELP';
}

const SMART_ASSISTANT_SYSTEM_PROMPT = `You are the "Smart AI Assistant" for MediKiosk (Team NextGen) — an intelligent, empathetic, and security-hardened clinical platform guide.

YOUR PRIMARY CAPABILITIES:
1. Website navigation & features (Kiosk Check-in, Voice Intake, Document OCR, Doctor Consultation Portal, Token Tracking).
2. Approved Medicine Information Helper using ONLY provided verified MongoDB records.
3. Nominal Symptom Guidance (mild cold, mild tension headache, mild acidity) using safe lifestyle/AYUSH home-care measures.
4. FAQs, hospital contacts, and emergency assistance.

CRITICAL SAFETY & MEDICAL BOUNDARIES:
- NEVER DIAGNOSE DISEASES: Do NOT say "You have X condition". Use "These symptoms may have several causes".
- NEVER PRESCRIBE DOSAGES: Do NOT independently calculate or recommend prescription drug dosages (e.g. "Take 500mg three times daily"). Inform the user about general usage from the database and advise consulting their doctor/pharmacist.
- ZERO HALLUCINATION: If a medicine or question is not available in the provided database records, state honestly:
  "I don't have verified information for that in the current knowledge base. Please consult a qualified doctor or pharmacist."
- CONTEXTUAL EMERGENCY TRIAGE: If the user describes an urgent situation (e.g. severe chest pain with breathing difficulty/sweating, stroke symptoms, uncontrolled bleeding), immediately advise seeking emergency medical attention and provide helpline numbers (108 / 102).
- RESPECT USER LANGUAGE: Reply strictly in the user's requested language (English, Hindi, or Gujarati). Keep replies clear, warm, concise (40-60 words), and well-formatted.`;

/**
 * Main Controller: Handle Smart Assistant Chat Turn
 */
export async function handleAssistantChat(req, res) {
  try {
    const clientIp = req.ip || req.headers['x-forwarded-for'] || '127.0.0.1';
    const {
      message = '',
      language = 'English',
      user_id = 'guest-user',
      role = 'PATIENT',
      session_id = 'assistant-session-' + Date.now(),
      conversation_history = [],
    } = req.body;

    // 1. Rate Limit Check
    if (!checkRateLimit(`${clientIp}-${session_id}`)) {
      return res.status(429).json({
        success: false,
        message: 'You have sent too many requests. Please wait a moment before trying again.',
        intent: 'RATE_LIMITED',
        urgent: false,
        requires_doctor: false,
      });
    }

    // 2. Input Sanitization
    const userText = sanitizeInput(message);
    if (!userText) {
      return res.status(400).json({
        success: false,
        message: 'Please provide a valid message.',
        intent: 'INVALID_INPUT',
        urgent: false,
        requires_doctor: false,
      });
    }

    // 3. Contextual Emergency Red Flag Check
    const emergency = evaluateContextualEmergency(userText);
    if (emergency && emergency.urgent) {
      const emergencyContacts = await getContactInfo('Emergency');
      const langLower = language.toLowerCase();
      let alertMsg = 'Some of the symptoms you described (such as severe chest discomfort or breathing difficulty) require immediate emergency medical evaluation. Please contact emergency services (108 / 102) or proceed to the nearest emergency trauma center immediately.';
      
      if (langLower.startsWith('hi')) {
        alertMsg = 'आपके द्वारा बताए गए लक्षण (जैसे सीने में तेज दर्द या सांस लेने में परेशानी) तुरंत आपातकालीन डॉक्टरी जांच की मांग करते हैं। कृपया तुरंत आपातकालीन नंबर (108 / 102) पर कॉल करें या नजदीकी अस्पताल के इमरजेंसी वार्ड में जाएं।';
      } else if (langLower.startsWith('gu')) {
        alertMsg = 'તમે જણાવેલ લક્ષણો (જેમ કે છાતીમાં તીવ્ર દુખાવો અથવા શ્વાસ લેવામાં તકલીફ) તાત્કાલિક કટોકટી તબીબી તપાસ માંગી લે છે. કૃપા કરીને તાત્કાલિક ઇમરજન્સી હેલ્પલાઇન (108 / 102) પર સંપર્ક કરો અથવા નજીકના ટ્રોમા સેન્ટર પર પહોંચો.';
      }

      return res.status(200).json({
        success: true,
        message: alertMsg,
        intent: 'EMERGENCY_CONCERN',
        source: 'safety_logic',
        urgent: true,
        requires_doctor: true,
        data: {
          emergency_category: emergency.category,
          emergency_contacts: emergencyContacts,
        },
        quick_actions: ['Call Emergency (108)', 'Hospital Location', 'OPD Reception'],
      });
    }

    // 4. Intent Classification & Controlled MongoDB Tool Selection
    const detectedIntent = classifyIntent(userText);
    let toolResult = null;
    let toolName = 'none';

    switch (detectedIntent) {
      case 'MEDICINE_INFORMATION': {
        toolName = 'searchMedicine';
        const meds = await searchMedicine(userText);
        if (meds.length > 0) {
          toolResult = meds;
        } else {
          toolResult = { not_found: true, query: userText };
        }
        break;
      }
      case 'SYMPTOM_GUIDANCE': {
        toolName = 'getSymptomGuidance';
        toolResult = await getSymptomGuidance(userText);
        break;
      }
      case 'CONTACT': {
        toolName = 'getContactInfo';
        toolResult = await getContactInfo(userText);
        break;
      }
      case 'FAQ': {
        toolName = 'getFAQ';
        toolResult = await getFAQ(userText);
        break;
      }
      case 'WEBSITE_HELP': {
        toolName = 'getWebsiteHelp';
        toolResult = await getWebsiteHelp(userText, role);
        break;
      }
      default: {
        toolName = 'generalKnowledge';
        toolResult = {
          website_summary: 'MediKiosk is an autonomous clinical pre-consultation platform offering multilingual voice intake, prescription OCR, and live patient queue tracking.',
        };
        break;
      }
    }

    // 5. Try n8n Smart Assistant Webhook if available
    const n8nWebhook = process.env.N8N_ASSISTANT_WEBHOOK || process.env.N8N_WORKFLOW_URL;
    if (n8nWebhook && !n8nWebhook.includes('localhost:5678')) {
      try {
        const n8nRes = await fetch(n8nWebhook, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            message: userText,
            language,
            user_context: { user_id, role, session_id },
            intent: detectedIntent,
            tool_data: toolResult,
            conversation_history: conversation_history.slice(-4),
          }),
        });

        if (n8nRes.ok) {
          const n8nData = await n8nRes.json();
          if (n8nData && (n8nData.message || n8nData.output || n8nData?.choices?.[0]?.message?.content)) {
            return res.status(200).json({
              success: true,
              message: n8nData.message || n8nData.output || n8nData?.choices?.[0]?.message?.content,
              intent: n8nData.intent || detectedIntent,
              source: 'n8n_agent',
              urgent: false,
              requires_doctor: Boolean(n8nData.requires_doctor),
              data: toolResult,
              quick_actions: n8nData.quick_actions || ['Website Help', 'Medicine Helper', 'Patient Intake', 'Contact Desk'],
            });
          }
        }
      } catch (n8nErr) {
        console.warn('[n8n Assistant Webhook exception, trying Groq AI fallback]:', n8nErr.message);
      }
    }

    // 6. Direct Groq AI Reasoning (Multi-Model Pool Fallback)
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
                  content: `${SMART_ASSISTANT_SYSTEM_PROMPT}\n\nVERIFIED KNOWLEDGE BASE CONTEXT (From MongoDB Tools):\n${JSON.stringify(toolResult, null, 2)}`,
                },
                {
                  role: 'user',
                  content: `User Statement: "${userText}"\nUser Role: ${role}\nLanguage: ${language}\nRecent History: ${JSON.stringify(conversation_history.slice(-4))}`,
                },
              ],
              temperature: 0.3,
              max_tokens: 600,
            }),
          });

          if (groqRes.ok) {
            const data = await groqRes.json();
            const aiMsg = data?.choices?.[0]?.message?.content?.trim();

            if (aiMsg) {
              return res.status(200).json({
                success: true,
                message: aiMsg,
                intent: detectedIntent,
                source: 'mongodb_groq',
                urgent: false,
                requires_doctor: detectedIntent === 'MEDICINE_INFORMATION' || detectedIntent === 'SYMPTOM_GUIDANCE',
                data: toolResult,
                quick_actions: ['Website Help', 'Medicine Helper', 'Patient Intake', 'Contact Support'],
              });
            }
          }
        } catch (modelErr) {
          console.warn(`[Groq AI ${model} failed]:`, modelErr.message);
        }
      }
    }

    // 7. Deterministic Local Tool Fallback (Zero Hallucination Guaranteed)
    let fallbackMsg = '';
    if (detectedIntent === 'MEDICINE_INFORMATION' && Array.isArray(toolResult) && toolResult.length > 0) {
      const med = toolResult[0];
      fallbackMsg = `**${med.name}** (${med.generic_name})\n\n- **Category:** ${med.category}\n- **Purpose:** ${med.purpose}\n- **Dosage Forms:** ${med.dosage_forms?.join(', ')}\n- **Usage Info:** ${med.general_usage_info}\n- **Key Precautions:** ${med.precautions_and_warnings?.join(' ')}\n- **Storage:** ${med.storage_instructions}\n\n*Note: This is informational database guidance. Always consult a physician or pharmacist for medical decisions.*`;
    } else if (detectedIntent === 'SYMPTOM_GUIDANCE' && toolResult && toolResult.title) {
      fallbackMsg = `**${toolResult.title}**\n\n${toolResult.description}\n\n**Allowed Home Care:**\n${toolResult.allowed_nominal_advice?.map((a) => `• ${a}`).join('\n')}\n\n**AYUSH Tips:**\n${toolResult.ayush_care_tips?.map((t) => `• ${t}`).join('\n')}\n\n*Caution: If symptoms worsen, visit the OPD consultation room.*`;
    } else if (detectedIntent === 'CONTACT' && Array.isArray(toolResult)) {
      fallbackMsg = `**Hospital Support Contacts:**\n\n${toolResult.map((c) => `• **${c.department}**: ${c.phone} (${c.hours}) - ${c.location}`).join('\n')}`;
    } else {
      fallbackMsg = `I am your MediKiosk Smart Assistant. I can help you with website navigation, medicine details from our verified database, nominal symptom guidance, and hospital support. How may I assist you today?`;
    }

    return res.status(200).json({
      success: true,
      message: fallbackMsg,
      intent: detectedIntent,
      source: 'local_mongodb_heuristics',
      urgent: false,
      requires_doctor: false,
      data: toolResult,
      quick_actions: ['Website Help', 'Medicine Helper', 'Patient Intake', 'Contact Support'],
    });
  } catch (err) {
    console.error('[handleAssistantChat Error]:', err);
    return res.status(500).json({
      success: false,
      message: "Sorry, I couldn't process that request right now. Please try again or visit our help desk.",
      intent: 'SYSTEM_ERROR',
      urgent: false,
      requires_doctor: false,
    });
  }
}

/**
 * Controller: Get Role-Specific Quick Actions
 */
export async function getQuickActions(req, res) {
  const role = (req.query.role || 'PATIENT').toUpperCase();
  const language = req.query.language || 'English';

  const actions = {
    PATIENT: [
      { id: 'start_intake', label: 'Start Patient Intake', action: 'navigate', route: '/patient/register' },
      { id: 'medicine_help', label: 'Medicine Information', action: 'query', text: 'Tell me about Paracetamol' },
      { id: 'cold_guidance', label: 'Cold & Cough Care', action: 'query', text: 'What can I do for a mild cold?' },
      { id: 'hospital_contacts', label: 'Emergency & Help Desk', action: 'query', text: 'Hospital contact numbers' },
      { id: 'abha_info', label: 'What is ABHA?', action: 'query', text: 'What is ABHA ID?' },
    ],
    DOCTOR: [
      { id: 'doctor_portal', label: 'Doctor OPD Portal', action: 'navigate', route: '/doctor' },
      { id: 'triage_guidelines', label: 'Triage Guidelines', action: 'query', text: 'How does red-flag triage work?' },
      { id: 'dashavidha_info', label: 'Dashavidha Protocol', action: 'query', text: 'Explain Dashavidha Pariksha' },
    ],
  };

  return res.status(200).json({
    success: true,
    data: actions[role] || actions.PATIENT,
  });
}

/**
 * Controller: Execute Direct Tool for Testing & n8n Tool Calling
 */
export async function handleToolExecution(req, res) {
  try {
    const { toolName } = req.params;
    const query = req.query.q || req.body.q || '';

    let result = null;
    switch (toolName) {
      case 'searchMedicine':
        result = await searchMedicine(query);
        break;
      case 'getMedicineInfo':
        result = await getMedicineInfo(query);
        break;
      case 'getSymptomGuidance':
        result = await getSymptomGuidance(query);
        break;
      case 'getWebsiteHelp':
        result = await getWebsiteHelp(query);
        break;
      case 'getFAQ':
        result = await getFAQ(query);
        break;
      case 'getContactInfo':
        result = await getContactInfo(query);
        break;
      default:
        return res.status(404).json({ success: false, error: 'Unknown tool name' });
    }

    return res.status(200).json({ success: true, tool: toolName, data: result });
  } catch (err) {
    return res.status(500).json({ success: false, error: err.message });
  }
}

export default {
  handleAssistantChat,
  getQuickActions,
  handleToolExecution,
};
