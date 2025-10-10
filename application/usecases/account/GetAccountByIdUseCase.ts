import { Account } from '@lehman-brothers/domain';
import { AccountRepository } from '../../repositories';
import { exhaustive } from 'exhaustive';
import { AccountNotFoundError, UnauthorizedAccountAccessError } from '@lehman-brothers/domain';

export interface GetAccountByIdRequest {
  readonly accountId: string;
  readonly userId: string;
}

export interface GetAccountByIdResponse {
  readonly success: boolean;
  readonly account?: {
    readonly id: string;
    readonly name: string;
    readonly iban: string;
    readonly balance: number;
    readonly isSavings: boolean;
    readonly createdAt: Date;
  };
  readonly error?: string;
  readonly errorType?: 'validation' | 'not_found' | 'unauthorized' | 'server';
}

export class GetAccountByIdUseCase {
  constructor(private readonly accountRepository: AccountRepository) {}

  public async execute(request: GetAccountByIdRequest): Promise<GetAccountByIdResponse> {
    if (!this.isValidRequest(request)) {
      return { 
        success: false, 
        error: 'Account ID and User ID are required', 
        errorType: 'validation' 
      };
    }

    try {
      const account = await this.accountRepository.findById(request.accountId);
      if (!account) {
        throw new AccountNotFoundError(request.accountId);
      }

      if (account.getUserId() !== request.userId) {
        throw new UnauthorizedAccountAccessError(request.accountId, request.userId);
      }

      const accountData = {
        id: account.getId(),
        name: account.getName(),
        iban: account.getIban().getFormattedValue(),
        balance: account.getBalance(),
        isSavings: account.isSavingsAccount(),
        createdAt: account.getCreatedAt(),
      };

      return {
        success: true,
        account: accountData
      };

    } catch (error) {
      if (error instanceof AccountNotFoundError) {
        return { 
          success: false, 
          error: error.message, 
          errorType: 'not_found' 
        };
      }
      if (error instanceof UnauthorizedAccountAccessError) {
        return { 
          success: false, 
          error: error.message, 
          errorType: 'unauthorized' 
        };
      }
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error occurred',
        errorType: 'server'
      };
    }
  }

  private isValidRequest(request: GetAccountByIdRequest): boolean {
    return exhaustive(String(!!(request.accountId && request.userId)), {
      'true': () => true,
      'false': () => false
    });
  }
}
