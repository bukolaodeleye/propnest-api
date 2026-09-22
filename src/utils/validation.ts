import { z } from 'zod';
import { DEFAULT_PAGE_LIMIT, MAX_PAGE_LIMIT, DEFAULT_OFFSET } from '../config/api.js';

export const uuidSchema = z.string().uuid();

export const paginationSchema = z.object({
  limit: z.coerce.number().int().min(1).optional().default(DEFAULT_PAGE_LIMIT)
    .transform(val => Math.min(val, MAX_PAGE_LIMIT)),
  offset: z.coerce.number().int().min(0).optional().default(DEFAULT_OFFSET),
});
