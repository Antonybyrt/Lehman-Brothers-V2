import { AccountRepository } from '../../repositories';
import { exhaustive } from 'exhaustive';
import { AccountNotFoundError, UnauthorizedAccountAccessError, TransferRequiredError, InvalidIbanError } from '@lehman-brothers/domain';

export interface DeleteAccountRequest {
  readonly accountId: string;
  readonly userId: string;
  readonly transferIban?: string;
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

      if (account.getBalance() > 0) {
        if (!request.transferIban) {
          throw new TransferRequiredError(request.accountId);
        }

        try {
          const { Iban } = await import('@lehman-brothers/domain');
          Iban.create(request.transferIban);
        } catch (error) {
          throw new InvalidIbanError(request.transferIban);
        }

        const targetAccount = await this.accountRepository.findByIban(request.transferIban);
        if (!targetAccount) {
          throw new AccountNotFoundError(`Account with IBAN ${request.transferIban}`);
        }

        const transferResult = account.transferTo(targetAccount, account.getBalance());
        if (transferResult.isFailure()) {
          throw transferResult.getError();
        }

        const { sourceAccount, targetAccount: updatedTargetAccount } = transferResult.getValue();
        
        await this.accountRepository.save(sourceAccount);
        await this.accountRepository.save(updatedTargetAccount);
      }

      await this.accountRepository.delete(request.accountId);

      return {
        success: true,
        message: account.getBalance() > 0 
          ? `Account deleted successfully. Balance transferred to ${request.transferIban}`
          : 'Account deleted successfully'
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
      if (error instanceof TransferRequiredError) {
        return { 
          success: false, 
          error: error.message, 
          errorType: 'validation' 
        };
      }
      if (error instanceof InvalidIbanError) {
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

  private isValidRequest(request: DeleteAccountRequest): boolean {
    return exhaustive(String(!!(request.accountId && request.userId)), {
      'true': () => true,
      'false': () => false
    });
  }
}
