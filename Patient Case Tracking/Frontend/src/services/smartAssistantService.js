/**
 * Smart Assistant API Service
 * Handles communication with the secure Sehat Assistant API (/api/v1/assistant)
 */

const API_BASE_URL = 'http://localhost:5000/api/v1/assistant';

export async function sendAssistantMessage({
  message,
  language = 'English',
  userContext = {},
  conversationHistory = [],
}) {
  try {
    const response = await fetch(`${API_BASE_URL}/chat`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        message,
        language,
        user_id: userContext.user_id || 'kiosk-user',
        role: userContext.role || 'PATIENT',
        session_id: userContext.session_id || 'kiosk-session-' + Date.now(),
        conversation_history: conversationHistory,
      }),
    });

    if (!response.ok) {
      const errData = await response.json().catch(() => ({}));
      return {
        success: false,
        message: errData.message || 'Sorry, I could not process your request at the moment. Please try again.',
        intent: 'SERVICE_ERROR',
        urgent: false,
        requires_doctor: false,
      };
    }

    const data = await response.json();
    return data;
  } catch (error) {
    console.warn('[SmartAssistantService Error]:', error.message);
    return {
      success: false,
      message: 'Assistant service is currently offline. Please consult the hospital reception or emergency desk.',
      intent: 'OFFLINE_FALLBACK',
      urgent: false,
      requires_doctor: false,
    };
  }
}

export async function fetchQuickActions(role = 'PATIENT', language = 'English') {
  try {
    const res = await fetch(`${API_BASE_URL}/quick-actions?role=${role}&language=${language}`);
    if (res.ok) {
      const data = await res.json();
      return data.data || [];
    }
  } catch (e) {}

  return [
    { id: 'website_help', label: 'Website Help', action: 'query', text: 'How does Sehat work?' },
    { id: 'medicine_help', label: 'Medicine Helper', action: 'query', text: 'Tell me about Paracetamol' },
    { id: 'cold_care', label: 'Cold & Cough Care', action: 'query', text: 'What can I do for a mild cold?' },
    { id: 'emergency_help', label: 'Emergency Numbers', action: 'query', text: 'Hospital emergency contact' },
  ];
}

export default {
  sendAssistantMessage,
  fetchQuickActions,
};
