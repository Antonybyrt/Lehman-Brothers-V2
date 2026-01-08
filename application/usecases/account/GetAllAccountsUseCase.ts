import { AccountRepository } from '../../repositories/AccountRepository';
import { UserRepository } from '../../repositories/UserRepository';
import { Account } from '../../../domain/entities/Account';
import { exhaustive } from 'exhaustive';

export interface GetAllAccountsResponse {
  readonly success: boolean;
  readonly accounts?: Array<{
    readonly id: string;
    readonly name: string;
    readonly iban: string;
    readonly balance: number;
    readonly isSavings: boolean;
    readonly createdAt: Date;
  }>;
  readonly error?: string;
  readonly errorType?: 'validation' | 'not_found' | 'unauthorized' | 'server';
}

export class GetAllAccountsUseCase {
  constructor(
    private readonly accountRepository: AccountRepository,
    private readonly userRepository: UserRepository
  ) { }

  async execute(params: { userId: string }): Promise<GetAllAccountsResponse> {
    try {
      const user = await this.userRepository.findById(params.userId);
      if (!user) {
        return {
          success: false,
          error: 'User not found',
          errorType: 'not_found'
        };
      }

      if (!user.canAccessDirectorFeatures()) {
        return {
          success: false,
          error: 'User is not authorized to view all accounts',
          errorType: 'unauthorized'
        };
      }

      const accounts = await this.accountRepository.findAll();

      const accountsData = accounts.map(account => ({
        id: account.getId(),
        name: account.getName(),
        iban: account.getIban().getFormattedValue(),
        balance: account.getBalance(),
        isSavings: account.isSavingsAccount(),
        createdAt: account.getCreatedAt(),
      }));

      return {
        success: true,
        accounts: accountsData
      };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error occurred',
        errorType: 'server'
      };
    }
  }
}
