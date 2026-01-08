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

import { MatchOrdersUseCase } from './MatchOrdersUseCase';

export class PlaceOrderUseCase {
  constructor(
    private readonly orderRepository: IOrderRepository,
    private readonly stockRepository: IStockRepository,
    private readonly portfolioRepository: IPortfolioRepository,
    private readonly accountRepository: AccountRepository,
    private readonly matchOrdersUseCase: MatchOrdersUseCase
  ) { }

  async execute(params: {
    userId: string;
    accountId?: string;
    stockId: string;
    type: OrderType;
    quantity: number;
    limitPriceInCents: number;
    skipFees?: boolean;
  }): Promise<Result<Order, Error>> {
    // 1. Validate inputs
    const quantityResult = Quantity.create(params.quantity);
    if (quantityResult.isFailure()) return Result.failure(quantityResult.getError());
    const quantity = quantityResult.getValue();
    if (quantity.getValue() <= 0) {
      return Result.failure(new Error('Order quantity must be positive'));
    }

    const priceResult = Money.create(params.limitPriceInCents);
    if (priceResult.isFailure()) return Result.failure(priceResult.getError());

    // const quantity = quantityResult.getValue(); // Already declared above
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

    // 4. Validate Business Rules
    const FEE_IN_EUROS = 1;

    // Fetch account logic
    let account;
    // We need an account if:
    // 1. It's a BUY order (to pay for stock)
    // 2. It's a SELL order AND fees are NOT skipped (to pay for fees)
    const needsAccount = params.type === OrderType.BUY || !params.skipFees;

    if (needsAccount) {
      if (params.accountId) {
        account = await this.accountRepository.findById(params.accountId);
      } else {
        // Try to find a default account
        const accounts = await this.accountRepository.findByUserId(params.userId);
        if (accounts.length > 0) account = accounts[0];
      }

      if (!account) {
        if (params.type === OrderType.BUY) return Result.failure(new Error('No account found to pay for order'));
        return Result.failure(new Error('No account found to pay fees'));
      }
      if (account.getUserId() !== params.userId) {
        return Result.failure(new Error('Account does not belong to user'));
      }
    }

    if (params.type === OrderType.SELL) {
      if (!portfolio.hasSufficientShares(params.stockId, quantity)) {
        const available = portfolio.getQuantityForStock(params.stockId).getValue();
        return Result.failure(new InsufficientSharesError(params.stockId, quantity.getValue(), available));
      }

      // Check and Withdraw Fee
      if (!params.skipFees && account) {
        if (account.getBalance() < FEE_IN_EUROS) {
          return Result.failure(new Error(`Insufficient funds for fee. Required: ${FEE_IN_EUROS}€`));
        }
        const feeWithdraw = account.withdraw(FEE_IN_EUROS);
        if (feeWithdraw.isFailure()) return Result.failure(feeWithdraw.getError());
        await this.accountRepository.save(feeWithdraw.getValue());
      }

      // Deduct shares immediately (reservation)
      const removeResult = portfolio.removeShares(params.stockId, quantity);
      if (removeResult.isFailure()) return Result.failure(removeResult.getError());
      await this.portfolioRepository.save(portfolio);

    } else if (params.type === OrderType.BUY) {
      const totalCost = limitPrice.multiply(quantity.getValue());
      const costInEuro = totalCost.getAmountInEuro();
      // Fee is 0 if skipped
      const fee = params.skipFees ? 0 : FEE_IN_EUROS;
      const totalRequired = costInEuro + fee;

      // Check and Withdraw Cash + Fee
      if (account && account.getBalance() < totalRequired) {
        return Result.failure(new Error(`Insufficient funds. Required: ${totalRequired}€ (incl. ${fee}€ fee), Available: ${account.getBalance()}€`));
      }

      if (account) {
        const withdrawResult = account.withdraw(totalRequired);
        if (withdrawResult.isFailure()) return Result.failure(withdrawResult.getError());
        await this.accountRepository.save(withdrawResult.getValue());
      }
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

    // 8. Match Orders
    await this.matchOrdersUseCase.execute(order);

    return Result.success(order);
  }
}
