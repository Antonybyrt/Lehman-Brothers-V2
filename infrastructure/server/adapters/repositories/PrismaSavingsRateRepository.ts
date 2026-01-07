import { PrismaClient, SavingsBookType as PrismaSavingsBookType } from '@prisma/client';
import { SavingsBookType } from '@lehman-brothers/domain';
import { SavingsRateRepository, SavingsRate } from '@lehman-brothers/application';

export class PrismaSavingsRateRepository implements SavingsRateRepository {
    constructor(private readonly prisma: PrismaClient) { }

    async getCurrentRate(type: SavingsBookType): Promise<SavingsRate | null> {
        const record = await this.prisma.savingsRate.findFirst({
            where: {
                book_type: type as PrismaSavingsBookType,
                effective_date: { lte: new Date() },
            },
            orderBy: { effective_date: 'desc' },
        });

        if (!record) return null;

        return {
            id: record.id,
            rate: Number(record.rate),
            bookType: record.book_type as SavingsBookType,
            effectiveDate: record.effective_date,
            updatedBy: record.updated_by,
            createdAt: record.created_at,
        };
    }

    async getRateHistory(type: SavingsBookType, limit = 10): Promise<SavingsRate[]> {
        const records = await this.prisma.savingsRate.findMany({
            where: { book_type: type as PrismaSavingsBookType },
            orderBy: { effective_date: 'desc' },
            take: limit,
        });

        return records.map((record) => ({
            id: record.id,
            rate: Number(record.rate),
            bookType: record.book_type as SavingsBookType,
            effectiveDate: record.effective_date,
            updatedBy: record.updated_by,
            createdAt: record.created_at,
        }));
    }

    async getAllCurrentRates(): Promise<SavingsRate[]> {
        const rates: SavingsRate[] = [];

        for (const type of Object.values(SavingsBookType)) {
            const rate = await this.getCurrentRate(type);
            if (rate) {
                rates.push(rate);
            }
        }

        return rates;
    }

    async save(rate: SavingsRate): Promise<void> {
        await this.prisma.savingsRate.create({
            data: {
                id: rate.id,
                rate: rate.rate,
                book_type: rate.bookType as PrismaSavingsBookType,
                effective_date: rate.effectiveDate,
                updated_by: rate.updatedBy,
                created_at: rate.createdAt,
            },
        });
    }
}
