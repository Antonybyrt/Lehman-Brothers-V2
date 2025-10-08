import { Router } from 'express';
import { AuthController } from '../adapters/controllers';

export const createAuthRoutes = (authController: AuthController): Router => {
  const router = Router();

  // Authentication routes
  router.post('/auth/register', (req, res) => authController.register(req, res));
  router.post('/auth/login', (req, res) => authController.login(req, res));

  return router;
};
