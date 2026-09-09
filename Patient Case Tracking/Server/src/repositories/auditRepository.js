import { AuditLog } from '../models/AuditLog.js';

/**
 * Audit Repository — Data Access Layer for System & Clinical Audit Logs
 */
export class AuditRepository {
  async create(logData) {
    const log = new AuditLog(logData);
    return log.save();
  }

  async findRecent(limit = 100) {
    return AuditLog.find().sort({ createdAt: -1 }).limit(limit);
  }
}

export const auditRepository = new AuditRepository();
export default auditRepository;
