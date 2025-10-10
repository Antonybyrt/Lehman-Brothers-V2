import { Router } from 'express';
import { createAuthRoutes } from './authRoutes';
import { createHealthRoutes } from './healthRoutes';
import { createEmailConfirmationRoutes } from './emailConfirmationRoutes';
import { createAccountRoutes } from './accountRoutes';
import { AuthController, EmailConfirmationController, AccountController } from '../adapters/controllers';

export const createAppRoutes = (
  authController: AuthController,
  emailConfirmationController: EmailConfirmationController,
  accountController: AccountController
): Router => {
  const router = Router();

  // Mount route modules
  router.use(createHealthRoutes());
  router.use(createAuthRoutes(authController));
  router.use(createEmailConfirmationRoutes(emailConfirmationController));
  router.use(createAccountRoutes(accountController));

  return router;
};
