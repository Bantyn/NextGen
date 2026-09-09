import { ClinicalObservation } from '../models/ClinicalObservation.js';

/**
 * Observation Repository — Data Access Layer for Structured Medical Observations
 */
export class ObservationRepository {
  async create(observationData) {
    const observation = new ClinicalObservation(observationData);
    return observation.save();
  }

  async findBySessionId(sessionId) {
    return ClinicalObservation.find({ session_id: sessionId }).sort({ createdAt: 1 });
  }

  async findByCategory(sessionId, category) {
    return ClinicalObservation.find({ session_id: sessionId, category }).sort({ createdAt: 1 });
  }

  async bulkCreate(observations) {
    return ClinicalObservation.insertMany(observations);
  }
}

export const observationRepository = new ObservationRepository();
export default observationRepository;
