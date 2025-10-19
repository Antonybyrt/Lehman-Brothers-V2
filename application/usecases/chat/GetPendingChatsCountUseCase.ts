import { ChatRepository, MessageRepository } from '../../repositories';
import { ValidationError } from '@lehman-brothers/domain';

export interface GetPendingChatsCountRequest {
  readonly userId: string;
  readonly userRole: string;
}

export interface GetPendingChatsCountResponse {
  readonly success: boolean;
  readonly count?: number;
  readonly error?: string;
  readonly errorType?: 'validation' | 'server';
}

/**
 * Count chats pending advisor response
 * Business rule: A chat is "pending" if it's OPEN and the last message was sent by the client
 */
export class GetPendingChatsCountUseCase {
  constructor(
    private readonly chatRepository: ChatRepository,
    private readonly messageRepository: MessageRepository
  ) { }

  async execute(request: GetPendingChatsCountRequest): Promise<GetPendingChatsCountResponse> {
    if (!this.isValidRequest(request)) {
      return {
        success: false,
        error: 'User ID and role are required',
        errorType: 'validation'
      };
    }

    try {
      // Only advisors can check pending chats count
      if (request.userRole !== 'ADVISOR') {
        return {
          success: true,
          count: 0
        };
      }

      // Get all chats assigned to this advisor
      const chats = await this.chatRepository.findByAdvisorId(request.userId);

      // Filter OPEN chats and count those where last message is from client
      let pendingCount = 0;

      for (const chat of chats) {
        // Skip non-open chats
        if (chat.status !== 'OPEN') {
          continue;
        }

        // Get last message (limit 1)
        const messages = await this.messageRepository.findByChatId(chat.id, 1);

        // If no messages, consider it pending (new chat)
        if (messages.length === 0) {
          pendingCount++;
          continue;
        }

        // If last message is from client (not the advisor), it's pending
        const lastMessage = messages[0];
        if (lastMessage && lastMessage.authorId !== request.userId) {
          pendingCount++;
        }
      }

      return {
        success: true,
        count: pendingCount
      };
    } catch (error) {
      console.error('Error in GetPendingChatsCountUseCase:', error);
      return {
        success: false,
        error: 'Failed to count pending chats',
        errorType: 'server'
      };
    }
  }

  private isValidRequest(request: GetPendingChatsCountRequest): boolean {
    return !!(request.userId && request.userRole);
  }
}
