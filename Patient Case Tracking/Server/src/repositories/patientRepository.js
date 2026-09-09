import { Patient } from '../models/Patient.js';
import { PatientIdentity } from '../models/PatientIdentity.js';

/**
 * Patient Repository — Data Access Layer for Patients and Demographics
 */
export class PatientRepository {
  async create(patientData) {
    const patient = new Patient(patientData);
    return patient.save();
  }

  async findById(id) {
    return Patient.findById(id);
  }

  async findByPatientId(patientId) {
    return Patient.findOne({ patient_id: patientId.toUpperCase() });
  }

  async search({ search, skip = 0, limit = 20 } = {}) {
    const filter = {};
    if (search && search.trim()) {
      const q = search.trim();
      filter.$or = [
        { patient_id: { $regex: q, $options: 'i' } },
        { phone: { $regex: q, $options: 'i' } },
        { first_name: { $regex: q, $options: 'i' } },
        { last_name: { $regex: q, $options: 'i' } },
      ];
    }

    const [patients, total] = await Promise.all([
      Patient.find(filter).sort({ createdAt: -1 }).skip(skip).limit(limit),
      Patient.countDocuments(filter),
    ]);

    return { patients, total };
  }

  async updateStatus(patientId, status) {
    return Patient.findOneAndUpdate(
      { patient_id: patientId.toUpperCase() },
      { current_status: status },
      { new: true }
    );
  }

  async createIdentity(identityData) {
    const identity = new PatientIdentity(identityData);
    return identity.save();
  }

  async findIdentitiesByPatientId(patientId) {
    return PatientIdentity.find({ patient_id: patientId.toUpperCase() }).sort({ createdAt: -1 });
  }
}

export const patientRepository = new PatientRepository();
export default patientRepository;
