import { Router, Request, Response, NextFunction } from 'express';
import { prisma } from '../lib/prisma.js';
import { propertyFilterSchema, uuidSchema } from '../utils/validation.js';
import { successResponse, errorResponse } from '../utils/response.js';
import { calculatePaginationMeta } from '../utils/pagination.js';
import { Prisma } from '@prisma/client';

const router = Router();

router.get('/', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const parseResult = propertyFilterSchema.safeParse(req.query);
    if (!parseResult.success) {
      const isSortError = parseResult.error.issues.some(i => i.path.includes('sort') || i.path.includes('order'));
      const code = isSortError ? 'INVALID_SORT' : 'INVALID_FILTER';
      res.status(400).json(errorResponse(code, parseResult.error.issues[0].message || 'Invalid parameters'));
      return;
    }
    const { limit, offset, city, state, propertyType, listingType, status, bedrooms, minPrice, maxPrice, sort, order } = parseResult.data;

    const where: Prisma.PropertyWhereInput = {};
    if (city) where.city = { equals: city, mode: 'insensitive' };
    if (state) where.state = { equals: state, mode: 'insensitive' };
    if (propertyType) where.propertyType = propertyType;
    if (listingType) where.listingType = listingType;
    if (status) where.status = status;
    if (bedrooms !== undefined) where.bedrooms = bedrooms;
    
    if (minPrice !== undefined || maxPrice !== undefined) {
      where.price = {};
      if (minPrice !== undefined) where.price.gte = minPrice;
      if (maxPrice !== undefined) where.price.lte = maxPrice;
    }

    const orderBy: Prisma.PropertyOrderByWithRelationInput[] = [
      { [sort]: order },
      { id: 'asc' }
    ];

    const [total, properties] = await prisma.$transaction([
      prisma.property.count({ where }),
      prisma.property.findMany({
        where,
        take: limit,
        skip: offset,
        orderBy,
      }),
    ]);

    const formattedProperties = properties.map(p => ({
      ...p,
      price: p.price.toString()
    }));

    res.json(successResponse(formattedProperties, calculatePaginationMeta(total, limit, offset, properties.length)));
  } catch (error) {
    next(error);
  }
});

router.get('/:id', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const idResult = uuidSchema.safeParse(req.params.id);
    if (!idResult.success) {
      res.status(400).json(errorResponse('INVALID_ID', 'Invalid property ID'));
      return;
    }

    const property = await prisma.property.findUnique({
      where: { id: idResult.data },
      include: {
        agent: {
          select: {
            id: true,
            name: true,
            agencyName: true
          }
        }
      }
    });

    if (!property) {
      res.status(404).json(errorResponse('NOT_FOUND', 'Property not found'));
      return;
    }

    const formattedProperty = {
      ...property,
      price: property.price.toString()
    };

    res.json(successResponse(formattedProperty));
  } catch (error) {
    next(error);
  }
});

export default router;
