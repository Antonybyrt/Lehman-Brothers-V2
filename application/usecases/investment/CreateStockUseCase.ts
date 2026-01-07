import { Stock } from '../../../domain/entities/Stock';
import { StockSymbol } from '../../../domain/values/StockSymbol';
import { Money } from '../../../domain/values/Money';
import { Quantity } from '../../../domain/values/Quantity';
import { Portfolio } from '../../../domain/entities/Portfolio';
import { IStockRepository } from '../../repositories/IStockRepository';
import { IPortfolioRepository } from '../../repositories/IPortfolioRepository';
import { UserRepository } from '../../repositories/UserRepository';
import { Result } from '../../../domain/values/Result';

export const BANK_PORTFOLIO_ID = 'BANK';

export class CreateStockUseCase {
  constructor(
    private readonly stockRepository: IStockRepository,
    private readonly portfolioRepository: IPortfolioRepository,
    private readonly userRepository: UserRepository
  ) { }

  async execute(params: {
    directorId: string;
    symbol: string;
    name: string;
    isin: string;
    initialPriceInCents: number;
    initialQuantity: number;
  }): Promise<Result<Stock, Error>> {
    // Verify Director Access
    const user = await this.userRepository.findById(params.directorId);
    if (!user) {
      return Result.failure(new Error('User not found'));
    }
    if (!user.canAccessDirectorFeatures()) {
      return Result.failure(new Error('User is not authorized to create stocks'));
    }
    const symbolResult = StockSymbol.create(params.symbol);
    if (symbolResult.isFailure()) return Result.failure(symbolResult.getError());

    const priceResult = Money.create(params.initialPriceInCents);
    if (priceResult.isFailure()) return Result.failure(priceResult.getError());

    const quantityResult = Quantity.create(params.initialQuantity);
    if (quantityResult.isFailure()) return Result.failure(quantityResult.getError());

    const stockResult = Stock.create({
      symbol: symbolResult.getValue(),
      name: params.name,
      isin: params.isin,
      currentPrice: priceResult.getValue(),
    });

    if (stockResult.isFailure()) return Result.failure(stockResult.getError());

    const stock = stockResult.getValue();
    await this.stockRepository.save(stock);

    // Mint initial shares to Bank Portfolio
    let bankPortfolio = await this.portfolioRepository.findByUserId(BANK_PORTFOLIO_ID);
    if (!bankPortfolio) {
      const portfolioResult = Portfolio.create({ userId: BANK_PORTFOLIO_ID });
      if (portfolioResult.isFailure()) return Result.failure(portfolioResult.getError());
      bankPortfolio = portfolioResult.getValue();
    }

    bankPortfolio.addShares(stock.getId(), quantityResult.getValue());
    await this.portfolioRepository.save(bankPortfolio);

    return Result.success(stock);
  }
}
