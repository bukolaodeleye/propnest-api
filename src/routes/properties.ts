import { Router, Request, Response, NextFunction } from 'express';
import { prisma } from '../lib/prisma.js';
import { paginationSchema, uuidSchema } from '../utils/validation.js';
import { successResponse, errorResponse } from '../utils/response.js';
import { calculatePaginationMeta } from '../utils/pagination.js';

const router = Router();

router.get('/', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const parseResult = paginationSchema.safeParse(req.query);
    if (!parseResult.success) {
      res.status(400).json(errorResponse('INVALID_PAGINATION', 'Invalid pagination parameters'));
      return;
    }
    const { limit, offset } = parseResult.data;

    const [total, properties] = await prisma.$transaction([
      prisma.property.count(),
      prisma.property.findMany({
        take: limit,
        skip: offset,
        orderBy: { createdAt: 'desc' },
        // Don't include huge nested objects by default in collections, just the basics
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
