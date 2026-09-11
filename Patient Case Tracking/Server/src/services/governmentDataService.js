import dotenv from 'dotenv';
import { logger } from '../utils/logger.js';

dotenv.config();

const GOV_DATA_API_KEY = process.env.DATA_GOV_IN_API_KEY;
const GOV_DATA_BASE_URL = process.env.DATA_GOV_IN_BASE_URL || 'https://api.data.gov.in';

/**
 * Government Data Service — Indian Public Health & Reference Datasets
 * Dedicated reference service for public health indicators, guidelines, and reference statistics.
 * Not used for ABHA authentication or Aadhaar verification (handled via ABDM sandbox).
 */
export class GovernmentDataService {
  isConfigured() {
    return Boolean(GOV_DATA_API_KEY && !GOV_DATA_API_KEY.includes('<'));
  }

  /**
   * Fetch public health program or disease advisory reference
   */
  async getHealthAdvisoryReference(conditionOrProgram) {
    if (!conditionOrProgram) return null;

    // Deterministic Indian Public Health Guidelines reference database
    const localAdvisories = {
      malaria: {
        program: 'National Vector Borne Disease Control Programme (NVBDCP)',
        protocol: 'Early diagnosis by Rapid Diagnostic Kit (RDK) or microscopy; complete artemisinin combination therapy (ACT) under supervision.',
      },
      tuberculosis: {
        program: 'National Tuberculosis Elimination Programme (NTEP)',
        protocol: 'Free sputum testing and cartridge-based nucleic acid amplification test (CBNAAT) with Nikshay portal notification.',
      },
      hypertension: {
        program: 'India Hypertension Control Initiative (IHCI)',
        protocol: 'Standardized blood pressure screening at primary health kiosks, lifestyle modification counseling, and physician follow-up.',
      },
      diabetes: {
        program: 'National Programme for Prevention and Control of Cancer, Diabetes, CVD and Stroke (NPCDCS)',
        protocol: 'Opportunistic fasting blood sugar screening and lifestyle modification for adults over 30 years.',
      },
    };

    const key = Object.keys(localAdvisories).find((k) =>
      String(conditionOrProgram).toLowerCase().includes(k)
    );

    if (key) {
      return {
        source: 'national_health_mission_india',
        advisory: localAdvisories[key],
        timestamp: new Date().toISOString(),
      };
    }

    return {
      source: 'national_health_portal_reference',
      advisory: {
        program: 'Ayushman Bharat Digital Mission (ABDM) / National Health Mission',
        protocol: 'Consult attending physician at public health kiosk for standardized national protocol adherence.',
      },
      timestamp: new Date().toISOString(),
    };
  }
}

export const governmentDataService = new GovernmentDataService();
export default governmentDataService;
