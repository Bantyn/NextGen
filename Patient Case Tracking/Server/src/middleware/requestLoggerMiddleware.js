import { logger } from '../utils/logger.js';

/**
 * High-Visibility API Request & Error Console Logger Middleware
 * Displays clean, informative, colorized logs for every API call, status code, latency, and error.
 */
export const requestLogger = (req, res, next) => {
  // Skip noisy asset / static uploads polling if necessary
  if (req.path.startsWith('/uploads/') || req.path.startsWith('/favicon.ico')) {
    return next();
  }

  const startTime = Date.now();
  const timestamp = new Date().toLocaleTimeString('en-US', { hour12: false });
  const method = req.method;
  const url = req.originalUrl || req.url;
  const ip = req.ip || req.headers['x-forwarded-for'] || req.socket?.remoteAddress || '127.0.0.1';

  // Extract key tracking headers if sent by frontend
  const messageId = req.headers['x-message-id'] || req.headers['x-message-id'];
  const turnId = req.headers['x-turn-id'] || req.headers['x-turn-id'];
  const headerInfo = [
    messageId ? `msg_id=${messageId}` : null,
    turnId ? `turn=${turnId}` : null,
  ].filter(Boolean).join(', ');

  // Summary of incoming body if applicable (sanitized, truncated)
  let bodySummary = '';
  if (method === 'POST' || method === 'PUT' || method === 'PATCH') {
    if (req.body && typeof req.body === 'object') {
      const keys = Object.keys(req.body);
      if (keys.length > 0) {
        const previewParts = [];
        if (req.body.session_id) previewParts.push(`session: ${req.body.session_id}`);
        if (req.body.message) previewParts.push(`msg: "${String(req.body.message).slice(0, 30)}"`);
        if (req.body.patient_answer) previewParts.push(`answer: "${String(req.body.patient_answer).slice(0, 30)}"`);
        if (previewParts.length === 0) {
          previewParts.push(`keys: [${keys.slice(0, 4).join(', ')}]`);
        }
        bodySummary = ` | Payload: { ${previewParts.join(', ')} }`;
      }
    }
  }

  // 1. Log incoming request to console
  const headerStr = headerInfo ? ` | [${headerInfo}]` : '';
  console.log(`\x1b[36m📥 [API REQ]\x1b[0m \x1b[90m${timestamp}\x1b[0m \x1b[1m${method}\x1b[0m ${url} \x1b[90m(IP: ${ip})\x1b[0m${headerStr}${bodySummary}`);

  // 2. Intercept response completion to log latency, status code, and errors
  res.on('finish', () => {
    const durationMs = Date.now() - startTime;
    const statusCode = res.statusCode;

    // Color code based on HTTP Status
    let statusColor = '\x1b[32m'; // Green (2xx)
    let icon = '✅';

    if (statusCode >= 500) {
      statusColor = '\x1b[31m'; // Red (5xx)
      icon = '❌';
    } else if (statusCode >= 400) {
      statusColor = '\x1b[33m'; // Yellow (4xx)
      icon = '⚠️';
    } else if (statusCode >= 300) {
      statusColor = '\x1b[34m'; // Blue (3xx)
      icon = '➡️';
    }

    const logLine = `${icon} [API RES] ${timestamp} ${method} ${url} -> ${statusColor}${statusCode} ${res.statusMessage || ''}\x1b[0m \x1b[90m(${durationMs}ms)\x1b[0m`;
    console.log(logLine);

    // Also write to Winston structured logger
    if (statusCode >= 500) {
      logger.error(`[API 5xx] ${method} ${url} - Status ${statusCode} (${durationMs}ms)`);
    } else if (statusCode >= 400) {
      logger.warn(`[API 4xx] ${method} ${url} - Status ${statusCode} (${durationMs}ms)`);
    } else {
      logger.info(`[API 2xx] ${method} ${url} - Status ${statusCode} (${durationMs}ms)`);
    }
  });

  next();
};

export default requestLogger;
