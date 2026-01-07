import { DailyInterest } from '@lehman-brothers/domain';

export interface DailyInterestRepository {
    findBySavingsBookId(savingsBookId: string, limit?: number): Promise<DailyInterest[]>;
    findByDate(date: Date): Promise<DailyInterest[]>;
    save(interest: DailyInterest): Promise<void>;
    saveMany(interests: DailyInterest[]): Promise<void>;
}
