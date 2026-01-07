import { Result } from '../values/Result';
import { SavingsBookType, SavingsBookTypeValue } from '../values/SavingsBookType';

export interface DailyInterestProps {
    readonly id: string;
    readonly savingsBookId: string;
    readonly amount: number;
    readonly rate: number;
    readonly appliedAt: Date;
}

export class DailyInterest {
    private constructor(private readonly props: DailyInterestProps) { }

    public static create(props: {
        savingsBookId: string;
        amount: number;
        rate: number;
    }): Result<DailyInterest, Error> {
        try {
            if (props.amount < 0) {
                return Result.failure(new Error('Interest amount cannot be negative'));
            }

            if (props.rate < 0) {
                return Result.failure(new Error('Interest rate cannot be negative'));
            }

            const interest = new DailyInterest({
                id: crypto.randomUUID(),
                savingsBookId: props.savingsBookId,
                amount: props.amount,
                rate: props.rate,
                appliedAt: new Date(),
            });

            return Result.success(interest);
        } catch (error) {
            return Result.failure(error as Error);
        }
    }

    public static fromPersistence(data: {
        id: string;
        savings_book_id: string;
        amount: string | number;
        rate: string | number;
        applied_at: Date | string;
    }): DailyInterest {
        return new DailyInterest({
            id: data.id,
            savingsBookId: data.savings_book_id,
            amount: typeof data.amount === 'string' ? parseFloat(data.amount) : data.amount,
            rate: typeof data.rate === 'string' ? parseFloat(data.rate) : data.rate,
            appliedAt: new Date(data.applied_at),
        });
    }

    public toPersistence() {
        return {
            id: this.props.id,
            savings_book_id: this.props.savingsBookId,
            amount: this.props.amount,
            rate: this.props.rate,
            applied_at: this.props.appliedAt,
        };
    }

    // Getters
    public getId(): string {
        return this.props.id;
    }

    public getSavingsBookId(): string {
        return this.props.savingsBookId;
    }

    public getAmount(): number {
        return this.props.amount;
    }

    public getRate(): number {
        return this.props.rate;
    }

    public getAppliedAt(): Date {
        return this.props.appliedAt;
    }
}
