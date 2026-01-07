import { Portfolio } from '../../../domain/entities/Portfolio';
import { IPortfolioRepository } from '../../repositories/IPortfolioRepository';
import { Result } from '../../../domain/values/Result';

export class GetUserPortfolioUseCase {
  constructor(private readonly portfolioRepository: IPortfolioRepository) { }

  async execute(userId: string): Promise<Result<Portfolio, Error>> {
    let portfolio = await this.portfolioRepository.findByUserId(userId);

    if (!portfolio) {
      // Return empty portfolio if none exists yet
      const portfolioResult = Portfolio.create({ userId });
      if (portfolioResult.isFailure()) return Result.failure(portfolioResult.getError());
      portfolio = portfolioResult.getValue();
    }

    return Result.success(portfolio);
  }
}
