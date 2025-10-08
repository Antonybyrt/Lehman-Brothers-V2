import { Router } from 'express';
import { createAuthRoutes } from './authRoutes';
import { createHealthRoutes } from './healthRoutes';
import { AuthController } from '../adapters/controllers';

export const createAppRoutes = (authController: AuthController): Router => {
  const router = Router();

  // Mount route modules
  router.use(createHealthRoutes());
  router.use(createAuthRoutes(authController));

  return router;
};
