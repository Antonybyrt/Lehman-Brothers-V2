import { SavingsBookType } from '@lehman-brothers/domain';

export interface SavingsRate {
    id: string;
    rate: number;
    bookType: SavingsBookType;
    effectiveDate: Date;
    updatedBy: string;
    createdAt: Date;
}

export interface SavingsRateRepository {
    getCurrentRate(type: SavingsBookType): Promise<SavingsRate | null>;
    getRateHistory(type: SavingsBookType, limit?: number): Promise<SavingsRate[]>;
    getAllCurrentRates(): Promise<SavingsRate[]>;
    save(rate: SavingsRate): Promise<void>;
}
