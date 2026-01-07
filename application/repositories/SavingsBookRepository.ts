import { SavingsBook } from '@lehman-brothers/domain';
import { SavingsBookType } from '@lehman-brothers/domain';

export interface SavingsBookRepository {
    findById(id: string): Promise<SavingsBook | null>;
    findByUserId(userId: string): Promise<SavingsBook[]>;
    findByIban(iban: string): Promise<SavingsBook | null>;
    findAllWithPositiveBalance(): Promise<SavingsBook[]>;
    findByType(type: SavingsBookType): Promise<SavingsBook[]>;
    save(savingsBook: SavingsBook): Promise<void>;
    delete(id: string): Promise<void>;
}
