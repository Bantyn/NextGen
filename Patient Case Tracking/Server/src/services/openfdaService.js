import dotenv from 'dotenv';
import { logger } from '../utils/logger.js';

dotenv.config();

const OPENFDA_BASE_URL = process.env.OPENFDA_BASE_URL || 'https://api.fda.gov';
const REQUEST_TIMEOUT_MS = 4000;

// In-Memory Reference Cache with 1-hour TTL
const medicineCache = new Map();
const CACHE_TTL_MS = 60 * 60 * 1000;

/**
 * openFDA Service — Official Drug Labeling Information Fallback & Enrichment
 * Queries official FDA Drug Labeling API endpoints with in-memory caching and comprehensive normalization.
 */
export class OpenFDAService {
  /**
   * Search drug label details by brand, generic, or substance name with automatic fallback
   * @param {string} drugName - Name of the drug to query
   * @returns {Promise<object|null>} - Normalized medicine information or null
   */
  async getDrugInformation(drugName) {
    if (!drugName || typeof drugName !== 'string') return null;

    const queryClean = drugName.trim().toLowerCase();
    if (!queryClean || queryClean.length < 2) return null;

    const cacheKey = `medicine:${queryClean}`;

    // 1. Check in-memory cache
    const cached = medicineCache.get(cacheKey);
    if (cached && cached.expiresAt > Date.now()) {
      return cached.data;
    }

    try {
      // 2. Multi-tier search strategy:
      // Strategy A: Targeted field query
      let result = await this.fetchFromOpenFDA(
        `openfda.generic_name:"${encodeURIComponent(queryClean)}",openfda.brand_name:"${encodeURIComponent(queryClean)}",openfda.substance_name:"${encodeURIComponent(queryClean)}"`
      );

      // Strategy B: Full-text drug label search if targeted query returned no results
      if (!result) {
        result = await this.fetchFromOpenFDA(`"${encodeURIComponent(queryClean)}"`);
      }

      // Strategy C: Unquoted keyword search if exact quote returned no results
      if (!result && queryClean.length > 2) {
        result = await this.fetchFromOpenFDA(encodeURIComponent(queryClean));
      }

      if (!result) {
        return null;
      }

      const normalized = this.normalizeOpenFDAResponse(result, drugName);

      // Cache normalized result
      medicineCache.set(cacheKey, {
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
   * Internal helper to execute HTTP request with timeout to openFDA
   */
  async fetchFromOpenFDA(searchParam) {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), REQUEST_TIMEOUT_MS);

    try {
      const url = `${OPENFDA_BASE_URL}/drug/label.json?search=${searchParam}&limit=1`;
      const res = await fetch(url, { signal: controller.signal });
      clearTimeout(timeoutId);

      if (!res.ok) {
        // 404 = Not found in openFDA database, 429 = Rate limited, etc.
        return null;
      }

      const json = await res.json();
      return json.results?.[0] || null;
    } catch (fetchErr) {
      clearTimeout(timeoutId);
      if (fetchErr.name === 'AbortError') {
        logger.warn(`[openFDA Service] Request timed out after ${REQUEST_TIMEOUT_MS}ms for search: ${searchParam}`);
      }
      return null;
    }
  }

  /**
   * Normalize openFDA drug label response into the internal medicine-information structure
   */
  normalizeOpenFDAResponse(raw, fallbackName) {
    if (!raw) return null;

    const openfda = raw.openfda || {};

    // Helper to safely extract clean array of strings from openFDA fields
    const toCleanArray = (val) => {
      if (!val) return [];
      const arr = Array.isArray(val) ? val : [val];
      return arr
        .map((item) => {
          if (typeof item !== 'string') return '';
          return item.replace(/\s+/g, ' ').trim();
        })
        .filter((str) => str.length > 0);
    };

    // Generic and brand names
    const genericNames = toCleanArray(openfda.generic_name);
    const brandNames = toCleanArray(openfda.brand_name);

    // Derive primary medicine display name
    let primaryName = brandNames[0] || genericNames[0];
    if (!primaryName) {
      // Try extracting title or fallback from raw description or fallbackName
      const descSample = toCleanArray(raw.description)[0] || '';
      const nameMatch = descSample.match(/^DESCRIPTION\s+([A-Z0-9\s\-]+?)\s+(?:Capsules|Tablets|Injection|Oral|Cream)/i);
      primaryName = nameMatch ? nameMatch[1].trim() : (fallbackName || 'Unknown Medicine');
    }

    // Capitalize first letter if needed
    if (primaryName && typeof primaryName === 'string') {
      primaryName = primaryName.charAt(0).toUpperCase() + primaryName.slice(1);
    }

    // Active ingredients
    const activeIngredients = toCleanArray(openfda.substance_name).length > 0
      ? toCleanArray(openfda.substance_name)
      : toCleanArray(raw.active_ingredient);

    // Indications & Purpose
    const indicationsAndUsage = toCleanArray(raw.indications_and_usage);
    const purpose = toCleanArray(raw.purpose);

    // Dosage & Administration
    const dosageAndAdministration = toCleanArray(raw.dosage_and_administration);

    // Warnings & Precautions
    const rawWarnings = toCleanArray(raw.warnings).concat(toCleanArray(raw.warnings_and_cautions));
    const rawContraindications = toCleanArray(raw.contraindications);
    const rawPrecautions = toCleanArray(raw.precautions).concat(toCleanArray(raw.general_precautions));

    // Adverse reactions / side effects
    const adverseReactions = toCleanArray(raw.adverse_reactions);

    // Drug interactions
    const drugInteractions = toCleanArray(raw.drug_interactions);

    // Special populations
    const pregnancy = toCleanArray(raw.pregnancy).concat(toCleanArray(raw.teratogenic_effects));
    const pediatricUse = toCleanArray(raw.pediatric_use);
    const geriatricUse = toCleanArray(raw.geriatric_use);

    // Patient info & storage
    const patientInformation = toCleanArray(raw.information_for_patients).concat(toCleanArray(raw.spl_patient_package_insert));
    const storage = toCleanArray(raw.storage_and_handling);

    // Manufacturing & administration route
    const manufacturer = toCleanArray(openfda.manufacturer_name);
    const route = toCleanArray(openfda.route);
    const dosageForm = toCleanArray(openfda.dosage_form).concat(toCleanArray(raw.dosage_forms_and_strengths));

    return {
      medicine_name: primaryName,
      generic_name: genericNames.length > 0 ? genericNames : (fallbackName ? [fallbackName] : []),
      brand_name: brandNames,
      active_ingredients: activeIngredients,
      purpose: purpose,
      indications_and_usage: indicationsAndUsage,
      dosage_and_administration: dosageAndAdministration,
      warnings: rawWarnings,
      contraindications: rawContraindications,
      precautions: rawPrecautions,
      adverse_reactions: adverseReactions,
      drug_interactions: drugInteractions,
      pregnancy: pregnancy,
      pediatric_use: pediatricUse,
      geriatric_use: geriatricUse,
      patient_information: patientInformation,
      storage: storage,
      manufacturer: manufacturer,
      route: route,
      dosage_form: dosageForm,
      source: 'openfda',
      source_label: 'FDA / openFDA drug labeling',
      source_confidence: 'high',
      source_timestamp: new Date().toISOString(),
      disclaimer: 'This reference information is sourced from FDA drug labeling for educational purposes and does not constitute medical advice or a personalized prescription.',
    };
  }

  /**
   * Helper to clear or inspect cache (useful for testing)
   */
  clearCache() {
    medicineCache.clear();
  }

  getCacheSize() {
    return medicineCache.size;
  }
}

export const openfdaService = new OpenFDAService();
export default openfdaService;
