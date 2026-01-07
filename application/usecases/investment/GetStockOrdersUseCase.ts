import { IOrderRepository } from '../../repositories/IOrderRepository';
import { Result } from '../../../domain/values/Result';
import { Order } from '../../../domain/entities/Order';

export class GetStockOrdersUseCase {
  constructor(private readonly orderRepository: IOrderRepository) { }

  async execute(stockId: string): Promise<Result<Order[], Error>> {
    try {
      const orders = await this.orderRepository.findByStockId(stockId);
      // Filter only pending orders for the order book
      const pendingOrders = orders.filter(order => order.getStatus() === 'PENDING');
      return Result.success(pendingOrders);
    } catch (error) {
      return Result.failure(error instanceof Error ? error : new Error('Failed to fetch stock orders'));
    }
  }
}
