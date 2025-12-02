import { InvalidChatSubjectError } from '../errors';
import { Result } from './Result';

export class ChatSubject {
  private readonly value: string;

  private constructor(subject: string) {
    this.value = subject;
  }

  public static create(subject: string): Result<ChatSubject, Error> {
    const trimmed = subject.trim();

    if (!trimmed || trimmed.length === 0) {
      return Result.failure(new InvalidChatSubjectError(subject));
    }

    if (trimmed.length > 200) {
      return Result.failure(new InvalidChatSubjectError('Subject must be less than 200 characters'));
    }

    return Result.success(new ChatSubject(trimmed));
  }

  public getValue(): string {
    return this.value;
  }

  public equals(other: ChatSubject): boolean {
    return this.value === other.value;
  }

  public toString(): string {
    return this.value;
  }
}
