import { Transaction } from '@lehman-brothers/domain';
import { TransactionRepository, TransferData } from '@lehman-brothers/application';
import { PrismaClient, TransactionType } from '@prisma/client';

export class PrismaTransactionRepository implements TransactionRepository {
  constructor(private readonly prisma: PrismaClient) {}

  async save(transaction: Transaction): Promise<void> {
    const transactionData = transaction.toPersistence();
    await this.prisma.transaction.create({
      data: {
        id: transactionData.id,
        source_account_id: transactionData.source_account_id || null,
        target_account_id: transactionData.target_account_id || null,
        target_iban: transactionData.target_iban || null,
        amount: transactionData.amount,
        description: transactionData.description || null,
        type: transactionData.type as TransactionType,
        created_at: transactionData.created_at,
      },
    });
  }

  async executeAtomicTransfer(data: TransferData): Promise<void> {
    const { sourceAccount, targetAccount, transaction } = data;
    const transactionData = transaction.toPersistence();
    const sourceAccountData = sourceAccount.toPersistence();

    await this.prisma.$transaction(async (tx) => {
      // Update source account balance
      await tx.account.update({
        where: { id: sourceAccountData.id },
        data: { balance: sourceAccountData.balance },
      });

      // Update target account balance (only for internal transfers)
      if (targetAccount) {
        const targetAccountData = targetAccount.toPersistence();
        await tx.account.update({
          where: { id: targetAccountData.id },
          data: { balance: targetAccountData.balance },
        });
      }

      // Create transaction record
      await tx.transaction.create({
        data: {
          id: transactionData.id,
          source_account_id: transactionData.source_account_id || null,
          target_account_id: transactionData.target_account_id || null,
          target_iban: transactionData.target_iban || null,
          amount: transactionData.amount,
          description: transactionData.description || null,
          type: transactionData.type as TransactionType,
          created_at: transactionData.created_at,
        },
      });
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
