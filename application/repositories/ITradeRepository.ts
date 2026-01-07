import { Trade } from '../../domain/entities/Trade';

export interface ITradeRepository {
  save(trade: Trade): Promise<void>;
  findByOrderId(orderId: string): Promise<Trade[]>;
}
