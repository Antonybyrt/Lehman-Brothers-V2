import { Result } from './Result';

export class Quantity {
  private constructor(private readonly value: number) { }

  public static create(value: number): Result<Quantity, Error> {
    if (!Number.isInteger(value)) {
      return Result.failure(new Error('Quantity must be an integer'));
    }
    if (value <= 0) {
      return Result.failure(new Error('Quantity must be positive'));
    }
    return Result.success(new Quantity(value));
  }

  public getValue(): number {
    return this.value;
  }

  public add(other: Quantity): Quantity {
    return new Quantity(this.value + other.value);
  }

  public subtract(other: Quantity): Result<Quantity, Error> {
    const newValue = this.value - other.value;
    if (newValue < 0) {
      return Result.failure(new Error('Resulting quantity cannot be negative'));
    }
    // Assuming 0 quantity is allowed in calculation results (e.g. selling all shares), 
    // but if we want to enforce positive Quantity object, we might need to handle 0 differently or return a special case.
    // For now let's allow 0 if we were to relax the constraint in constructor or handle it here.
    // Actually, if result is 0, it means no shares left. 
    // Let's stick to the constructor rule: Quantity must be positive. 
    // So if result is 0, it's not a valid "Quantity" object in the sense of "holding something", 
    // but for arithmetic it might be needed. 
    // Let's return Result<Quantity, Error> and error if 0? 
    // Or maybe Quantity should allow 0? 
    // The requirement said "Quantity" for orders/portfolio. 0 usually means entry removed.

    if (newValue === 0) {
      return Result.failure(new Error('Quantity becomes zero'));
    }

    return Result.success(new Quantity(newValue));
  }
}
