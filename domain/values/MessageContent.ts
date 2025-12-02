import { InvalidMessageContentError } from '../errors';
import { Result } from './Result';

export class MessageContent {
  private readonly value: string;

  private constructor(content: string) {
    this.value = content;
  }

  public static create(content: string): Result<MessageContent, Error> {
    const trimmed = content.trim();

    if (!trimmed || trimmed.length === 0) {
      return Result.failure(new InvalidMessageContentError());
    }

    if (trimmed.length > 5000) {
      return Result.failure(new InvalidMessageContentError());
    }

    return Result.success(new MessageContent(trimmed));
  }

  public getValue(): string {
    return this.value;
  }

  public equals(other: MessageContent): boolean {
    return this.value === other.value;
  }

  public toString(): string {
    return this.value;
  }
}
