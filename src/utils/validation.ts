import { z } from 'zod';
import { DEFAULT_PAGE_LIMIT, MAX_PAGE_LIMIT, DEFAULT_OFFSET } from '../config/api.js';

export const uuidSchema = z.string().uuid();

export const paginationSchema = z.object({
  limit: z.coerce.number().int().min(1).optional().default(DEFAULT_PAGE_LIMIT)
    .transform(val => Math.min(val, MAX_PAGE_LIMIT)),
  offset: z.coerce.number().int().min(0).optional().default(DEFAULT_OFFSET),
});

export const sortOrderSchema = z.enum(['asc', 'desc']).optional().default('desc');

export const agentFilterSchema = paginationSchema.extend({
  city: z.string().optional(),
  agencyName: z.string().optional(),
  sort: z.enum(['name', 'agencyName', 'city', 'createdAt']).optional().default('createdAt'),
  order: sortOrderSchema,
});

export const propertyFilterSchema = paginationSchema.extend({
  city: z.string().optional(),
  state: z.string().optional(),
  propertyType: z.enum(['apartment', 'house', 'duplex', 'land', 'commercial']).optional(),
  listingType: z.enum(['rent', 'sale']).optional(),
  status: z.enum(['available', 'unavailable']).optional(),
  bedrooms: z.coerce.number().int().min(0).optional(),
  minPrice: z.coerce.number().min(0).optional(),
  maxPrice: z.coerce.number().min(0).optional(),
  sort: z.enum(['price', 'createdAt', 'bedrooms', 'bathrooms', 'city']).optional().default('createdAt'),
  order: sortOrderSchema,
}).refine(data => {
  if (data.minPrice !== undefined && data.maxPrice !== undefined) {
    return data.minPrice <= data.maxPrice;
  }
  return true;
}, {
  message: "minPrice must not exceed maxPrice",
  path: ["maxPrice"]
});

export const viewingFilterSchema = paginationSchema.extend({
  status: z.enum(['pending', 'confirmed', 'completed', 'cancelled']).optional(),
  propertyId: z.string().uuid().optional(),
  from: z.string().datetime().or(z.string().date()).optional(),
  to: z.string().datetime().or(z.string().date()).optional(),
  sort: z.enum(['scheduledAt', 'createdAt', 'status']).optional().default('scheduledAt'),
  order: sortOrderSchema,
}).refine(data => {
  if (data.from !== undefined && data.to !== undefined) {
    return new Date(data.from) <= new Date(data.to);
  }
  return true;
}, {
  message: "from date must not be later than to date",
  path: ["from"]
});
