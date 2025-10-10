import { Account } from '@lehman-brothers/domain';
import { AccountRepository, UserRepository } from '../../repositories';
import { exhaustive } from 'exhaustive';
import { UserNotFoundError, ValidationError } from '@lehman-brothers/domain';

export interface GetUserAccountsRequest {
  readonly userId: string;
}

export interface GetUserAccountsResponse {
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
  readonly errorType?: 'validation' | 'not_found' | 'server';
  readonly message?: string;
}

export class GetUserAccountsUseCase {
  constructor(
    private readonly accountRepository: AccountRepository,
    private readonly userRepository: UserRepository
  ) {}

  public async execute(request: GetUserAccountsRequest): Promise<GetUserAccountsResponse> {
    if (!this.isValidRequest(request)) {
      return { 
        success: false, 
        error: 'User ID is required', 
        errorType: 'validation' 
      };
    }

    try {
      // Check if user exists
      const user = await this.userRepository.findById(request.userId);
      if (!user) {
        throw new UserNotFoundError(request.userId);
      }

      // Get user accounts
      const accounts = await this.accountRepository.findByUserId(request.userId);

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
        accounts: accountsData,
        message: 'Accounts retrieved successfully'
      };

    } catch (error) {
      if (error instanceof UserNotFoundError) {
        return { 
          success: false, 
          error: error.message, 
          errorType: 'not_found' 
        };
      }
      if (error instanceof ValidationError) {
        return { 
          success: false, 
          error: error.message, 
          errorType: 'validation' 
        };
      }
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error occurred',
        errorType: 'server'
      };
    }
  }

  private isValidRequest(request: GetUserAccountsRequest): boolean {
    return exhaustive(String(!!request.userId), {
      'true': () => true,
      'false': () => false
    });
  }
}
