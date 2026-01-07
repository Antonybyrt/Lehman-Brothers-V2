import { Router } from 'express';
import { SavingsBookController } from '../adapters/controllers/SavingsBookController';
import { SavingsRateController } from '../adapters/controllers/SavingsRateController';
import { authMiddleware, AuthenticatedRequest } from '../middleware/authMiddleware';

export const createSavingsRoutes = (
    savingsBookController: SavingsBookController,
    savingsRateController: SavingsRateController
): Router => {
    const router = Router();

    // ========== Client routes ==========

    // Create a new savings book
    router.post('/savings-books', authMiddleware, (req: AuthenticatedRequest, res) =>
        savingsBookController.createSavingsBook(req, res)
    );

    // Get user's savings books
    router.get('/savings-books', authMiddleware, (req: AuthenticatedRequest, res) =>
        savingsBookController.getUserSavingsBooks(req, res)
    );

    // Deposit to savings book
    router.post('/savings-books/:id/deposit', authMiddleware, (req: AuthenticatedRequest, res) =>
        savingsBookController.deposit(req, res)
    );

    // Withdraw from savings book
    router.post('/savings-books/:id/withdraw', authMiddleware, (req: AuthenticatedRequest, res) =>
        savingsBookController.withdraw(req, res)
    );

    // Get current rates (public)
    router.get('/savings-rates', authMiddleware, (req: AuthenticatedRequest, res) =>
        savingsBookController.getCurrentRates(req, res)
    );

    // ========== Director routes ==========

    // Set savings rate (director only)
    router.post('/savings-rates', authMiddleware, (req: AuthenticatedRequest, res) =>
        savingsRateController.setRate(req, res)
    );

    // Apply daily interest (director only - or can be triggered by cron)
    router.post('/savings/apply-interest', authMiddleware, (req: AuthenticatedRequest, res) =>
        savingsRateController.applyDailyInterest(req, res)
    );

    return router;
};
