import { ITradeRepository } from '../../../../application/repositories/ITradeRepository';
import { Trade } from '../../../../domain/entities/Trade';
import { PrismaClient } from '@prisma/client';

export class PrismaTradeRepository implements ITradeRepository {
  constructor(private readonly prisma: PrismaClient) { }

  async save(trade: Trade): Promise<void> {
    const data = trade.toPersistence();
    await this.prisma.trade.create({
      data: {
        id: trade.getId(),
        buy_order_id: data.buyOrderId,
        sell_order_id: data.sellOrderId,
        price: data.executionPrice,
        quantity: data.quantity,
        fee: data.fee,
        timestamp: data.timestamp,
      },
    });
  }

  async findById(id: string): Promise<Trade | null> {
    const tradeData = await this.prisma.trade.findUnique({
      where: { id },
    });

    if (!tradeData) return null;

    return Trade.fromPersistence({
      id: tradeData.id,
      buyOrderId: tradeData.buy_order_id,
      sellOrderId: tradeData.sell_order_id,
      executionPrice: tradeData.price,
      quantity: tradeData.quantity,
      fee: tradeData.fee,
      timestamp: tradeData.timestamp,
    });
  }

  async findByOrderId(orderId: string): Promise<Trade[]> {
    const tradesData = await this.prisma.trade.findMany({
      where: {
        OR: [
          { buy_order_id: orderId },
          { sell_order_id: orderId },
        ],
      },
    });

    return tradesData.map(tradeData => Trade.fromPersistence({
      id: tradeData.id,
      buyOrderId: tradeData.buy_order_id,
      sellOrderId: tradeData.sell_order_id,
      executionPrice: tradeData.price,
      quantity: tradeData.quantity,
      fee: tradeData.fee,
      timestamp: tradeData.timestamp,
    }));
  }
}
