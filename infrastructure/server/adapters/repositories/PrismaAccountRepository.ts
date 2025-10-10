import { Account } from '@lehman-brothers/domain';
import { AccountRepository } from '@lehman-brothers/application';
import { PrismaClient } from '@prisma/client';
import { Iban } from '@lehman-brothers/domain';

export class PrismaAccountRepository implements AccountRepository {
  constructor(private readonly prisma: PrismaClient) {}

  async save(account: Account): Promise<void> {
    const accountData = account.toPersistence();

    await this.prisma.account.upsert({
      where: { id: accountData.id },
      update: {
        user_id: accountData.user_id,
        iban: accountData.iban,
        name: accountData.name,
        balance: accountData.balance,
        is_savings: accountData.is_savings,
      },
      create: {
        id: accountData.id,
        user_id: accountData.user_id,
        iban: accountData.iban,
        name: accountData.name,
        balance: accountData.balance,
        is_savings: accountData.is_savings,
        created_at: accountData.created_at,
      },
    });
  }

  async findById(id: string): Promise<Account | null> {
    const data = await this.prisma.account.findUnique({
      where: { id },
    });
    return data ? Account.fromPersistence(data) : null;
  }

  async findByIban(iban: string): Promise<Account | null> {
    const data = await this.prisma.account.findUnique({
      where: { iban },
    });
    return data ? Account.fromPersistence(data) : null;
  }

  async findByUserId(userId: string): Promise<Account[]> {
    const data = await this.prisma.account.findMany({
      where: { user_id: userId },
      orderBy: { created_at: 'desc' },
    });
    return data.map(item => Account.fromPersistence(item));
  }

  async delete(id: string): Promise<void> {
    await this.prisma.account.delete({
      where: { id },
    });
  }

  async existsByIban(iban: string): Promise<boolean> {
    const count = await this.prisma.account.count({
      where: { iban },
    });
    return count > 0;
  }
}
