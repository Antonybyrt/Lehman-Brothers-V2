import { InvalidChatPriorityError } from '../errors';
import { Result } from './Result';

export enum ChatPriority {
  LOW = 'LOW',
  MEDIUM = 'MEDIUM',
  HIGH = 'HIGH'
}

export class ChatPriorityValue {
  private readonly value: string;

  private constructor(priority: string) {
    this.value = priority;
  }

  public static create(priority?: string): Result<ChatPriorityValue, Error> {

    // If no priority is provided, default to LOW
    if (!priority || priority && priority.length === 0) {
      return Result.success(new ChatPriorityValue(ChatPriority.LOW));
    }
    console.log(`priority: ${priority}`);
    const trimmed = priority!.trim();
    console.log(`trimmed priority: ${trimmed}`);

    if (
      trimmed !== ChatPriority.LOW &&
      trimmed !== ChatPriority.MEDIUM &&
      trimmed !== ChatPriority.HIGH
    ) {
      return Result.failure(new InvalidChatPriorityError(trimmed));
    }

    return Result.success(new ChatPriorityValue(trimmed));
  }

  public getValue(): string {
    return this.value;
  }

  public equals(other: ChatPriorityValue): boolean {
    return this.value === other.value;
  }

  public toString(): string {
    return this.value;
  }
}
