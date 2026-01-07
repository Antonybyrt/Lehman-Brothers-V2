import { Result } from './Result';

export class Money {
  private constructor(private readonly amountInCents: number) { }

  public static create(amountInCents: number): Result<Money, Error> {
    if (!Number.isInteger(amountInCents)) {
      return Result.failure(new Error('Money amount must be an integer (cents)'));
    }
    return Result.success(new Money(amountInCents));
  }

  public static fromEuro(amount: number): Result<Money, Error> {
    const cents = Math.round(amount * 100);
    return Money.create(cents);
  }

  public getAmountInCents(): number {
    return this.amountInCents;
  }

  public getAmountInEuro(): number {
    return this.amountInCents / 100;
  }

  public add(other: Money): Money {
    return new Money(this.amountInCents + other.amountInCents);
  }

  public subtract(other: Money): Money {
    return new Money(this.amountInCents - other.amountInCents);
  }

  public multiply(factor: number): Money {
    return new Money(Math.round(this.amountInCents * factor));
  }

  public isGreaterThanOrEqual(other: Money): boolean {
    return this.amountInCents >= other.amountInCents;
  }

  public isLessThan(other: Money): boolean {
    return this.amountInCents < other.amountInCents;
  }

  public equals(other: Money): boolean {
    return this.amountInCents === other.amountInCents;
  }
}
