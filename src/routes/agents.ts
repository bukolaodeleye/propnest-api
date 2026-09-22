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

    const [total, agents] = await prisma.$transaction([
      prisma.agent.count(),
      prisma.agent.findMany({
        take: limit,
        skip: offset,
        orderBy: { createdAt: 'desc' },
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

    const parseResult = paginationSchema.safeParse(req.query);
    if (!parseResult.success) {
      res.status(400).json(errorResponse('INVALID_PAGINATION', 'Invalid pagination parameters'));
      return;
    }
    const { limit, offset } = parseResult.data;

    const [total, properties] = await prisma.$transaction([
      prisma.property.count({ where: { agentId: idResult.data } }),
      prisma.property.findMany({
        where: { agentId: idResult.data },
        take: limit,
        skip: offset,
        orderBy: { createdAt: 'desc' },
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
