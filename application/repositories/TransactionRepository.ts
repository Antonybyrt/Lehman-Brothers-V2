import { Transaction } from '../../domain/entities/Transaction';

export interface TransactionRepository {
  save(transaction: Transaction): Promise<void>;
  findByAccountId(accountId: string): Promise<Transaction[]>;
  findByUserId(userId: string): Promise<Transaction[]>;
}
