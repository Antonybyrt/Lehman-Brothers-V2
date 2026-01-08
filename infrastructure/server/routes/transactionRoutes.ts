import { Router } from 'express';
import { TransactionController } from '../adapters/controllers';
import { authMiddleware, AuthenticatedRequest } from '../middleware/authMiddleware';

export const createTransactionRoutes = (transactionController: TransactionController): Router => {
    const router = Router();

    // Get user transactions
    router.get('/transactions', authMiddleware, (req: AuthenticatedRequest, res) =>
        transactionController.getUserTransactions(req, res)
    );

    return router;
};
