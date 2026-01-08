import { Stock } from '../../../domain/entities/Stock';
import { IStockRepository } from '../../repositories/IStockRepository';
import { UserRepository } from '../../repositories/UserRepository';

export class ListStocksUseCase {
  constructor(
    private readonly stockRepository: IStockRepository,
    private readonly userRepository: UserRepository
  ) { }

  async execute(params?: { includeInactive?: boolean; userId?: string }): Promise<Stock[]> {
    if (params?.includeInactive) {
      if (!params.userId) {
        throw new Error('UserId is required to view inactive stocks');
      }
      const user = await this.userRepository.findById(params.userId);
      if (!user || !user.canAccessDirectorFeatures()) {
        throw new Error('User is not authorized to view inactive stocks');
      }
      return this.stockRepository.findAll();
    }
    return this.stockRepository.findAllActive();
  }
}
