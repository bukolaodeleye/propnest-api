import express, { Request, Response } from 'express';

const app = express();

app.use(express.json());

app.get('/api/v1/health', (req: Request, res: Response) => {
  res.status(200).json({
    data: {
      status: 'ok',
      service: 'PropNest API'
    }
  });
});

import agentsRouter from './routes/agents.js';
import propertiesRouter from './routes/properties.js';
import viewingsRouter from './routes/viewings.js';
import { notFoundHandler, globalErrorHandler } from './middleware/errorHandler.js';

app.use('/api/v1/agents', agentsRouter);
app.use('/api/v1/properties', propertiesRouter);
app.use('/api/v1/viewings', viewingsRouter);

app.use(notFoundHandler);
app.use(globalErrorHandler);

export default app;
