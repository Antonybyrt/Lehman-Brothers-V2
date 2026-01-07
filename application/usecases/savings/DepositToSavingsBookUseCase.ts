import { SavingsBookRepository } from '../../repositories/SavingsBookRepository';
import { AccountRepository } from '../../repositories/AccountRepository';

export interface DepositToSavingsBookInput {
    userId: string;
    savingsBookId: string;
    sourceAccountId: string;
    amount: number;
}

export interface DepositToSavingsBookOutput {
    success: boolean;
    message?: string;
    newBalance?: number;
    error?: string;
    errorType?: 'validation' | 'not_found' | 'unauthorized' | 'insufficient_funds' | 'server';
}

export class DepositToSavingsBookUseCase {
    constructor(
        private readonly savingsBookRepository: SavingsBookRepository,
        private readonly accountRepository: AccountRepository
    ) { }

    async execute(input: DepositToSavingsBookInput): Promise<DepositToSavingsBookOutput> {
        try {
            // Validate amount
            if (input.amount <= 0) {
                return {
                    success: false,
                    error: 'Deposit amount must be positive',
                    errorType: 'validation',
                };
            }

            // Find savings book
            const savingsBook = await this.savingsBookRepository.findById(input.savingsBookId);
            if (!savingsBook) {
                return {
                    success: false,
                    error: 'Savings book not found',
                    errorType: 'not_found',
                };
            }

            // Verify ownership
            if (savingsBook.getUserId() !== input.userId) {
                return {
                    success: false,
                    error: 'Unauthorized access to savings book',
                    errorType: 'unauthorized',
                };
            }

            // Find source account
            const sourceAccount = await this.accountRepository.findById(input.sourceAccountId);
            if (!sourceAccount) {
                return {
                    success: false,
                    error: 'Source account not found',
                    errorType: 'not_found',
                };
            }

            // Verify source account ownership
            if (sourceAccount.getUserId() !== input.userId) {
                return {
                    success: false,
                    error: 'Unauthorized access to source account',
                    errorType: 'unauthorized',
                };
            }

            // Check sufficient funds
            if (sourceAccount.getBalance() < input.amount) {
                return {
                    success: false,
                    error: 'Insufficient funds in source account',
                    errorType: 'insufficient_funds',
                };
            }

            // Withdraw from source account
            const withdrawResult = sourceAccount.withdraw(input.amount);
            if (withdrawResult.isFailure()) {
                return {
                    success: false,
                    error: withdrawResult.getError().message,
                    errorType: 'server',
                };
            }

            // Deposit to savings book
            const depositResult = savingsBook.deposit(input.amount);
            if (depositResult.isFailure()) {
                return {
                    success: false,
                    error: depositResult.getError().message,
                    errorType: 'server',
                };
            }

            // Save both
            await this.accountRepository.save(withdrawResult.getValue());
            await this.savingsBookRepository.save(depositResult.getValue());

            return {
                success: true,
                message: 'Deposit successful',
                newBalance: depositResult.getValue().getBalance(),
            };
        } catch (error) {
            return {
                success: false,
                error: (error as Error).message,
                errorType: 'server',
            };
        }
    }
}
