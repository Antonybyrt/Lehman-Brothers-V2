import { Result } from './Result';

export class StockSymbol {
  private constructor(private readonly value: string) { }

  public static create(value: string): Result<StockSymbol, Error> {
    if (!value || value.trim().length === 0) {
      return Result.failure(new Error('Stock symbol cannot be empty'));
    }
    const upperValue = value.trim().toUpperCase();
    if (!/^[A-Z0-9]{1,10}$/.test(upperValue)) {
      return Result.failure(new Error('Invalid stock symbol format'));
    }
    return Result.success(new StockSymbol(upperValue));
  }

  public getValue(): string {
    return this.value;
  }

  public equals(other: StockSymbol): boolean {
    return this.value === other.value;
  }
}
