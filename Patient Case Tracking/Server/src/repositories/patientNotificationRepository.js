import { PatientNotification } from '../models/PatientNotification.js';

export class PatientNotificationRepository {
  async create(data) {
    const notif = new PatientNotification(data);
    return notif.save();
  }

  async findByPatientId(patientId, limit = 20) {
    if (!patientId) return [];
    return PatientNotification.find({
      $or: [
        { patient_id: patientId },
        { patient_id: String(patientId).toUpperCase() },
        { patient_id: String(patientId).toLowerCase() },
      ],
    })
      .sort({ createdAt: -1 })
      .limit(limit);
  }

  async countUnreadByPatientId(patientId) {
    if (!patientId) return 0;
    return PatientNotification.countDocuments({
      $or: [
        { patient_id: patientId },
        { patient_id: String(patientId).toUpperCase() },
        { patient_id: String(patientId).toLowerCase() },
      ],
      is_read: false,
    });
  }

  async markAsRead(notificationId) {
    return PatientNotification.findOneAndUpdate(
      { notification_id: notificationId },
      { $set: { is_read: true, read_at: new Date() } },
      { new: true }
    );
  }
}

export const patientNotificationRepository = new PatientNotificationRepository();
export default patientNotificationRepository;
