import { Transaction } from '../../domain/entities/Transaction';
import { Account } from '../../domain/entities/Account';

export interface TransferData {
  sourceAccount: Account;
  targetAccount?: Account; // Optional for external transfers
  transaction: Transaction;
}

export interface TransactionRepository {
  save(transaction: Transaction): Promise<void>;
  findByAccountId(accountId: string): Promise<Transaction[]>;
  findByUserId(userId: string): Promise<Transaction[]>;
  
  /**
   * Executes a transfer atomically - updates accounts and creates transaction in a single DB transaction
   */
  executeAtomicTransfer(data: TransferData): Promise<void>;
}
