import dotenv from 'dotenv';
import { logger } from '../utils/logger.js';

dotenv.config();

const OPENFDA_BASE_URL = process.env.OPENFDA_BASE_URL || 'https://api.fda.gov';
const REQUEST_TIMEOUT_MS = 3500;

// In-Memory Reference Cache with 1-hour TTL
const medicineCache = new Map();
const CACHE_TTL_MS = 60 * 60 * 1000;

/**
 * openFDA Service — Secondary Medicine Reference & Enrichment Integration
 * Provides regulatory information, approved indications, precautions, and warnings.
 * Safe fallback to internal knowledge when openFDA is unreachable or drug not found.
 */
export class OpenFDAService {
  /**
   * Search drug label details by brand or generic name
   */
  async getDrugInformation(drugName) {
    if (!drugName || typeof drugName !== 'string') return null;

    const queryClean = drugName.trim().toLowerCase();

    // 1. Check in-memory cache
    const cached = medicineCache.get(queryClean);
    if (cached && cached.expiresAt > Date.now()) {
      return cached.data;
    }

    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), REQUEST_TIMEOUT_MS);

      // openFDA search endpoint for drug labels
      const encoded = encodeURIComponent(`openfda.brand_name:"${queryClean}"+openfda.generic_name:"${queryClean}"`);
      const url = `${OPENFDA_BASE_URL}/drug/label.json?search=${encoded}&limit=1`;

      const res = await fetch(url, { signal: controller.signal });
      clearTimeout(timeoutId);

      if (!res.ok) {
        // Drug not in openFDA database or rate limit hit
        return null;
      }

      const json = await res.json();
      const result = json.results?.[0];
      if (!result) return null;

      const normalized = this.normalizeOpenFDAResponse(result, drugName);

      // Cache normalized result
      medicineCache.set(queryClean, {
        data: normalized,
        expiresAt: Date.now() + CACHE_TTL_MS,
      });

      return normalized;
    } catch (err) {
      logger.warn(`[openFDA Service Warning]: ${err.message} for drug "${drugName}". Continuing safely.`);
      return null;
    }
  }

  /**
   * Normalize openFDA drug label response into clean reference format
   */
  normalizeOpenFDAResponse(raw, fallbackName) {
    const openfda = raw.openfda || {};
    const brandName = (openfda.brand_name && openfda.brand_name[0]) || fallbackName;
    const genericName = (openfda.generic_name && openfda.generic_name[0]) || fallbackName;

    // Helper to extract first clean sentence or paragraph
    const extractSummary = (arr) => {
      if (!arr || !Array.isArray(arr) || arr.length === 0) return null;
      const text = String(arr[0] || '').replace(/\s+/g, ' ').trim();
      return text.length > 300 ? text.slice(0, 300) + '...' : text;
    };

    return {
      source: 'openFDA',
      brand_name: brandName,
      generic_name: genericName,
      purpose_or_indications: extractSummary(raw.indications_and_usage) || extractSummary(raw.purpose) || 'Reference medicine data',
      warnings: extractSummary(raw.warnings) || extractSummary(raw.warnings_and_cautions) || null,
      precautions: extractSummary(raw.precautions) || null,
      contraindications: extractSummary(raw.contraindications) || null,
      disclaimer: 'This reference information is sourced from openFDA and is intended for clinical education, not diagnosis or prescription modification.',
      timestamp: new Date().toISOString(),
    };
  }
}

export const openfdaService = new OpenFDAService();
export default openfdaService;
