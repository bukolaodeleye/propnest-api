import { Router, Request, Response, NextFunction } from 'express';
import { prisma } from '../lib/prisma.js';
import { viewingFilterSchema, uuidSchema, createViewingSchema, updateViewingSchema } from '../utils/validation.js';
import { successResponse, errorResponse } from '../utils/response.js';
import { calculatePaginationMeta } from '../utils/pagination.js';
import { Prisma } from '@prisma/client';

const router = Router();

router.post('/', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const parseResult = createViewingSchema.safeParse(req.body);
    if (!parseResult.success) {
      const firstIssue = parseResult.error.issues[0];
      const field = firstIssue.path.join('.');
      res.status(422).json(errorResponse('VALIDATION_ERROR', `${field || 'Body'} ${firstIssue.message}`));
      return;
    }

    const data = parseResult.data;

    const property = await prisma.property.findUnique({
      where: { id: data.propertyId },
      select: { id: true }
    });

    if (!property) {
      res.status(422).json(errorResponse('INVALID_REFERENCE', 'propertyId does not reference an existing property'));
      return;
    }

    const viewing = await prisma.viewing.create({
      data: {
        propertyId: data.propertyId,
        customerName: data.customerName,
        customerEmail: data.customerEmail,
        customerPhone: data.customerPhone,
        scheduledAt: new Date(data.scheduledAt),
        status: data.status,
      }
    });

    res.status(201).json(successResponse(viewing));
  } catch (error) {
    next(error);
  }
});

router.patch('/:id', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const idResult = uuidSchema.safeParse(req.params.id);
    if (!idResult.success) {
      res.status(400).json(errorResponse('INVALID_ID', 'Invalid viewing ID'));
      return;
    }
    const viewingId = idResult.data;

    const viewingExists = await prisma.viewing.findUnique({
      where: { id: viewingId },
      select: { id: true }
    });

    if (!viewingExists) {
      res.status(404).json(errorResponse('NOT_FOUND', 'Viewing not found'));
      return;
    }

    const parseResult = updateViewingSchema.safeParse(req.body);
    if (!parseResult.success) {
      const firstIssue = parseResult.error.issues[0];
      const field = firstIssue.path.join('.');
      res.status(422).json(errorResponse('VALIDATION_ERROR', `${field ? field + ' ' : ''}${firstIssue.message}`));
      return;
    }

    const data = parseResult.data;

    if (data.propertyId) {
      const property = await prisma.property.findUnique({
        where: { id: data.propertyId },
        select: { id: true }
      });
      if (!property) {
        res.status(422).json(errorResponse('INVALID_REFERENCE', 'propertyId does not reference an existing property'));
        return;
      }
    }

    const updateData: any = { ...data };
    if (updateData.scheduledAt) {
      updateData.scheduledAt = new Date(updateData.scheduledAt);
    }

    const viewing = await prisma.viewing.update({
      where: { id: viewingId },
      data: updateData
    });

    res.json(successResponse(viewing));
  } catch (error) {
    next(error);
  }
});

router.delete('/:id', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const idResult = uuidSchema.safeParse(req.params.id);
    if (!idResult.success) {
      res.status(400).json(errorResponse('INVALID_ID', 'Invalid viewing ID'));
      return;
    }
    const viewingId = idResult.data;

    const viewingExists = await prisma.viewing.findUnique({
      where: { id: viewingId },
      select: { id: true }
    });

    if (!viewingExists) {
      res.status(404).json(errorResponse('NOT_FOUND', 'Viewing not found'));
      return;
    }

    await prisma.viewing.delete({
      where: { id: viewingId }
    });

    res.json(successResponse({ id: viewingId, deleted: true }));
  } catch (error) {
    next(error);
  }
});

router.get('/', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const parseResult = viewingFilterSchema.safeParse(req.query);
    if (!parseResult.success) {
      const isSortError = parseResult.error.issues.some(i => i.path.includes('sort') || i.path.includes('order'));
      const code = isSortError ? 'INVALID_SORT' : 'INVALID_FILTER';
      res.status(400).json(errorResponse(code, parseResult.error.issues[0].message || 'Invalid parameters'));
      return;
    }
    const { limit, offset, status, propertyId, from, to, sort, order } = parseResult.data;

    const where: Prisma.ViewingWhereInput = {};
    if (status) where.status = status;
    if (propertyId) where.propertyId = propertyId;
    
    if (from || to) {
      where.scheduledAt = {};
      if (from) where.scheduledAt.gte = new Date(from);
      if (to) where.scheduledAt.lte = new Date(to);
    }

    const orderBy: Prisma.ViewingOrderByWithRelationInput[] = [
      { [sort]: order },
      { id: 'asc' }
    ];

    const [total, viewings] = await prisma.$transaction([
      prisma.viewing.count({ where }),
      prisma.viewing.findMany({
        where,
        take: limit,
        skip: offset,
        orderBy,
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
