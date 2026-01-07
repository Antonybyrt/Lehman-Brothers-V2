import { SavingsBookRepository } from '../../repositories/SavingsBookRepository';
import { AccountRepository } from '../../repositories/AccountRepository';

export interface WithdrawFromSavingsBookInput {
    userId: string;
    savingsBookId: string;
    targetAccountId: string;
    amount: number;
}

export interface WithdrawFromSavingsBookOutput {
    success: boolean;
    message?: string;
    newBalance?: number;
    error?: string;
    errorType?: 'validation' | 'not_found' | 'unauthorized' | 'insufficient_funds' | 'server';
}

export class WithdrawFromSavingsBookUseCase {
    constructor(
        private readonly savingsBookRepository: SavingsBookRepository,
        private readonly accountRepository: AccountRepository
    ) { }

    async execute(input: WithdrawFromSavingsBookInput): Promise<WithdrawFromSavingsBookOutput> {
        try {
            // Validate amount
            if (input.amount <= 0) {
                return {
                    success: false,
                    error: 'Withdrawal amount must be positive',
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

            // Find target account
            const targetAccount = await this.accountRepository.findById(input.targetAccountId);
            if (!targetAccount) {
                return {
                    success: false,
                    error: 'Target account not found',
                    errorType: 'not_found',
                };
            }

            // Verify target account ownership
            if (targetAccount.getUserId() !== input.userId) {
                return {
                    success: false,
                    error: 'Unauthorized access to target account',
                    errorType: 'unauthorized',
                };
            }

            // Check sufficient funds in savings book
            if (savingsBook.getBalance() < input.amount) {
                return {
                    success: false,
                    error: 'Insufficient funds in savings book',
                    errorType: 'insufficient_funds',
                };
            }

            // Withdraw from savings book
            const withdrawResult = savingsBook.withdraw(input.amount);
            if (withdrawResult.isFailure()) {
                return {
                    success: false,
                    error: withdrawResult.getError().message,
                    errorType: 'server',
                };
            }

            // Deposit to target account
            const depositResult = targetAccount.deposit(input.amount);
            if (depositResult.isFailure()) {
                return {
                    success: false,
                    error: depositResult.getError().message,
                    errorType: 'server',
                };
            }

            // Save both
            await this.savingsBookRepository.save(withdrawResult.getValue());
            await this.accountRepository.save(depositResult.getValue());

            return {
                success: true,
                message: 'Withdrawal successful',
                newBalance: withdrawResult.getValue().getBalance(),
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
