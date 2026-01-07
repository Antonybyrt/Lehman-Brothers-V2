import { IOrderRepository } from '../../repositories/IOrderRepository';
import { IPortfolioRepository } from '../../repositories/IPortfolioRepository';
import { AccountRepository } from '../../repositories/AccountRepository';
import { Result } from '../../../domain/values/Result';
import { OrderStatus } from '../../../domain/values/OrderStatus';
import { OrderType } from '../../../domain/values/OrderType';

export class CancelOrderUseCase {
  constructor(
    private readonly orderRepository: IOrderRepository,
    private readonly portfolioRepository: IPortfolioRepository,
    private readonly accountRepository: AccountRepository
  ) { }

  async execute(userId: string, orderId: string): Promise<Result<void, Error>> {
    const order = await this.orderRepository.findById(orderId);
    if (!order) {
      return Result.failure(new Error('Order not found'));
    }

    if (order.getUserId() !== userId) {
      return Result.failure(new Error('Order does not belong to user'));
    }

    if (order.getStatus() !== OrderStatus.PENDING) {
      return Result.failure(new Error('Order cannot be cancelled'));
    }

    // Cancel the order
    const cancelledOrder = order.cancel();

    // Refund shares if it was a SELL order
    if (cancelledOrder.getType() === OrderType.SELL) {
      const portfolio = await this.portfolioRepository.findByUserId(userId);
      if (portfolio) {
        portfolio.addShares(cancelledOrder.getStockId(), cancelledOrder.getQuantity());
        await this.portfolioRepository.save(portfolio);
      } else {
        // Should not happen if order was placed correctly, but safe to ignore or log
      }
    } else if (cancelledOrder.getType() === OrderType.BUY) {
      // Refund reserved cash
      const accounts = await this.accountRepository.findByUserId(userId);
      const defaultAccount = accounts[0];

      if (defaultAccount) {
        const refundAmount = cancelledOrder.getLimitPrice().multiply(cancelledOrder.getQuantity().getValue()).getAmountInEuro();

        const depositResult = defaultAccount.deposit(refundAmount);
        if (depositResult.isFailure()) return Result.failure(depositResult.getError());

        await this.accountRepository.save(depositResult.getValue());
      } else {
        // Account might have been deleted? Log warning.
      }
    }

    await this.orderRepository.save(cancelledOrder);

    return Result.success(undefined);
  }
}
