import { InvalidAccountTypeError } from '../errors';

export enum AccountType {
  CURRENT = 'CURRENT',
  SAVINGS = 'SAVINGS',
  INVESTMENT = 'INVESTMENT'
}

export class AccountTypeValue {
  private readonly value: AccountType;

  private constructor(value: AccountType) {
    this.value = value;
  }

  public static create(type: string): AccountTypeValue {
    const validTypes = Object.values(AccountType);
    if (!validTypes.includes(type as AccountType)) {
      throw new InvalidAccountTypeError(type, validTypes);
    }
    return new AccountTypeValue(type as AccountType);
  }

  public getValue(): AccountType {
    return this.value;
  }

  public equals(other: AccountTypeValue): boolean {
    return this.value === other.value;
  }

  public toString(): string {
    return this.value;
  }
}
