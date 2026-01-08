import { Router } from 'express';
import { createAuthRoutes } from './authRoutes';
import { createHealthRoutes } from './healthRoutes';
import { createEmailConfirmationRoutes } from './emailConfirmationRoutes';
import { createAccountRoutes } from './accountRoutes';
import { createTransactionRoutes } from './transactionRoutes';
import { createChatRoutes } from './chatRoutes';
import { createSavingsRoutes } from './savingsRoutes';
import { AuthController, EmailConfirmationController, AccountController, TransactionController, ChatRestController, SavingsBookController, SavingsRateController } from '../adapters/controllers';

export const createAppRoutes = (
  authController: AuthController,
  emailConfirmationController: EmailConfirmationController,
  accountController: AccountController,
  transactionController: TransactionController,
  chatRestController: ChatRestController,
  savingsBookController: SavingsBookController,
  savingsRateController: SavingsRateController
): Router => {
  const router = Router();

  // Mount route modules
  router.use(createHealthRoutes());
  router.use(createAuthRoutes(authController));
  router.use(createEmailConfirmationRoutes(emailConfirmationController));
  router.use(createAccountRoutes(accountController));
  router.use(createTransactionRoutes(transactionController));
  router.use(createChatRoutes(chatRestController));
  router.use(createSavingsRoutes(savingsBookController, savingsRateController));

  return router;
};
