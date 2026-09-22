import { rateLimit } from 'express-rate-limit';
import { RATE_LIMIT_WINDOW_MS, RATE_LIMIT_MAX_REQUESTS } from '../config/api.js';
import { errorResponse } from '../utils/response.js';

export const apiRateLimiter = rateLimit({
  windowMs: RATE_LIMIT_WINDOW_MS,
  limit: RATE_LIMIT_MAX_REQUESTS,
  standardHeaders: 'draft-8',
  legacyHeaders: false,
  handler: (req, res, next, options) => {
    res.status(options.statusCode).json(errorResponse('RATE_LIMIT_EXCEEDED', 'Too many requests. Please try again later.'));
  },
});
