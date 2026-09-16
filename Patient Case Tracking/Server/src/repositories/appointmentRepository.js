import { Appointment } from '../models/Appointment.js';

export class AppointmentRepository {
  async create(appointmentData) {
    const apt = new Appointment(appointmentData);
    return apt.save();
  }

  async findByPatientId(patientId, limit = 20) {
    if (!patientId) return [];
    return Appointment.find({
      $or: [
        { patient_id: patientId },
        { patient_id: String(patientId).toUpperCase() },
        { patient_id: String(patientId).toLowerCase() },
      ],
    })
      .sort({ appointment_date: -1 })
      .limit(limit);
  }

  async findUpcomingByPatientId(patientId) {
    if (!patientId) return [];
    const now = new Date();
    return Appointment.find({
      $or: [
        { patient_id: patientId },
        { patient_id: String(patientId).toUpperCase() },
        { patient_id: String(patientId).toLowerCase() },
      ],
      status: { $in: ['UPCOMING', 'CONFIRMED', 'PENDING'] },
    }).sort({ appointment_date: 1 });
  }

  async updateStatus(appointmentId, status) {
    return Appointment.findOneAndUpdate(
      { appointment_id: appointmentId },
      { $set: { status } },
      { new: true }
    );
  }
}

export const appointmentRepository = new AppointmentRepository();
export default appointmentRepository;
