import { Iban } from '../values/Iban';
import { Result } from '../values/Result';

export interface AccountProps {
  readonly id: string;
  readonly userId: string;
  readonly iban: Iban;
  readonly name: string;
  readonly balance: number;
  readonly isSavings: boolean;
  readonly createdAt: Date;
}

export class Account {
  private constructor(private readonly props: AccountProps) {}

  public static create(props: {
    userId: string;
    name: string;
    isSavings?: boolean;
    initialBalance?: number;
  }): Result<Account, Error> {
    try {
      const iban = Iban.generate();
      
      const account = new Account({
        id: crypto.randomUUID(),
        userId: props.userId,
        iban,
        name: props.name,
        balance: props.initialBalance || 0,
        isSavings: props.isSavings || false,
        createdAt: new Date(),
      });

      return Result.success(account);
    } catch (error) {
      return Result.failure(error as Error);
    }
  }

  public static fromPersistence(data: any): Account {
    return new Account({
      id: data.id,
      userId: data.user_id,
      iban: Iban.create(data.iban),
      name: data.name,
      balance: parseFloat(data.balance),
      isSavings: data.is_savings,
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
      is_savings: this.props.isSavings,
      created_at: this.props.createdAt,
    };
  }

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

  public isSavingsAccount(): boolean {
    return this.props.isSavings;
  }

  public getCreatedAt(): Date {
    return this.props.createdAt;
  }

  public deposit(amount: number): Result<Account, Error> {
    if (amount <= 0) {
      return Result.failure(new Error('Deposit amount must be positive'));
    }

    const updatedAccount = new Account({
      ...this.props,
      balance: this.props.balance + amount,
    });

    return Result.success(updatedAccount);
  }

  public withdraw(amount: number): Result<Account, Error> {
    if (amount <= 0) {
      return Result.failure(new Error('Withdrawal amount must be positive'));
    }

    if (amount > this.props.balance) {
      return Result.failure(new Error('Insufficient funds'));
    }

    const updatedAccount = new Account({
      ...this.props,
      balance: this.props.balance - amount,
    });

    return Result.success(updatedAccount);
  }

  public transferTo(targetAccount: Account, amount: number): Result<{ sourceAccount: Account; targetAccount: Account }, Error> {
    const withdrawResult = this.withdraw(amount);
    if (withdrawResult.isFailure()) {
      return Result.failure(withdrawResult.getError());
    }

    const depositResult = targetAccount.deposit(amount);
    if (depositResult.isFailure()) {
      return Result.failure(depositResult.getError());
    }

    return Result.success({
      sourceAccount: withdrawResult.getValue(),
      targetAccount: depositResult.getValue(),
    });
  }

  public updateBalance(newBalance: number): Result<Account, Error> {
    if (newBalance < 0) {
      return Result.failure(new Error('Account balance cannot be negative'));
    }

    const updatedAccount = new Account({
      ...this.props,
      balance: newBalance,
    });

    return Result.success(updatedAccount);
  }

  public rename(newName: string): Result<Account, Error> {
    if (!newName || newName.trim().length === 0) {
      return Result.failure(new Error('Account name cannot be empty'));
    }

    const updatedAccount = new Account({
      ...this.props,
      name: newName.trim(),
    });

    return Result.success(updatedAccount);
  }
}
