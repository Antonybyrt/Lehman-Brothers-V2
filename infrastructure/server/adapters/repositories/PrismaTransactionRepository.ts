import { Transaction } from '@lehman-brothers/domain';
import { TransactionRepository } from '@lehman-brothers/application';
import { PrismaClient } from '@prisma/client';

export class PrismaTransactionRepository implements TransactionRepository {
  constructor(private readonly prisma: PrismaClient) {}

  async save(transaction: Transaction): Promise<void> {
    const transactionData = transaction.toPersistence();
    await this.prisma.transaction.create({
      data: {
        id: transactionData.id,
        source_account_id: transactionData.source_account_id || null,
        target_account_id: transactionData.target_account_id,
        amount: transactionData.amount,
        type: transactionData.type,
        created_at: transactionData.created_at,
      },
    });
  }

  async findByAccountId(accountId: string): Promise<Transaction[]> {
    const data = await this.prisma.transaction.findMany({
      where: {
        OR: [
          { source_account_id: accountId },
          { target_account_id: accountId },
        ],
      },
      orderBy: { created_at: 'desc' },
    });
    return data.map(Transaction.fromPersistence);
  }

  async findByUserId(userId: string): Promise<Transaction[]> {
    const data = await this.prisma.transaction.findMany({
      where: {
        OR: [
          {
            source_account: {
              user_id: userId,
            },
          },
          {
            target_account: {
              user_id: userId,
            },
          },
        ],
      },
      orderBy: { created_at: 'desc' },
    });
    return data.map(Transaction.fromPersistence);
  }
}
