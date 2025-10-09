import { Result } from '../values';

export interface EmailConfirmationProps {
  id: string;
  userId: string;
  token: string;
  expiresAt: Date;
  confirmed: boolean;
  createdAt: Date;
}

export class EmailConfirmation {
  private constructor(private readonly props: EmailConfirmationProps) {}

  public static create(userId: string): EmailConfirmation {
    return new EmailConfirmation({
      id: crypto.randomUUID(),
      userId,
      token: crypto.randomUUID(),
      expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000), // 24h
      confirmed: false,
      createdAt: new Date(),
    });
  }

  public static fromPersistence(props: EmailConfirmationProps): EmailConfirmation {
    return new EmailConfirmation(props);
  }

  // Getters
  public getId(): string {
    return this.props.id;
  }

  public getUserId(): string {
    return this.props.userId;
  }

  public getToken(): string {
    return this.props.token;
  }

  public getExpiresAt(): Date {
    return this.props.expiresAt;
  }

  public isConfirmed(): boolean {
    return this.props.confirmed;
  }

  public getCreatedAt(): Date {
    return this.props.createdAt;
  }

  // Business methods
  public isExpired(): boolean {
    return new Date() > this.props.expiresAt;
  }

  public confirm(): EmailConfirmation {
    return new EmailConfirmation({
      ...this.props,
      confirmed: true,
    });
  }

  public toPersistence(): any {
    return {
      id: this.props.id,
      user_id: this.props.userId,
      token: this.props.token,
      expires_at: this.props.expiresAt,
      confirmed: this.props.confirmed,
      created_at: this.props.createdAt,
    };
  }
}
