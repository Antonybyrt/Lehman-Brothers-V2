import { IOrderRepository } from '../../../../application/repositories/IOrderRepository';
import { Order } from '../../../../domain/entities/Order';
import { PrismaClient } from '@prisma/client';

export class PrismaOrderRepository implements IOrderRepository {
  constructor(private readonly prisma: PrismaClient) { }

  async save(order: Order): Promise<void> {
    const data = order.toPersistence();
    await this.prisma.order.upsert({
      where: { id: order.getId() },
      update: {
        user_id: data.userId,
        stock_id: data.stockId,
        type: data.type,
        limit_price: data.limitPrice,
        quantity: data.quantity,
        status: data.status,
        // fee is not in Order entity yet? Let's check Order.ts
      },
      create: {
        id: order.getId(),
        user_id: data.userId,
        stock_id: data.stockId,
        type: data.type,
        limit_price: data.limitPrice,
        quantity: data.quantity,
        status: data.status,
      },
    });
  }

  async findById(id: string): Promise<Order | null> {
    const orderData = await this.prisma.order.findUnique({
      where: { id },
    });

    if (!orderData) return null;

    return Order.fromPersistence({
      id: orderData.id,
      userId: orderData.user_id,
      stockId: orderData.stock_id,
      type: orderData.type as any, // Cast to enum
      limitPrice: orderData.limit_price,
      quantity: orderData.quantity,
      status: orderData.status,
      createdAt: orderData.created_at
    });
  }

  async findByUserId(userId: string): Promise<Order[]> {
    const ordersData = await this.prisma.order.findMany({
      where: { user_id: userId },
    });

    return ordersData.map(orderData => Order.fromPersistence({
      id: orderData.id,
      userId: orderData.user_id,
      stockId: orderData.stock_id,
      type: orderData.type as any,
      limitPrice: orderData.limit_price,
      quantity: orderData.quantity,
      status: orderData.status as any,
      createdAt: orderData.created_at
    }));
  }
}
