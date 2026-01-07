import { Router } from 'express';
import { createAuthRoutes } from './authRoutes';
import { createHealthRoutes } from './healthRoutes';
import { createEmailConfirmationRoutes } from './emailConfirmationRoutes';
import { createAccountRoutes } from './accountRoutes';
import { createTransactionRoutes } from './transactionRoutes';
import { createChatRoutes } from './chatRoutes';
import { createInvestmentRoutes } from './investment.routes';
import { createSavingsRoutes } from './savingsRoutes';
import { AuthController, EmailConfirmationController, AccountController, TransactionController, ChatRestController, InvestmentController, SavingsBookController, SavingsRateController } from '../adapters/controllers';

export const createAppRoutes = (
  authController: AuthController,
  emailConfirmationController: EmailConfirmationController,
  accountController: AccountController,
  transactionController: TransactionController,
  chatRestController: ChatRestController,
  investmentController: InvestmentController,
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
  router.use('/investment', createInvestmentRoutes(investmentController));
  router.use(createSavingsRoutes(savingsBookController, savingsRateController));

  return router;
};
