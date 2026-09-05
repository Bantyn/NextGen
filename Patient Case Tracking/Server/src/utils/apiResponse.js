import { HTTP_STATUS } from '../constants/httpStatus.js';

/**
 * Standard Success Response Formatter
 *
 * @param {import('express').Response} res
 * @param {number} statusCode
 * @param {string} message
 * @param {any} data
 * @param {object} [meta]
 */
export const sendSuccess = (
  res,
  statusCode = HTTP_STATUS.OK,
  message = 'Request completed successfully',
  data = null,
  meta = null
) => {
  const payload = {
    success: true,
    message,
    data,
  };

  if (meta) {
    payload.meta = meta;
  }

  return res.status(statusCode).json(payload);
};

/**
 * Standard Error Response Formatter
 *
 * @param {import('express').Response} res
 * @param {number} statusCode
 * @param {string} message
 * @param {string} errorCode
 * @param {any} [details]
 */
export const sendError = (
  res,
  statusCode = HTTP_STATUS.INTERNAL_SERVER_ERROR,
  message = 'An unexpected error occurred',
  errorCode = 'INTERNAL_ERROR',
  details = null
) => {
  const payload = {
    success: false,
    message,
    error: {
      code: errorCode,
      details,
    },
  };

  return res.status(statusCode).json(payload);
};

/**
 * Calculate standard pagination metadata
 *
 * @param {number} page
 * @param {number} limit
 * @param {number} total
 */
export const buildPaginationMeta = (page = 1, limit = 10, total = 0) => {
  const pageNum = Math.max(1, parseInt(page, 10) || 1);
  const limitNum = Math.max(1, parseInt(limit, 10) || 10);
  const totalPages = Math.ceil(total / limitNum);

  return {
    current_page: pageNum,
    page_size: limitNum,
    total_records: total,
    total_pages: totalPages,
    has_next: pageNum < totalPages,
    has_prev: pageNum > 1,
  };
};

export default {
  sendSuccess,
  sendError,
  buildPaginationMeta,
};
