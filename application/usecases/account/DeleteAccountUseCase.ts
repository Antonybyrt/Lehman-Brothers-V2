import { AccountRepository } from '../../repositories';
import { exhaustive } from 'exhaustive';
import { AccountNotFoundError, UnauthorizedAccountAccessError } from '@lehman-brothers/domain';

export interface DeleteAccountRequest {
  readonly accountId: string;
  readonly userId: string;
}

export interface DeleteAccountResponse {
  readonly success: boolean;
  readonly message?: string;
  readonly error?: string;
  readonly errorType?: 'validation' | 'not_found' | 'unauthorized' | 'server';
}

export class DeleteAccountUseCase {
  constructor(private readonly accountRepository: AccountRepository) {}

  public async execute(request: DeleteAccountRequest): Promise<DeleteAccountResponse> {
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

      await this.accountRepository.delete(request.accountId);

      return {
        success: true,
        message: 'Account deleted successfully'
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

  private isValidRequest(request: DeleteAccountRequest): boolean {
    return exhaustive(String(!!(request.accountId && request.userId)), {
      'true': () => true,
      'false': () => false
    });
  }
}
