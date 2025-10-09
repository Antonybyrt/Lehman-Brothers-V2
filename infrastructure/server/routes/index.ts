import { Router } from 'express';
import { createAuthRoutes } from './authRoutes';
import { createHealthRoutes } from './healthRoutes';
import { createEmailConfirmationRoutes } from './emailConfirmationRoutes';
import { AuthController, EmailConfirmationController } from '../adapters/controllers';

export const createAppRoutes = (
  authController: AuthController,
  emailConfirmationController: EmailConfirmationController
): Router => {
  const router = Router();

  // Mount route modules
  router.use(createHealthRoutes());
  router.use(createAuthRoutes(authController));
  router.use(createEmailConfirmationRoutes(emailConfirmationController));

  return router;
};
