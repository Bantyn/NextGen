/**
 * Global Environment Variables & System Configuration
 */

export const ENV = {
  API_BASE_URL: import.meta.env.VITE_API_URL || 'http://localhost:5000/api/v1',
  APP_NAME: 'Sehat',
  APP_VERSION: '1.0.0',
  ENABLE_OFFLINE_DEMO_FALLBACK: true,
  HOSPITAL_NAME: 'All India Institute of Ayurveda (AIIA)',
  MINISTRY_NAME: 'Ministry of Ayush, Govt. of India',
};

export default ENV;
