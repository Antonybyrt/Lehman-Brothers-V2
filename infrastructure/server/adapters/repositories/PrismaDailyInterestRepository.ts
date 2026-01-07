import { PrismaClient } from '@prisma/client';
import { DailyInterest } from '@lehman-brothers/domain';
import { DailyInterestRepository } from '@lehman-brothers/application';
import { Decimal } from '@prisma/client/runtime/library';

// Helper to convert Prisma Decimal to number
function toDomainRecord(record: { id: string; savings_book_id: string; amount: Decimal; rate: Decimal; applied_at: Date }) {
    return {
        id: record.id,
        savings_book_id: record.savings_book_id,
        amount: record.amount.toNumber(),
        rate: record.rate.toNumber(),
        applied_at: record.applied_at,
    };
}

export class PrismaDailyInterestRepository implements DailyInterestRepository {
    constructor(private readonly prisma: PrismaClient) { }

    async findBySavingsBookId(savingsBookId: string, limit = 30): Promise<DailyInterest[]> {
        const records = await this.prisma.dailyInterest.findMany({
            where: { savings_book_id: savingsBookId },
            orderBy: { applied_at: 'desc' },
            take: limit,
        });

        return records.map((record) => DailyInterest.fromPersistence(toDomainRecord(record)));
    }

    async findByDate(date: Date): Promise<DailyInterest[]> {
        const startOfDay = new Date(date);
        startOfDay.setHours(0, 0, 0, 0);

        const endOfDay = new Date(date);
        endOfDay.setHours(23, 59, 59, 999);

        const records = await this.prisma.dailyInterest.findMany({
            where: {
                applied_at: {
                    gte: startOfDay,
                    lte: endOfDay,
                },
            },
            orderBy: { applied_at: 'desc' },
        });

        return records.map((record) => DailyInterest.fromPersistence(toDomainRecord(record)));
    }

    async save(interest: DailyInterest): Promise<void> {
        const data = interest.toPersistence();

        await this.prisma.dailyInterest.create({
            data: {
                id: data.id,
                savings_book_id: data.savings_book_id,
                amount: data.amount,
                rate: data.rate,
                applied_at: data.applied_at,
            },
        });
    }

    async saveMany(interests: DailyInterest[]): Promise<void> {
        if (interests.length === 0) return;

        const data = interests.map((interest) => {
            const persisted = interest.toPersistence();
            return {
                id: persisted.id,
                savings_book_id: persisted.savings_book_id,
                amount: persisted.amount,
                rate: persisted.rate,
                applied_at: persisted.applied_at,
            };
        });

        await this.prisma.dailyInterest.createMany({ data });
    }
}
