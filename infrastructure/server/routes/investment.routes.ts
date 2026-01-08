import { Router } from 'express';
import { InvestmentController } from '../adapters/controllers/InvestmentController';
import { authMiddleware } from '../middleware/authMiddleware';

export const createInvestmentRoutes = (controller: InvestmentController): Router => {
  const router = Router();

  router.post('/stocks', authMiddleware, (req, res) => controller.createStock(req, res));
  router.get('/stocks', authMiddleware, (req, res) => controller.listStocks(req, res));
  router.patch('/stocks/:id/status', authMiddleware, (req, res) => controller.updateStockStatus(req, res));
  router.post('/orders', authMiddleware, (req, res) => controller.placeOrder(req, res));
  router.post('/orders/:id/cancel', authMiddleware, (req, res) => controller.cancelOrder(req, res));
  router.get('/portfolio', authMiddleware, (req, res) => controller.getPortfolio(req, res));
  router.get('/orders', authMiddleware, (req, res) => controller.getUserOrders(req, res));
  router.get('/stocks/:stockId/orders', authMiddleware, (req, res) => controller.getStockOrders(req, res));
  router.get('/stocks/:stockId/trades', authMiddleware, (req, res) => controller.getStockTrades(req, res));

  return router;
};
