import dotenv from 'dotenv';
import { logger } from '../utils/logger.js';

dotenv.config();

const NUTRITION_API_URL = process.env.NUTRITION_API_URL || 'https://api.calorieninjas.com/v1/nutrition';
const NUTRITION_API_KEY = process.env.NUTRITION_API_KEY;
const REQUEST_TIMEOUT_MS = 3000;

/**
 * Nutrition Service — Dietary & Nutritional Reference Layer
 * Secondary reference layer subordinate to AYUSH Ahara-Vihara and clinical guidance.
 */
export class NutritionService {
  isConfigured() {
    return Boolean(NUTRITION_API_KEY && !NUTRITION_API_KEY.includes('<'));
  }

  /**
   * Fetch nutritional breakdown for diet items
   */
  async getNutritionalReference(foodQuery) {
    if (!foodQuery || typeof foodQuery !== 'string') return null;

    if (!this.isConfigured()) {
      return this.buildFallbackDietGuidance(foodQuery);
    }

    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), REQUEST_TIMEOUT_MS);

      const res = await fetch(`${NUTRITION_API_URL}?query=${encodeURIComponent(foodQuery)}`, {
        headers: { 'X-Api-Key': NUTRITION_API_KEY },
        signal: controller.signal,
      });

      clearTimeout(timeoutId);

      if (!res.ok) {
        return this.buildFallbackDietGuidance(foodQuery);
      }

      const data = await res.json();
      return {
        source: 'external_nutrition_api',
        items: data.items || [],
        timestamp: new Date().toISOString(),
      };
    } catch (err) {
      logger.warn(`[Nutrition Service Warning]: ${err.message}. Using AYUSH dietary guidance.`);
      return this.buildFallbackDietGuidance(foodQuery);
    }
  }

  /**
   * Safe Ahara-Vihara subordinate fallback
   */
  buildFallbackDietGuidance(foodQuery) {
    return {
      source: 'ayush_ahara_vihara_reference',
      recommendations: [
        'Balanced satvik diet tailored to individual prakriti (Vata, Pitta, Kapha).',
        'Adequate hydration, warm cooked meals, avoiding heavy processed foods before rest.',
      ],
      query: foodQuery,
      timestamp: new Date().toISOString(),
    };
  }
}

export const nutritionService = new NutritionService();
export default nutritionService;
