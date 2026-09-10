import { RedFlagCase, RED_FLAG_STATUS } from '../models/RedFlagCase.js';

/**
 * Red Flag Case Repository — Direct Database Access Layer
 * Centralizes all Mongoose queries for red flag cases and atomic claim concurrency.
 */
export class RedFlagRepository {
  async create(caseData) {
    const redFlagCase = new RedFlagCase(caseData);
    return redFlagCase.save();
  }

  async findByCaseId(caseId) {
    if (!caseId) return null;
    return RedFlagCase.findOne({ case_id: caseId.toUpperCase().trim() });
  }

  async findActiveBySessionOrPatient(sessionId, patientId) {
    const query = {
      status: {
        $in: [
          RED_FLAG_STATUS.DETECTED,
          RED_FLAG_STATUS.BROADCASTING,
          RED_FLAG_STATUS.ACKNOWLEDGED,
          RED_FLAG_STATUS.ASSIGNED,
          RED_FLAG_STATUS.IN_CONSULTATION,
        ],
      },
    };

    if (sessionId) {
      query.clinical_session_id = sessionId;
    } else if (patientId) {
      query.patient_id = patientId;
    } else {
      return null;
    }

    return RedFlagCase.findOne(query).sort({ createdAt: -1 });
  }

  /**
   * ATOMIC CLAIM MECHANISM:
   * Uses atomic findOneAndUpdate with condition that assigned_doctor_id is null
   * and status is broadcasting/detected.
   * Guarantees strict concurrency protection against simultaneous accept requests.
   */
  async claimCaseAtomically(caseId, doctorId) {
    if (!caseId || !doctorId) return null;

    return RedFlagCase.findOneAndUpdate(
      {
        case_id: caseId.toUpperCase().trim(),
        status: { $in: [RED_FLAG_STATUS.DETECTED, RED_FLAG_STATUS.BROADCASTING, RED_FLAG_STATUS.ACKNOWLEDGED] },
        assigned_doctor_id: null,
      },
      {
        $set: {
          assigned_doctor_id: doctorId,
          status: RED_FLAG_STATUS.ASSIGNED,
          claimed_at: new Date(),
        },
      },
      { returnDocument: 'after' }
    );
  }

  async updateStatus(caseId, status, extraFields = {}) {
    return RedFlagCase.findOneAndUpdate(
      { case_id: caseId.toUpperCase().trim() },
      {
        $set: {
          status,
          ...extraFields,
        },
      },
      { returnDocument: 'after' }
    );
  }

  async transferCase(caseId, fromDoctorId, toDoctorId, reason, transferredBy) {
    return RedFlagCase.findOneAndUpdate(
      { case_id: caseId.toUpperCase().trim() },
      {
        $set: {
          assigned_doctor_id: toDoctorId,
          status: RED_FLAG_STATUS.ASSIGNED,
        },
        $push: {
          transfer_history: {
            from_doctor_id: fromDoctorId,
            to_doctor_id: toDoctorId,
            reason: reason || 'Specialist escalation / Clinical transfer',
            transferred_by: transferredBy || fromDoctorId,
            transferred_at: new Date(),
          },
        },
      },
      { returnDocument: 'after' }
    );
  }

  async resolveCase(caseId, { notes, disposition, resolvedBy }) {
    const now = new Date();
    return RedFlagCase.findOneAndUpdate(
      { case_id: caseId.toUpperCase().trim() },
      {
        $set: {
          status: RED_FLAG_STATUS.RESOLVED,
          resolved_at: now,
          handled_at: now,
          resolution: {
            notes: notes || 'Clinical consultation concluded',
            disposition: disposition || 'DISCHARGED_OR_ADMITTED',
            resolved_by: resolvedBy,
            resolved_at: now,
          },
        },
      },
      { returnDocument: 'after' }
    );
  }

  async findAssignedCasesForDoctor(doctorId) {
    return RedFlagCase.find({
      assigned_doctor_id: doctorId,
      status: { $in: [RED_FLAG_STATUS.ASSIGNED, RED_FLAG_STATUS.IN_CONSULTATION] },
    }).sort({ createdAt: -1 });
  }

  async findAll(filter = {}, { skip = 0, limit = 50 } = {}) {
    const [cases, total] = await Promise.all([
      RedFlagCase.find(filter).sort({ createdAt: -1 }).skip(skip).limit(limit),
      RedFlagCase.countDocuments(filter),
    ]);
    return { cases, total };
  }
}

export const redFlagRepository = new RedFlagRepository();
export default redFlagRepository;
