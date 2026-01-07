import { ITradeRepository } from '../../repositories/ITradeRepository';
import { Result } from '../../../domain/values/Result';
import { Trade } from '../../../domain/entities/Trade';

export class GetStockTradesUseCase {
  constructor(private readonly tradeRepository: ITradeRepository) { }

  async execute(stockId: string): Promise<Result<Trade[], Error>> {
    try {
      const trades = await this.tradeRepository.findByStockId(stockId);
      return Result.success(trades);
    } catch (error: any) {
      return Result.failure(new Error(`Failed to fetch trades: ${error.message}`));
    }
  }
}
