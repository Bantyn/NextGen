import { CaseMessage } from '../models/CaseMessage.js';

/**
 * Case Message Repository — Data Access Layer for Dialogue Turns
 */
export class CaseMessageRepository {
  async create(messageData) {
    const message = new CaseMessage(messageData);
    return message.save();
  }

  async findBySessionId(sessionId) {
    return CaseMessage.find({ session_id: sessionId }).sort({ createdAt: 1 });
  }

  async bulkCreate(messages) {
    return CaseMessage.insertMany(messages);
  }

  async countBySessionId(sessionId) {
    return CaseMessage.countDocuments({ session_id: sessionId });
  }
}

export const caseMessageRepository = new CaseMessageRepository();
export default caseMessageRepository;
