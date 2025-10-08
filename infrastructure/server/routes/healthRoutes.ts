import { Router } from 'express';

export const createHealthRoutes = (): Router => {
  const router = Router();

  // Health check route
  router.get('/health', (req, res) => {
    res.json({ 
      status: 'OK', 
      timestamp: new Date().toISOString(),
      service: 'Lehman Brothers V2 API'
    });
  });

  return router;
};
