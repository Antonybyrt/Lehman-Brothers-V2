import { Iban } from '../values/Iban';
import { Result } from '../values/Result';
import { SavingsBookType, SavingsBookTypeValue } from '../values/SavingsBookType';

export interface SavingsBookProps {
    readonly id: string;
    readonly userId: string;
    readonly iban: Iban;
    readonly name: string;
    readonly balance: number;
    readonly type: SavingsBookTypeValue;
    readonly createdAt: Date;
}

export class SavingsBook {
    private constructor(private readonly props: SavingsBookProps) { }

    public static create(props: {
        userId: string;
        name: string;
        type: SavingsBookType;
        initialBalance?: number;
    }): Result<SavingsBook, Error> {
        try {
            const iban = Iban.generate();
            const typeValue = SavingsBookTypeValue.fromEnum(props.type);

            const savingsBook = new SavingsBook({
                id: crypto.randomUUID(),
                userId: props.userId,
                iban,
                name: props.name,
                balance: props.initialBalance || 0,
                type: typeValue,
                createdAt: new Date(),
            });

            return Result.success(savingsBook);
        } catch (error) {
            return Result.failure(error as Error);
        }
    }

    public static fromPersistence(data: {
        id: string;
        user_id: string;
        iban: string;
        name: string;
        balance: string | number;
        type: string;
        created_at: Date | string;
    }): SavingsBook {
        return new SavingsBook({
            id: data.id,
            userId: data.user_id,
            iban: Iban.create(data.iban),
            name: data.name,
            balance: typeof data.balance === 'string' ? parseFloat(data.balance) : data.balance,
            type: SavingsBookTypeValue.create(data.type),
            createdAt: new Date(data.created_at),
        });
    }

    public toPersistence() {
        return {
            id: this.props.id,
            user_id: this.props.userId,
            iban: this.props.iban.getValue(),
            name: this.props.name,
            balance: this.props.balance,
            type: this.props.type.getValue(),
            created_at: this.props.createdAt,
        };
    }

    // Getters
    public getId(): string {
        return this.props.id;
    }

    public getUserId(): string {
        return this.props.userId;
    }

    public getIban(): Iban {
        return this.props.iban;
    }

    public getName(): string {
        return this.props.name;
    }

    public getBalance(): number {
        return this.props.balance;
    }

    public getType(): SavingsBookTypeValue {
        return this.props.type;
    }

    public getCreatedAt(): Date {
        return this.props.createdAt;
    }

    // Business methods
    public deposit(amount: number): Result<SavingsBook, Error> {
        if (amount <= 0) {
            return Result.failure(new Error('Deposit amount must be positive'));
        }

        const updatedBook = new SavingsBook({
            ...this.props,
            balance: this.props.balance + amount,
        });

        return Result.success(updatedBook);
    }

    public withdraw(amount: number): Result<SavingsBook, Error> {
        if (amount <= 0) {
            return Result.failure(new Error('Withdrawal amount must be positive'));
        }

        if (amount > this.props.balance) {
            return Result.failure(new Error('Insufficient funds'));
        }

        const updatedBook = new SavingsBook({
            ...this.props,
            balance: this.props.balance - amount,
        });

        return Result.success(updatedBook);
    }

    /**
     * Apply daily interest to the savings book
     * @param dailyRate The daily interest rate (e.g., 0.0001 for 0.01% daily)
     */
    public applyInterest(dailyRate: number): Result<{ book: SavingsBook; interestAmount: number }, Error> {
        if (dailyRate < 0) {
            return Result.failure(new Error('Interest rate cannot be negative'));
        }

        if (this.props.balance <= 0) {
            return Result.success({ book: this, interestAmount: 0 });
        }

        const interestAmount = this.props.balance * dailyRate;
        const roundedInterest = Math.round(interestAmount * 10000) / 10000; // Round to 4 decimals

        const updatedBook = new SavingsBook({
            ...this.props,
            balance: this.props.balance + roundedInterest,
        });

        return Result.success({ book: updatedBook, interestAmount: roundedInterest });
    }

    public rename(newName: string): Result<SavingsBook, Error> {
        if (!newName || newName.trim().length === 0) {
            return Result.failure(new Error('Savings book name cannot be empty'));
        }

        const updatedBook = new SavingsBook({
            ...this.props,
            name: newName.trim(),
        });

        return Result.success(updatedBook);
    }

    public updateBalance(newBalance: number): Result<SavingsBook, Error> {
        if (newBalance < 0) {
            return Result.failure(new Error('Balance cannot be negative'));
        }

        const updatedBook = new SavingsBook({
            ...this.props,
            balance: newBalance,
        });

        return Result.success(updatedBook);
    }
}
