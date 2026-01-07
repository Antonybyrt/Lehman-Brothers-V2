import { TransactionRepository } from '../../repositories';
import { AccountRepository } from '../../repositories';
import { exhaustive } from 'exhaustive';

export interface GetUserTransactionsRequest {
    readonly userId: string;
    readonly limit?: number;
}

export interface TransactionDTO {
    readonly id: string;
    readonly sourceAccountId?: string | undefined;
    readonly sourceAccountName?: string | undefined;
    readonly targetAccountId?: string | undefined;
    readonly targetAccountName?: string | undefined;
    readonly targetIban?: string | undefined;
    readonly amount: number;
    readonly description?: string | undefined;
    readonly type: 'TRANSFER' | 'DEPOSIT' | 'WITHDRAWAL' | 'INTEREST';
    readonly createdAt: string;
}

export interface GetUserTransactionsResponse {
    readonly success: boolean;
    readonly transactions?: TransactionDTO[];
    readonly error?: string;
    readonly errorType?: 'validation' | 'not_found' | 'server';
}

export class GetUserTransactionsUseCase {
    constructor(
        private readonly transactionRepository: TransactionRepository,
        private readonly accountRepository: AccountRepository
    ) { }

    public async execute(request: GetUserTransactionsRequest): Promise<GetUserTransactionsResponse> {
        if (!this.isValidRequest(request)) {
            return {
                success: false,
                error: 'User ID is required',
                errorType: 'validation'
            };
        }

        try {
            const transactions = await this.transactionRepository.findByUserId(request.userId);

            // Get account names for better display
            const accounts = await this.accountRepository.findByUserId(request.userId);
            const accountMap = new Map(accounts.map(acc => [acc.getId(), acc.getName()]));

            const limit = request.limit || 50;
            const limitedTransactions = transactions.slice(0, limit);

            const transactionDTOs: TransactionDTO[] = limitedTransactions.map(tx => ({
                id: tx.getId(),
                sourceAccountId: tx.getSourceAccountId(),
                sourceAccountName: tx.getSourceAccountId() ? accountMap.get(tx.getSourceAccountId()!) : undefined,
                targetAccountId: tx.getTargetAccountId(),
                targetAccountName: tx.getTargetAccountId() ? accountMap.get(tx.getTargetAccountId()!) : undefined,
                targetIban: tx.getTargetIban(),
                amount: tx.getAmount(),
                description: tx.getDescription(),
                type: tx.getType() as 'TRANSFER' | 'DEPOSIT' | 'WITHDRAWAL' | 'INTEREST',
                createdAt: tx.getCreatedAt().toISOString()
            }));

            return {
                success: true,
                transactions: transactionDTOs
            };
        } catch (error) {
            return {
                success: false,
                error: error instanceof Error ? error.message : 'Unknown error occurred',
                errorType: 'server'
            };
        }
    }

    private isValidRequest(request: GetUserTransactionsRequest): boolean {
        return exhaustive(String(!!request.userId), {
            'true': () => true,
            'false': () => false
        });
    }
}
