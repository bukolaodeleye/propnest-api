import { Router, Request, Response, NextFunction } from 'express';
import { prisma } from '../lib/prisma.js';
import { agentFilterSchema, propertyFilterSchema, uuidSchema } from '../utils/validation.js';
import { successResponse, errorResponse } from '../utils/response.js';
import { calculatePaginationMeta } from '../utils/pagination.js';
import { Prisma } from '@prisma/client';

const router = Router();

router.get('/', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const parseResult = agentFilterSchema.safeParse(req.query);
    if (!parseResult.success) {
      // Determine if it was pagination, sort, or filter error to give a better code if possible, or just use general.
      // Requirements say invalid sort -> INVALID_SORT, invalid query -> HTTP 400
      const isSortError = parseResult.error.issues.some(i => i.path.includes('sort') || i.path.includes('order'));
      const code = isSortError ? 'INVALID_SORT' : 'INVALID_FILTER';
      res.status(400).json(errorResponse(code, parseResult.error.issues[0].message || 'Invalid parameters'));
      return;
    }
    const { limit, offset, city, agencyName, sort, order } = parseResult.data;

    const where: Prisma.AgentWhereInput = {};
    if (city) {
      where.city = { equals: city, mode: 'insensitive' };
    }
    if (agencyName) {
      where.agencyName = { contains: agencyName, mode: 'insensitive' };
    }

    const orderBy: Prisma.AgentOrderByWithRelationInput[] = [
      { [sort]: order },
      { id: 'asc' }
    ];

    const [total, agents] = await prisma.$transaction([
      prisma.agent.count({ where }),
      prisma.agent.findMany({
        where,
        take: limit,
        skip: offset,
        orderBy,
      }),
    ]);

    res.json(successResponse(agents, calculatePaginationMeta(total, limit, offset, agents.length)));
  } catch (error) {
    next(error);
  }
});

router.get('/:id', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const idResult = uuidSchema.safeParse(req.params.id);
    if (!idResult.success) {
      res.status(400).json(errorResponse('INVALID_ID', 'Invalid agent ID'));
      return;
    }

    const agent = await prisma.agent.findUnique({
      where: { id: idResult.data },
    });

    if (!agent) {
      res.status(404).json(errorResponse('NOT_FOUND', 'Agent not found'));
      return;
    }

    res.json(successResponse(agent));
  } catch (error) {
    next(error);
  }
});

router.get('/:id/properties', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const idResult = uuidSchema.safeParse(req.params.id);
    if (!idResult.success) {
      res.status(400).json(errorResponse('INVALID_ID', 'Invalid agent ID'));
      return;
    }

    const agentExists = await prisma.agent.findUnique({
      where: { id: idResult.data },
      select: { id: true }
    });

    if (!agentExists) {
      res.status(404).json(errorResponse('NOT_FOUND', 'Agent not found'));
      return;
    }

    const parseResult = propertyFilterSchema.safeParse(req.query);
    if (!parseResult.success) {
      const isSortError = parseResult.error.issues.some(i => i.path.includes('sort') || i.path.includes('order'));
      const code = isSortError ? 'INVALID_SORT' : 'INVALID_FILTER';
      res.status(400).json(errorResponse(code, parseResult.error.issues[0].message || 'Invalid parameters'));
      return;
    }
    const { limit, offset, city, state, propertyType, listingType, status, bedrooms, minPrice, maxPrice, sort, order } = parseResult.data;

    const where: Prisma.PropertyWhereInput = { agentId: idResult.data };
    
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

    // Format properties (decimals to strings)
    const formattedProperties = properties.map(p => ({
      ...p,
      price: p.price.toString()
    }));

    res.json(successResponse(formattedProperties, calculatePaginationMeta(total, limit, offset, properties.length)));
  } catch (error) {
    next(error);
  }
});

export default router;
