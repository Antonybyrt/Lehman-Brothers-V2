import { Order } from '../../../domain/entities/Order';
import { Stock } from '../../../domain/entities/Stock';
import { Portfolio } from '../../../domain/entities/Portfolio';
import { OrderType } from '../../../domain/values/OrderType';
import { Quantity } from '../../../domain/values/Quantity';
import { Money } from '../../../domain/values/Money';
import { Result } from '../../../domain/values/Result';
import { IOrderRepository } from '../../repositories/IOrderRepository';
import { IStockRepository } from '../../repositories/IStockRepository';
import { IPortfolioRepository } from '../../repositories/IPortfolioRepository';
import { AccountRepository } from '../../repositories/AccountRepository';
import { StockNotActiveError, InsufficientSharesError, InvalidOrderError } from '../../../domain/errors/InvestmentErrors';

export class PlaceOrderUseCase {
  constructor(
    private readonly orderRepository: IOrderRepository,
    private readonly stockRepository: IStockRepository,
    private readonly portfolioRepository: IPortfolioRepository,
    private readonly accountRepository: AccountRepository
  ) { }

  async execute(params: {
    userId: string;
    stockId: string;
    type: OrderType;
    quantity: number;
    limitPriceInCents: number;
  }): Promise<Result<Order, Error>> {
    // 1. Validate inputs
    const quantityResult = Quantity.create(params.quantity);
    if (quantityResult.isFailure()) return Result.failure(quantityResult.getError());

    const priceResult = Money.create(params.limitPriceInCents);
    if (priceResult.isFailure()) return Result.failure(priceResult.getError());

    const quantity = quantityResult.getValue();
    const limitPrice = priceResult.getValue();

    // 2. Fetch Stock and Validate
    const stock = await this.stockRepository.findById(params.stockId);
    if (!stock) {
      return Result.failure(new Error('Stock not found'));
    }
    if (!stock.isActive()) {
      return Result.failure(new StockNotActiveError(stock.getId()));
    }

    // 3. Fetch Portfolio (if needed for SELL)
    let portfolio = await this.portfolioRepository.findByUserId(params.userId);
    if (!portfolio) {
      // Create empty portfolio if not exists
      const portfolioResult = Portfolio.create({ userId: params.userId });
      if (portfolioResult.isFailure()) return Result.failure(portfolioResult.getError());
      portfolio = portfolioResult.getValue();
    }

    // 4. Fetch User Accounts (for Cash Check)
    const accounts = await this.accountRepository.findByUserId(params.userId);
    const defaultAccount = accounts[0];
    if (!defaultAccount) {
      return Result.failure(new Error('User must have at least one account to place orders'));
    }

    // 5. Validate Business Rules
    if (params.type === OrderType.SELL) {
      if (!portfolio.hasSufficientShares(params.stockId, quantity)) {
        const available = portfolio.getQuantityForStock(params.stockId).getValue();
        return Result.failure(new InsufficientSharesError(params.stockId, quantity.getValue(), available));
      }
      // Deduct shares immediately (reservation)
      const removeResult = portfolio.removeShares(params.stockId, quantity);
      if (removeResult.isFailure()) return Result.failure(removeResult.getError());
      await this.portfolioRepository.save(portfolio);
    } else if (params.type === OrderType.BUY) {
      const totalCost = limitPrice.multiply(quantity.getValue());
      const costInEuro = totalCost.getAmountInEuro();

      // Check and Withdraw Cash
      if (defaultAccount.getBalance() < costInEuro) {
        return Result.failure(new Error(`Insufficient funds in default account. Required: ${costInEuro}, Available: ${defaultAccount.getBalance()}`));
      }

      const withdrawResult = defaultAccount.withdraw(costInEuro);
      if (withdrawResult.isFailure()) return Result.failure(withdrawResult.getError());

      await this.accountRepository.save(withdrawResult.getValue());
    }

    // 6. Create Order
    const orderResult = Order.create({
      userId: params.userId,
      stockId: params.stockId,
      type: params.type,
      quantity: quantity,
      limitPrice: limitPrice,
    });

    if (orderResult.isFailure()) return Result.failure(orderResult.getError());

    const order = orderResult.getValue();

    // 7. Save Order
    await this.orderRepository.save(order);

    return Result.success(order);
  }
}
