import { Request, Response } from 'express';
import { CreateStockUseCase } from '../../../../application/usecases/investment/CreateStockUseCase';
import { ListStocksUseCase } from '../../../../application/usecases/investment/ListStocksUseCase';
import { UpdateStockStatusUseCase } from '../../../../application/usecases/investment/UpdateStockStatusUseCase';
import { PlaceOrderUseCase } from '../../../../application/usecases/investment/PlaceOrderUseCase';
import { CancelOrderUseCase } from '../../../../application/usecases/investment/CancelOrderUseCase';
import { GetUserPortfolioUseCase } from '../../../../application/usecases/investment/GetUserPortfolioUseCase';
import { GetUserOrdersUseCase } from '../../../../application/usecases/investment/GetUserOrdersUseCase';
import { GetStockOrdersUseCase } from '../../../../application/usecases/investment/GetStockOrdersUseCase';
import { GetStockTradesUseCase } from '../../../../application/usecases/investment/GetStockTradesUseCase';
import { OrderType } from '../../../../domain/values/OrderType';

export class InvestmentController {
  constructor(
    private readonly createStockUseCase: CreateStockUseCase,
    private readonly listStocksUseCase: ListStocksUseCase,
    private readonly updateStockStatusUseCase: UpdateStockStatusUseCase,
    private readonly placeOrderUseCase: PlaceOrderUseCase,
    private readonly cancelOrderUseCase: CancelOrderUseCase,
    private readonly getUserPortfolioUseCase: GetUserPortfolioUseCase,
    private readonly getUserOrdersUseCase: GetUserOrdersUseCase,
    private readonly getStockOrdersUseCase: GetStockOrdersUseCase,
    private readonly getStockTradesUseCase: GetStockTradesUseCase
  ) { }

  async createStock(req: Request, res: Response) {
    const { symbol, name, isin, initialPriceInCents, initialQuantity } = req.body;
    const directorId = (req as any).user?.userId as string;

    if (!directorId) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    const result = await this.createStockUseCase.execute({
      directorId,
      symbol,
      name,
      isin,
      initialPriceInCents,
      initialQuantity
    });

    if (result.isFailure()) {
      return res.status(400).json({ error: result.getError().message });
    }

    const stock = result.getValue();
    return res.status(201).json({
      id: stock.getId(),
      symbol: stock.getSymbol().getValue(),
      name: stock.getName(),
      currentPrice: stock.getCurrentPrice().getAmountInEuro(),
      active: stock.isActive()
    });
  }

  async listStocks(req: Request, res: Response) {
    const includeInactive = req.query.includeInactive === 'true';
    const userId = (req as any).user?.userId as string;

    try {
      const stocks = await this.listStocksUseCase.execute({ includeInactive, userId });
      return res.json(stocks.map(stock => ({
        id: stock.getId(),
        symbol: stock.getSymbol().getValue(),
        name: stock.getName(),
        currentPrice: stock.getCurrentPrice().getAmountInEuro(),
        active: stock.isActive()
      })));
    } catch (error: any) {
      return res.status(400).json({ error: error.message });
    }
  }

  async updateStockStatus(req: Request, res: Response) {
    const { id } = req.params;
    const { isActive } = req.body;
    const directorId = (req as any).user?.userId as string;

    if (!directorId) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    const result = await this.updateStockStatusUseCase.execute(directorId, id as string, Boolean(isActive));

    if (result.isFailure()) {
      return res.status(400).json({ error: result.getError().message });
    }

    return res.status(200).json({ message: 'Stock status updated' });
  }

  async placeOrder(req: Request, res: Response) {
    const { stockId, type, quantity, limitPriceInCents, accountId } = req.body;
    const userId = (req as any).user?.userId as string;

    if (!userId) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    const result = await this.placeOrderUseCase.execute({
      userId,
      accountId,
      stockId,
      type: type as OrderType,
      quantity,
      limitPriceInCents
    });

    if (result.isFailure()) {
      return res.status(400).json({ error: result.getError().message });
    }

    const order = result.getValue();
    return res.status(201).json({
      id: order.getId(),
      status: order.getStatus()
    });
  }

  async cancelOrder(req: Request, res: Response) {
    const { id } = req.params;
    const userId = (req as any).user?.userId as string;

    if (!userId) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    const result = await this.cancelOrderUseCase.execute(userId, id as string);

    if (result.isFailure()) {
      return res.status(400).json({ error: result.getError().message });
    }

    return res.status(200).json({ message: 'Order cancelled' });
  }

  async getPortfolio(req: Request, res: Response) {
    const userId = (req as any).user?.userId as string;

    if (!userId) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    const result = await this.getUserPortfolioUseCase.execute(userId);

    if (result.isFailure()) {
      return res.status(400).json({ error: result.getError().message });
    }

    const portfolio = result.getValue();
    const holdings = Array.from(portfolio.getHoldings().entries()).map(([stockId, quantity]) => ({
      stockId,
      quantity: quantity.getValue()
    }));

    return res.json({
      userId: portfolio.getUserId(),
      holdings
    });
  }

  async getUserOrders(req: Request, res: Response) {
    const userId = (req as any).user?.userId as string;

    if (!userId) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    const result = await this.getUserOrdersUseCase.execute(userId);

    if (result.isFailure()) {
      return res.status(400).json({ error: result.getError().message });
    }

    const orders = result.getValue();
    return res.json(orders.map(order => ({
      id: order.getId(),
      stockId: order.getStockId(),
      type: order.getType(),
      quantity: order.getQuantity().getValue(),
      limitPrice: order.getLimitPrice().getAmountInCents(),
      status: order.getStatus(),
      createdAt: order.getTimestamp()
    })));
  }

  async getStockOrders(req: Request, res: Response) {
    const { stockId } = req.params;

    if (!stockId) {
      return res.status(400).json({ error: 'Stock ID is required' });
    }

    const result = await this.getStockOrdersUseCase.execute(stockId);

    if (result.isFailure()) {
      return res.status(400).json({ error: result.getError().message });
    }

    const orders = result.getValue();
    return res.json(orders.map(order => ({
      id: order.getId(),
      stockId: order.getStockId(),
      type: order.getType(),
      quantity: order.getQuantity().getValue(),
      limitPrice: order.getLimitPrice().getAmountInCents(),
      status: order.getStatus(),
      createdAt: order.getTimestamp()
    })));
  }

  async getStockTrades(req: Request, res: Response) {
    const { stockId } = req.params;

    if (!stockId) {
      return res.status(400).json({ error: 'Stock ID is required' });
    }

    const result = await this.getStockTradesUseCase.execute(stockId);

    if (result.isFailure()) {
      return res.status(400).json({ error: result.getError().message });
    }

    const trades = result.getValue();
    return res.json(trades.map(trade => ({
      id: trade.getId(),
      buyOrderId: trade.getBuyOrderId(),
      sellOrderId: trade.getSellOrderId(),
      executionPrice: trade.getExecutionPrice().getAmountInCents(),
      quantity: trade.getQuantity().getValue(),
      aggressorSide: trade.getAggressorSide(),
      timestamp: trade.getTimestamp()
    })));
  }
}
