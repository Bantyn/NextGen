import { DoctorNotification, NOTIFICATION_STATUS } from '../models/DoctorNotification.js';

/**
 * Doctor Notification Repository — Manages notification lifecycle and active queues
 */
export class DoctorNotificationRepository {
  async createNotifications(notificationRecords = []) {
    if (!notificationRecords || notificationRecords.length === 0) return [];
    return DoctorNotification.insertMany(notificationRecords, { ordered: false });
  }

  async findActiveByDoctor(doctorId) {
    if (!doctorId) return [];
    return DoctorNotification.find({
      doctor_id: doctorId,
      status: { $in: [NOTIFICATION_STATUS.ACTIVE, NOTIFICATION_STATUS.SEEN] },
    }).sort({ notified_at: -1 });
  }

  async findNotification(caseId, doctorId) {
    if (!caseId || !doctorId) return null;
    return DoctorNotification.findOne({
      case_id: caseId.toUpperCase().trim(),
      doctor_id: doctorId,
    }).sort({ notified_at: -1 });
  }

  /**
   * Withdraws active alerts for all doctors except the winning claiming doctor
   */
  async withdrawActiveNotificationsForCase(caseId, exceptDoctorId) {
    if (!caseId) return null;
    const filter = {
      case_id: caseId.toUpperCase().trim(),
      status: { $in: [NOTIFICATION_STATUS.ACTIVE, NOTIFICATION_STATUS.SEEN] },
    };

    if (exceptDoctorId) {
      filter.doctor_id = { $ne: exceptDoctorId };
    }

    return DoctorNotification.updateMany(filter, {
      $set: {
        status: NOTIFICATION_STATUS.WITHDRAWN,
        responded_at: new Date(),
      },
    });
  }

  async markAsAccepted(caseId, doctorId) {
    return DoctorNotification.findOneAndUpdate(
      {
        case_id: caseId.toUpperCase().trim(),
        doctor_id: doctorId,
      },
      {
        $set: {
          status: NOTIFICATION_STATUS.ACCEPTED,
          responded_at: new Date(),
        },
      },
      { returnDocument: 'after' }
    );
  }

  async markAsDeclined(caseId, doctorId, reason) {
    return DoctorNotification.findOneAndUpdate(
      {
        case_id: caseId.toUpperCase().trim(),
        doctor_id: doctorId,
      },
      {
        $set: {
          status: NOTIFICATION_STATUS.DECLINED,
          decline_reason: reason || 'Physician unavailable or busy in consultation',
          responded_at: new Date(),
        },
      },
      { returnDocument: 'after' }
    );
  }

  async markAsSeen(caseId, doctorId) {
    return DoctorNotification.findOneAndUpdate(
      {
        case_id: caseId.toUpperCase().trim(),
        doctor_id: doctorId,
        status: NOTIFICATION_STATUS.ACTIVE,
      },
      {
        $set: {
          status: NOTIFICATION_STATUS.SEEN,
          seen_at: new Date(),
        },
      },
      { returnDocument: 'after' }
    );
  }
}

export const doctorNotificationRepository = new DoctorNotificationRepository();
export default doctorNotificationRepository;
