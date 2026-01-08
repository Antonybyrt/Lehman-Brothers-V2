import { IOrderRepository } from '../../repositories/IOrderRepository';
import { Result } from '../../../domain/values/Result';
import { Order } from '../../../domain/entities/Order';

export class GetUserOrdersUseCase {
  constructor(private readonly orderRepository: IOrderRepository) { }

  async execute(userId: string): Promise<Result<Order[], Error>> {
    try {
      const orders = await this.orderRepository.findByUserId(userId);
      return Result.success(orders);
    } catch (error) {
      return Result.failure(error instanceof Error ? error : new Error('Failed to fetch user orders'));
    }
  }
}
