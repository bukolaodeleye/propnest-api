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

    const [total, viewings] = await prisma.$transaction([
      prisma.viewing.count(),
      prisma.viewing.findMany({
        take: limit,
        skip: offset,
        orderBy: { scheduledAt: 'desc' },
      }),
    ]);

    res.json(successResponse(viewings, calculatePaginationMeta(total, limit, offset, viewings.length)));
  } catch (error) {
    next(error);
  }
});

router.get('/:id', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const idResult = uuidSchema.safeParse(req.params.id);
    if (!idResult.success) {
      res.status(400).json(errorResponse('INVALID_ID', 'Invalid viewing ID'));
      return;
    }

    const viewing = await prisma.viewing.findUnique({
      where: { id: idResult.data },
      include: {
        property: {
          select: {
            id: true,
            title: true,
            city: true,
            status: true
          }
        }
      }
    });

    if (!viewing) {
      res.status(404).json(errorResponse('NOT_FOUND', 'Viewing not found'));
      return;
    }

    res.json(successResponse(viewing));
  } catch (error) {
    next(error);
  }
});

export default router;
