import { AccountRepository, TransactionRepository } from '../../repositories';
import { exhaustive } from 'exhaustive';
import { 
  AccountNotFoundError, 
  UnauthorizedAccountAccessError, 
  InvalidIbanError,
  InsufficientFundsError,
  InvalidTransferAmountError,
  SameAccountTransferError,
  Transaction,
  Iban
} from '@lehman-brothers/domain';

export interface TransferAccountRequest {
  readonly sourceAccountId: string;
  readonly userId: string;
  readonly targetIban: string;
  readonly amount: number;
  readonly description?: string;
}

export interface TransferAccountResponse {
  readonly success: boolean;
  readonly message?: string;
  readonly transactionId?: string;
  readonly sourceBalance?: number;
  readonly error?: string;
  readonly errorType?: 'validation' | 'not_found' | 'unauthorized' | 'insufficient_funds' | 'server';
}

export class TransferAccountUseCase {
  constructor(
    private readonly accountRepository: AccountRepository,
    private readonly transactionRepository: TransactionRepository
  ) {}

  public async execute(request: TransferAccountRequest): Promise<TransferAccountResponse> {
    if (!this.isValidRequest(request)) {
      return { 
        success: false, 
        error: 'Source account ID, User ID, target IBAN and amount are required', 
        errorType: 'validation' 
      };
    }

    try {
      // Validate amount
      if (request.amount <= 0) {
        throw new InvalidTransferAmountError(request.amount);
      }

      // Validate IBAN format
      let targetIban: Iban;
      try {
        targetIban = Iban.create(request.targetIban.replace(/\s/g, ''));
      } catch (error) {
        throw new InvalidIbanError(request.targetIban);
      }

      // Get source account
      const sourceAccount = await this.accountRepository.findById(request.sourceAccountId);
      if (!sourceAccount) {
        throw new AccountNotFoundError(request.sourceAccountId);
      }

      // Verify ownership
      if (sourceAccount.getUserId() !== request.userId) {
        throw new UnauthorizedAccountAccessError(request.sourceAccountId, request.userId);
      }

      // Check if trying to transfer to same account
      if (sourceAccount.getIban().getValue() === targetIban.getValue()) {
        throw new SameAccountTransferError(request.sourceAccountId);
      }

      // Check sufficient funds
      if (sourceAccount.getBalance() < request.amount) {
        throw new InsufficientFundsError(
          request.sourceAccountId,
          sourceAccount.getBalance(),
          request.amount
        );
      }

      // Check if target account exists in our platform (internal transfer)
      const targetAccount = await this.accountRepository.findByIban(targetIban.getValue());

      if (targetAccount) {
        // Internal transfer: both accounts are on our platform
        const transferResult = sourceAccount.transferTo(targetAccount, request.amount);
        if (transferResult.isFailure()) {
          throw transferResult.getError();
        }

        const { sourceAccount: updatedSourceAccount, targetAccount: updatedTargetAccount } = transferResult.getValue();

        // Create transaction record
        const transactionResult = Transaction.create({
          sourceAccountId: sourceAccount.getId(),
          targetAccountId: targetAccount.getId(),
          targetIban: targetIban.getValue(),
          amount: request.amount,
          description: request.description,
          type: 'TRANSFER'
        });

        if (transactionResult.isFailure()) {
          throw transactionResult.getError();
        }

        const transaction = transactionResult.getValue();

        // Persist changes atomically
        await this.transactionRepository.executeAtomicTransfer({
          sourceAccount: updatedSourceAccount,
          targetAccount: updatedTargetAccount,
          transaction
        });

        return {
          success: true,
          message: `Successfully transferred ${request.amount}€ to ${targetIban.getFormattedValue()}`,
          transactionId: transaction.getId(),
          sourceBalance: updatedSourceAccount.getBalance()
        };
      } else {
        // External transfer: target account is outside our platform
        const withdrawResult = sourceAccount.withdraw(request.amount);
        if (withdrawResult.isFailure()) {
          throw withdrawResult.getError();
        }

        const updatedSourceAccount = withdrawResult.getValue();

        // Create transaction record for external transfer
        const transactionResult = Transaction.create({
          sourceAccountId: sourceAccount.getId(),
          targetAccountId: undefined,
          targetIban: targetIban.getValue(),
          amount: request.amount,
          description: request.description,
          type: 'TRANSFER'
        });

        if (transactionResult.isFailure()) {
          throw transactionResult.getError();
        }

        const transaction = transactionResult.getValue();

        // Persist changes atomically
        await this.transactionRepository.executeAtomicTransfer({
          sourceAccount: updatedSourceAccount,
          transaction
        });

        return {
          success: true,
          message: `Successfully transferred ${request.amount}€ to external account ${targetIban.getFormattedValue()}`,
          transactionId: transaction.getId(),
          sourceBalance: updatedSourceAccount.getBalance()
        };
      }

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
      if (error instanceof InsufficientFundsError) {
        return { 
          success: false, 
          error: error.message, 
          errorType: 'insufficient_funds' 
        };
      }
      if (error instanceof InvalidTransferAmountError) {
        return { 
          success: false, 
          error: error.message, 
          errorType: 'validation' 
        };
      }
      if (error instanceof SameAccountTransferError) {
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

  private isValidRequest(request: TransferAccountRequest): boolean {
    return exhaustive(String(!!(request.sourceAccountId && request.userId && request.targetIban && request.amount !== undefined)), {
      'true': () => true,
      'false': () => false
    });
  }
}
