import { ITradeRepository } from '../../../../application/repositories/ITradeRepository';
import { Trade } from '../../../../domain/entities/Trade';
import { PrismaClient, OrderType as PrismaOrderType } from '@prisma/client';
import { OrderType } from '../../../../domain/values/OrderType';

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
        aggressor_side: data.aggressorSide as PrismaOrderType,
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
      aggressorSide: tradeData.aggressor_side as unknown as OrderType,
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
      aggressorSide: tradeData.aggressor_side as unknown as OrderType,
      timestamp: tradeData.timestamp,
    }));
  }
  async findByStockId(stockId: string): Promise<Trade[]> {
    const tradesData = await this.prisma.trade.findMany({
      where: {
        OR: [
          { buy_order: { stock_id: stockId } },
          { sell_order: { stock_id: stockId } },
        ],
      },
      orderBy: {
        timestamp: 'desc',
      },
    });

    return tradesData.map(tradeData => Trade.fromPersistence({
      id: tradeData.id,
      buyOrderId: tradeData.buy_order_id,
      sellOrderId: tradeData.sell_order_id,
      executionPrice: tradeData.price,
      quantity: tradeData.quantity,
      fee: tradeData.fee,
      aggressorSide: tradeData.aggressor_side as unknown as OrderType,
      timestamp: tradeData.timestamp,
    }));
  }
}
