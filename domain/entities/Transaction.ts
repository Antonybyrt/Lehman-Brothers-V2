import { Result } from '../values/Result';

export interface TransactionProps {
  id: string;
  sourceAccountId: string | undefined; // Optional for deleted accounts
  targetAccountId: string | undefined; // Optional for external transfers
  targetIban: string | undefined; // For external transfers (IBAN outside our platform)
  amount: number;
  description: string | undefined; // Optional description for the transaction
  type: 'DEBIT' | 'CREDIT' | 'TRANSFER';
  createdAt: Date;
}

export class Transaction {
  private constructor(private readonly props: TransactionProps) {}

  public static create(props: {
    sourceAccountId: string | undefined;
    targetAccountId: string | undefined;
    targetIban?: string | undefined;
    amount: number;
    description?: string | undefined;
    type: 'DEBIT' | 'CREDIT' | 'TRANSFER';
  }): Result<Transaction, Error> {
    if (props.amount <= 0) {
      return Result.failure(new Error('Transaction amount must be positive'));
    }

    // For TRANSFER type, we need either targetAccountId (internal) or targetIban (external)
    if (props.type === 'TRANSFER' && !props.targetAccountId && !props.targetIban) {
      return Result.failure(new Error('Transfer requires either a target account ID or target IBAN'));
    }

    // For DEBIT/CREDIT, targetAccountId is required
    if ((props.type === 'DEBIT' || props.type === 'CREDIT') && !props.targetAccountId) {
      return Result.failure(new Error('Target account ID is required for DEBIT/CREDIT transactions'));
    }


    try {
      const transaction = new Transaction({
        id: crypto.randomUUID(),
        sourceAccountId: props.sourceAccountId,
        targetAccountId: props.targetAccountId,
        targetIban: props.targetIban,
        amount: props.amount,
        description: props.description,
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
      target_iban: this.props.targetIban,
      amount: this.props.amount,
      description: this.props.description,
      type: this.props.type,
      created_at: this.props.createdAt,
    };
  }

  public static fromPersistence(data: any): Transaction {
    return new Transaction({
      id: data.id,
      sourceAccountId: data.source_account_id,
      targetAccountId: data.target_account_id,
      targetIban: data.target_iban,
      amount: parseFloat(data.amount),
      description: data.description,
      type: data.type,
      createdAt: data.created_at,
    });
  }

  public getId(): string { return this.props.id; }
  public getSourceAccountId(): string | undefined { return this.props.sourceAccountId; }
  public getTargetAccountId(): string | undefined { return this.props.targetAccountId; }
  public getTargetIban(): string | undefined { return this.props.targetIban; }
  public getAmount(): number { return this.props.amount; }
  public getDescription(): string | undefined { return this.props.description; }
  public getType(): 'DEBIT' | 'CREDIT' | 'TRANSFER' { return this.props.type; }
  public getCreatedAt(): Date { return this.props.createdAt; }
}
