import { AccountRepository } from '../../repositories';
import { exhaustive } from 'exhaustive';
import { 
  AccountNotFoundError, 
  UnauthorizedAccountAccessError, 
  InvalidAccountNameError,
  InvalidInitialBalanceError
} from '@lehman-brothers/domain';

export interface UpdateAccountRequest {
  readonly accountId: string;
  readonly userId: string;
  readonly name?: string;
  readonly balance?: number;
}

export interface UpdateAccountResponse {
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

export class UpdateAccountUseCase {
  constructor(private readonly accountRepository: AccountRepository) {}

  public async execute(request: UpdateAccountRequest): Promise<UpdateAccountResponse> {
    if (!this.isValidRequest(request)) {
      return { 
        success: false, 
        error: 'Account ID and User ID are required', 
        errorType: 'validation' 
      };
    }

    if (request.name !== undefined && (!request.name || request.name.trim().length === 0 || request.name.trim().length > 50)) {
      const error = new InvalidAccountNameError(request.name);
      return { 
        success: false, 
        error: error.message, 
        errorType: 'validation' 
      };
    }

    if (request.balance !== undefined && request.balance < 0) {
      const error = new InvalidInitialBalanceError(request.balance);
      return { 
        success: false, 
        error: error.message, 
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

      let updatedAccount = account;
      
      if (request.name !== undefined) {
        const renameResult = updatedAccount.rename(request.name);
        if (renameResult.isFailure()) {
          throw renameResult.getError();
        }
        updatedAccount = renameResult.getValue();
      }

      if (request.balance !== undefined) {
        const balanceResult = updatedAccount.updateBalance(request.balance);
        if (balanceResult.isFailure()) {
          throw balanceResult.getError();
        }
        updatedAccount = balanceResult.getValue();
      }

      await this.accountRepository.save(updatedAccount);

      const accountData = {
        id: updatedAccount.getId(),
        name: updatedAccount.getName(),
        iban: updatedAccount.getIban().getFormattedValue(),
        balance: updatedAccount.getBalance(),
        isSavings: updatedAccount.isSavingsAccount(),
        createdAt: updatedAccount.getCreatedAt(),
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
      if (error instanceof InvalidAccountNameError) {
        return { 
          success: false, 
          error: error.message, 
          errorType: 'validation' 
        };
      }
      if (error instanceof InvalidInitialBalanceError) {
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

  private isValidRequest(request: UpdateAccountRequest): boolean {
    return exhaustive(String(!!(request.accountId && request.userId)), {
      'true': () => true,
      'false': () => false
    });
  }
}
