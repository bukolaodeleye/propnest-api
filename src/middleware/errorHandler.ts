import { Request, Response, NextFunction } from 'express';
import { errorResponse } from '../utils/response.js';

export function notFoundHandler(req: Request, res: Response, next: NextFunction) {
  res.status(404).json(errorResponse('NOT_FOUND', 'Route not found'));
}

export function globalErrorHandler(err: any, req: Request, res: Response, next: NextFunction) {
  console.error(err); // Log for development
  res.status(500).json(errorResponse('INTERNAL_SERVER_ERROR', 'An unexpected error occurred'));
}
