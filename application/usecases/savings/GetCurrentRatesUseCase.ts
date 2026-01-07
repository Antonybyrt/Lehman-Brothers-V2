import { SavingsRateRepository, SavingsRate } from '../../repositories/SavingsRateRepository';

export interface GetCurrentRatesOutput {
    success: boolean;
    rates?: {
        bookType: string;
        rate: number;
        ratePercent: string;
        effectiveDate: string;
        dailyRate: number;
    }[];
    error?: string;
    errorType?: 'server';
}

export class GetCurrentRatesUseCase {
    constructor(private readonly savingsRateRepository: SavingsRateRepository) { }

    async execute(): Promise<GetCurrentRatesOutput> {
        try {
            const rates = await this.savingsRateRepository.getAllCurrentRates();

            return {
                success: true,
                rates: rates.map((rate) => ({
                    bookType: rate.bookType,
                    rate: rate.rate,
                    ratePercent: `${(rate.rate * 100).toFixed(2)}%`,
                    effectiveDate: rate.effectiveDate.toISOString(),
                    dailyRate: rate.rate / 365, // Convert annual rate to daily
                })),
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
