import { PrismaClient, SavingsBookType as PrismaSavingsBookType } from '@prisma/client';
import { SavingsBook, SavingsBookType } from '@lehman-brothers/domain';
import { SavingsBookRepository } from '@lehman-brothers/application';
import { Decimal } from '@prisma/client/runtime/library';

// Helper to convert Prisma Decimal to number
function toDomainRecord(record: { id: string; user_id: string; iban: string; name: string; balance: Decimal; type: PrismaSavingsBookType; created_at: Date }) {
    return {
        id: record.id,
        user_id: record.user_id,
        iban: record.iban,
        name: record.name,
        balance: record.balance.toNumber(),
        type: record.type as string,
        created_at: record.created_at,
    };
}

export class PrismaSavingsBookRepository implements SavingsBookRepository {
    constructor(private readonly prisma: PrismaClient) { }

    async findById(id: string): Promise<SavingsBook | null> {
        const record = await this.prisma.savingsBook.findUnique({
            where: { id },
        });

        if (!record) return null;
        return SavingsBook.fromPersistence(toDomainRecord(record));
    }

    async findByUserId(userId: string): Promise<SavingsBook[]> {
        const records = await this.prisma.savingsBook.findMany({
            where: { user_id: userId },
            orderBy: { created_at: 'desc' },
        });

        return records.map((record) => SavingsBook.fromPersistence(toDomainRecord(record)));
    }

    async findByIban(iban: string): Promise<SavingsBook | null> {
        const record = await this.prisma.savingsBook.findUnique({
            where: { iban },
        });

        if (!record) return null;
        return SavingsBook.fromPersistence(toDomainRecord(record));
    }

    async findAllWithPositiveBalance(): Promise<SavingsBook[]> {
        const records = await this.prisma.savingsBook.findMany({
            where: {
                balance: { gt: 0 },
            },
        });

        return records.map((record) => SavingsBook.fromPersistence(toDomainRecord(record)));
    }

    async findByType(type: SavingsBookType): Promise<SavingsBook[]> {
        const records = await this.prisma.savingsBook.findMany({
            where: { type: type as PrismaSavingsBookType },
            orderBy: { created_at: 'desc' },
        });

        return records.map((record) => SavingsBook.fromPersistence(toDomainRecord(record)));
    }

    async save(savingsBook: SavingsBook): Promise<void> {
        const data = savingsBook.toPersistence();

        await this.prisma.savingsBook.upsert({
            where: { id: data.id },
            update: {
                name: data.name,
                balance: data.balance,
            },
            create: {
                id: data.id,
                user_id: data.user_id,
                iban: data.iban,
                name: data.name,
                balance: data.balance,
                type: data.type as PrismaSavingsBookType,
                created_at: data.created_at,
            },
        });
    }

    async delete(id: string): Promise<void> {
        await this.prisma.savingsBook.delete({
            where: { id },
        });
    }
}
