import { Router } from 'express';
import { AccountController } from '../adapters/controllers';
import { authMiddleware, AuthenticatedRequest } from '../middleware/authMiddleware';

export const createAccountRoutes = (accountController: AccountController): Router => {
  const router = Router();

  // Protected routes (require authentication)
  router.post('/accounts', authMiddleware, (req: AuthenticatedRequest, res) => 
    accountController.createAccount(req, res)
  );

  router.get('/accounts', authMiddleware, (req: AuthenticatedRequest, res) => 
    accountController.getUserAccounts(req, res)
  );

  router.get('/accounts/:id', authMiddleware, (req: AuthenticatedRequest, res) => 
    accountController.getAccountById(req, res)
  );

  router.patch('/accounts/:id', authMiddleware, (req: AuthenticatedRequest, res) => 
    accountController.updateAccount(req, res)
  );

  router.delete('/accounts/:id', authMiddleware, (req: AuthenticatedRequest, res) => 
    accountController.deleteAccount(req, res)
  );

  return router;
};
