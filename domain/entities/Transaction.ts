import { Result } from '../values/Result';

export interface TransactionProps {
  id: string;
  sourceAccountId: string | undefined; // Optional for deleted accounts
  targetAccountId: string;
  amount: number;
  type: 'DEBIT' | 'CREDIT';
  createdAt: Date;
}

export class Transaction {
  private constructor(private readonly props: TransactionProps) {}

  public static create(props: {
    sourceAccountId: string | undefined;
    targetAccountId: string;
    amount: number;
    type: 'DEBIT' | 'CREDIT';
  }): Result<Transaction, Error> {
    if (props.amount <= 0) {
      return Result.failure(new Error('Transaction amount must be positive'));
    }

    if (!props.targetAccountId) {
      return Result.failure(new Error('Target account ID is required'));
    }


    try {
      const transaction = new Transaction({
        id: crypto.randomUUID(),
        sourceAccountId: props.sourceAccountId,
        targetAccountId: props.targetAccountId,
        amount: props.amount,
        type: props.type,
        createdAt: new Date(),
      });
      return Result.success(transaction);
    } catch (error) {
      return Result.failure(error as Error);
    }
  }

  public toPersistence() {
    return {
      id: this.props.id,
      source_account_id: this.props.sourceAccountId,
      target_account_id: this.props.targetAccountId,
      amount: this.props.amount,
      type: this.props.type,
      created_at: this.props.createdAt,
    };
  }

  public static fromPersistence(data: any): Transaction {
    return new Transaction({
      id: data.id,
      sourceAccountId: data.source_account_id,
      targetAccountId: data.target_account_id,
      amount: parseFloat(data.amount),
      type: data.type,
      createdAt: data.created_at,
    });
  }

  public getId(): string { return this.props.id; }
  public getSourceAccountId(): string | undefined { return this.props.sourceAccountId; }
  public getTargetAccountId(): string { return this.props.targetAccountId; }
  public getAmount(): number { return this.props.amount; }
  public getType(): 'DEBIT' | 'CREDIT' { return this.props.type; }
  public getCreatedAt(): Date { return this.props.createdAt; }
}
