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

export default app;
