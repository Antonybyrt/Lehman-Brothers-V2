import { Portfolio } from '../../domain/entities/Portfolio';

export interface IPortfolioRepository {
  save(portfolio: Portfolio): Promise<void>;
  findByUserId(userId: string): Promise<Portfolio | null>;
}
