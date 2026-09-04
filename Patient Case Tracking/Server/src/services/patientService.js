import crypto from 'crypto';
import { patientRepository } from '../repositories/patientRepository.js';
import { consentRepository } from '../repositories/consentRepository.js';
import { buildPaginationMeta } from '../utils/apiResponse.js';
import { ApiError } from '../utils/apiError.js';

/**
 * Patient Service — Pure Domain Business Logic for Patient Identity & Profiles
 */
export class PatientService {
  /**
   * Helper to generate unique Patient Identifier: PAT-XXXXXXXX
   */
  generatePatientId() {
    const randomHex = crypto.randomBytes(4).toString('hex').toUpperCase();
    return `PAT-${randomHex}`;
  }

  async createPatient(payload) {
    const patient_id = payload.patient_id || this.generatePatientId();

    const existing = await patientRepository.findByPatientId(patient_id);
    if (existing) {
      throw ApiError.conflict(`Patient with ID '${patient_id}' already exists.`, 'PATIENT_ID_EXISTS');
    }

    const patient = await patientRepository.create({
      ...payload,
      patient_id,
      current_status: 'CHECKED_IN',
    });

    return patient;
  }

  async searchPatients({ search, page = 1, limit = 20 } = {}) {
    const pageNum = Math.max(1, parseInt(page, 10) || 1);
    const limitNum = Math.max(1, parseInt(limit, 10) || 20);
    const skip = (pageNum - 1) * limitNum;

    const { patients, total } = await patientRepository.search({
      search,
      skip,
      limit: limitNum,
    });

    const meta = buildPaginationMeta(pageNum, limitNum, total);
    return { patients, meta };
  }

  async getPatientById(patientId) {
    let patient = await patientRepository.findByPatientId(patientId);
    if (!patient && patientId.match(/^[0-9a-fA-F]{24}$/)) {
      patient = await patientRepository.findById(patientId);
    }

    if (!patient) {
      throw ApiError.notFound(`Patient with identifier '${patientId}' was not found.`, 'PATIENT_NOT_FOUND');
    }

    const [identities, consents] = await Promise.all([
      patientRepository.findIdentitiesByPatientId(patient.patient_id),
      consentRepository.findByPatientId(patient.patient_id),
    ]);

    return {
      ...patient.toObject(),
      identities,
      consents,
    };
  }

  async attachIdentity(patientId, { identity_type, identity_reference, verification_status = 'VERIFIED' }) {
    const patient = await patientRepository.findByPatientId(patientId);
    if (!patient) {
      throw ApiError.notFound(`Patient '${patientId}' was not found.`, 'PATIENT_NOT_FOUND');
    }

    const identity = await patientRepository.createIdentity({
      patient_id: patient.patient_id,
      identity_type,
      identity_reference,
      verification_status,
      verified_at: new Date(),
    });

    return identity;
  }
}

export const patientService = new PatientService();
export default patientService;
