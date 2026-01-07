import { IPortfolioRepository } from '../../../../application/repositories/IPortfolioRepository';
import { Portfolio } from '../../../../domain/entities/Portfolio';
import { Quantity } from '../../../../domain/values/Quantity';
import { PrismaClient } from '@prisma/client';

export class PrismaPortfolioRepository implements IPortfolioRepository {
  constructor(private readonly prisma: PrismaClient) { }

  async save(portfolio: Portfolio): Promise<void> {
    const userId = portfolio.getUserId();
    const holdings = portfolio.getHoldings();

    for (const [stockId, quantity] of holdings) {
      if (quantity.getValue() > 0) {
        await this.prisma.portfolio.upsert({
          where: {
            user_id_stock_id: {
              user_id: userId,
              stock_id: stockId,
            },
          },
          update: {
            quantity: quantity.getValue(),
          },
          create: {
            user_id: userId,
            stock_id: stockId,
            quantity: quantity.getValue(),
          },
        });
      } else {
        await this.prisma.portfolio.deleteMany({
          where: {
            user_id: userId,
            stock_id: stockId
          }
        });
      }
    }
  }

  async findByUserId(userId: string): Promise<Portfolio | null> {
    const portfolioItems = await this.prisma.portfolio.findMany({
      where: { user_id: userId },
    });

    if (portfolioItems.length === 0) {
      return null;
    }

    const portfolioResult = Portfolio.create({ userId });
    if (portfolioResult.isFailure()) return null;
    const portfolio = portfolioResult.getValue();

    for (const item of portfolioItems) {
      const quantityResult = Quantity.create(item.quantity);
      if (quantityResult.isSuccess()) {
        portfolio.addShares(item.stock_id, quantityResult.getValue());
      }
    }

    return portfolio;
  }
}
