import { caseMessageRepository } from '../repositories/caseMessageRepository.js';
import { sessionRepository } from '../repositories/sessionRepository.js';
import { ApiError } from '../utils/apiError.js';

/**
 * Case Message Service — Pure Domain Logic for Dialogue Turns
 */
export class CaseMessageService {
  async postMessage({ session_id, sender, message, message_type = 'TEXT', metadata = {} }) {
    if (!session_id || !sender || !message) {
      throw ApiError.badRequest('session_id, sender, and message are required fields.', 'MISSING_FIELDS');
    }

    const session = await sessionRepository.findBySessionId(session_id);
    if (!session) {
      throw ApiError.notFound(`Clinical session '${session_id}' does not exist.`, 'SESSION_NOT_FOUND');
    }

    const caseMessage = await caseMessageRepository.create({
      session_id,
      sender,
      message,
      message_type,
      metadata,
    });

    return caseMessage;
  }

  async getSessionMessages(sessionId) {
    const messages = await caseMessageRepository.findBySessionId(sessionId);
    return messages;
  }
}

export const caseMessageService = new CaseMessageService();
export default caseMessageService;
