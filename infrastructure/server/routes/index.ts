import { Router } from 'express';
import { createAuthRoutes } from './authRoutes';
import { createHealthRoutes } from './healthRoutes';
import { createEmailConfirmationRoutes } from './emailConfirmationRoutes';
import { createAccountRoutes } from './accountRoutes';
import { createChatRoutes } from './chatRoutes';
import { AuthController, EmailConfirmationController, AccountController, ChatRestController } from '../adapters/controllers';

export const createAppRoutes = (
  authController: AuthController,
  emailConfirmationController: EmailConfirmationController,
  accountController: AccountController,
  chatRestController: ChatRestController
): Router => {
  const router = Router();

  // Mount route modules
  router.use(createHealthRoutes());
  router.use(createAuthRoutes(authController));
  router.use(createEmailConfirmationRoutes(emailConfirmationController));
  router.use(createAccountRoutes(accountController));
  router.use(createChatRoutes(chatRestController));

  return router;
};
