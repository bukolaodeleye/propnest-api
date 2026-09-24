import { rateLimit, ipKeyGenerator } from 'express-rate-limit';
import { RATE_LIMIT_WINDOW_MS, RATE_LIMIT_MAX_REQUESTS } from '../config/api.js';
import { errorResponse } from '../utils/response.js';

export const apiRateLimiter = rateLimit({
  windowMs: RATE_LIMIT_WINDOW_MS,
  limit: RATE_LIMIT_MAX_REQUESTS,
  standardHeaders: 'draft-8',
  legacyHeaders: false,
  keyGenerator: (req, res) => {
    let clientIp = req.ip || 'unknown';
    if (process.env.RAILWAY_PROJECT_ID) {
      const realIp = req.headers['x-real-ip'];
      if (typeof realIp === 'string' && realIp.length > 0) {
        clientIp = realIp;
      }
    }
    return ipKeyGenerator(clientIp);
  },
  handler: (req, res, next, options) => {
    res.status(options.statusCode).json(errorResponse('RATE_LIMIT_EXCEEDED', 'Too many requests. Please try again later.'));
  },
});
