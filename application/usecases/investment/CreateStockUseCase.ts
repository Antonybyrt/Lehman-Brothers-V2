import { Stock } from '../../../domain/entities/Stock';
import { StockSymbol } from '../../../domain/values/StockSymbol';
import { Money } from '../../../domain/values/Money';
import { Quantity } from '../../../domain/values/Quantity';
import { Portfolio } from '../../../domain/entities/Portfolio';
import { IStockRepository } from '../../repositories/IStockRepository';
import { IPortfolioRepository } from '../../repositories/IPortfolioRepository';
import { UserRepository } from '../../repositories/UserRepository';
import { Result } from '../../../domain/values/Result';
import { User } from '../../../domain/entities/User';
import { Email } from '../../../domain/values/Email';
import { Password } from '../../../domain/values/Password';
import { UserRoleValue } from '../../../domain/values/UserRole';

import { PlaceOrderUseCase } from './PlaceOrderUseCase';
import { OrderType } from '../../../domain/values/OrderType';

export const BANK_PORTFOLIO_ID = '00000000-0000-0000-0000-000000000000';

export class CreateStockUseCase {
  constructor(
    private readonly stockRepository: IStockRepository,
    private readonly portfolioRepository: IPortfolioRepository,
    private readonly userRepository: UserRepository,
    private readonly placeOrderUseCase: PlaceOrderUseCase
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
    if (quantityResult.getValue().getValue() <= 0) {
      return Result.failure(new Error('Initial quantity must be positive'));
    }

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
    const bankEmail = 'bank@lehman-brothers.com';
    let bankUser = await this.userRepository.findByEmail(bankEmail);
    let bankUserId = bankUser ? bankUser.getId() : BANK_PORTFOLIO_ID;

    if (!bankUser) {
      const email = Email.create(bankEmail);
      const password = await Password.create('BankSecretPassword123!');
      const role = UserRoleValue.create('DIRECTOR');

      const newBankUser = User.fromPersistence({
        id: BANK_PORTFOLIO_ID,
        firstName: 'Lehman',
        lastName: 'Brothers',
        email,
        password,
        role,
        active: true,
        emailConfirmed: true,
        createdAt: new Date(),
      });
      await this.userRepository.save(newBankUser);
      bankUser = newBankUser;
      bankUserId = BANK_PORTFOLIO_ID;
    }

    let bankPortfolio = await this.portfolioRepository.findByUserId(bankUserId);
    if (!bankPortfolio) {
      const portfolioResult = Portfolio.create({ userId: bankUserId });
      if (portfolioResult.isFailure()) return Result.failure(portfolioResult.getError());
      bankPortfolio = portfolioResult.getValue();
    }

    bankPortfolio.addShares(stock.getId(), quantityResult.getValue());
    await this.portfolioRepository.save(bankPortfolio);

    const orderResult = await this.placeOrderUseCase.execute({
      userId: bankUserId,
      stockId: stock.getId(),
      type: OrderType.SELL,
      quantity: params.initialQuantity,
      limitPriceInCents: params.initialPriceInCents
    });

    if (orderResult.isFailure()) {
      console.error('Failed to place initial order:', orderResult.getError());
      return Result.failure(new Error(`Stock created but failed to place initial order: ${orderResult.getError().message}`));
    }

    return Result.success(stock);
  }
}
