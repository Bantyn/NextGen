import { observationRepository } from '../repositories/observationRepository.js';
import { sessionRepository } from '../repositories/sessionRepository.js';
import { OBSERVATION_CATEGORY } from '../constants/patientStatus.js';
import { ApiError } from '../utils/apiError.js';

/**
 * Observation Service — Pure Domain Logic for Structured Clinical Observations
 */
export class ObservationService {
  async createObservation({ session_id, category, name, value = '', unit = '', confidence = 1.0, source = 'AI_DIALOGUE' }) {
    if (!session_id || !category || !name) {
      throw ApiError.badRequest('session_id, category, and name are required fields.', 'MISSING_FIELDS');
    }

    if (!Object.values(OBSERVATION_CATEGORY).includes(category)) {
      throw ApiError.badRequest(
        `Invalid observation category '${category}'. Permitted: [${Object.values(OBSERVATION_CATEGORY).join(', ')}]`,
        'INVALID_CATEGORY'
      );
    }

    const session = await sessionRepository.findBySessionId(session_id);
    if (!session) {
      throw ApiError.notFound(`Clinical session '${session_id}' does not exist.`, 'SESSION_NOT_FOUND');
    }

    const observation = await observationRepository.create({
      session_id,
      category,
      name,
      value,
      unit,
      confidence,
      source,
    });

    return observation;
  }

  async getSessionObservations(sessionId) {
    const observations = await observationRepository.findBySessionId(sessionId);

    // Also group by category for convenience
    const grouped = {
      SYMPTOM: [],
      MEDICATION: [],
      ALLERGY: [],
      CONDITION: [],
      LAB_RESULT: [],
    };

    observations.forEach((obs) => {
      if (grouped[obs.category]) {
        grouped[obs.category].push(obs);
      }
    });

    return {
      all: observations,
      grouped,
    };
  }

  async bulkCreate(observations) {
    return observationRepository.bulkCreate(observations);
  }
}

export const observationService = new ObservationService();
export default observationService;
