import { IStockRepository } from '../../repositories/IStockRepository';
import { UserRepository } from '../../repositories/UserRepository';
import { Result } from '../../../domain/values/Result';

export class UpdateStockStatusUseCase {
  constructor(
    private readonly stockRepository: IStockRepository,
    private readonly userRepository: UserRepository
  ) { }

  async execute(directorId: string, stockId: string, isActive: boolean): Promise<Result<void, Error>> {
    // Verify Director Access
    const user = await this.userRepository.findById(directorId);
    if (!user) {
      return Result.failure(new Error('User not found'));
    }
    if (!user.canAccessDirectorFeatures()) {
      return Result.failure(new Error('User is not authorized to update stock status'));
    }
    const stock = await this.stockRepository.findById(stockId);
    if (!stock) {
      return Result.failure(new Error('Stock not found'));
    }

    const updatedStock = isActive ? stock.activate() : stock.deactivate();
    await this.stockRepository.save(updatedStock);

    return Result.success(undefined);
  }
}
