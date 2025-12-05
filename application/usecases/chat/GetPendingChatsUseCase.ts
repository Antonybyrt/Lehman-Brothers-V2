import { ChatRepository, MessageRepository, ChatViewRepository } from '../../repositories';
import { ValidationError } from '@lehman-brothers/domain';
import { UserRole } from '@lehman-brothers/domain/values/UserRole';
import { ChatView } from '../../repositories/chat/ChatViewRepository';

export interface GetPendingChatsRequest {
  readonly userId: string;
  readonly userRole: string;
}

export interface PendingChat extends ChatView {
  readonly lastMessage: string | null;
  readonly lastMessageAt: string | null;
  readonly lastMessageAuthorId: string | null;
}

export interface GetPendingChatsResponse {
  readonly success: boolean;
  readonly chats?: PendingChat[];
  readonly error?: string;
  readonly errorType?: 'validation' | 'server';
}

/**
 * Get chats pending advisor response
 * Business rule: A chat is "pending" if it's OPEN and the last message was sent by the client
 */
export class GetPendingChatsUseCase {
  constructor(
    private readonly chatRepository: ChatRepository,
    private readonly messageRepository: MessageRepository,
    private readonly chatViewRepository: ChatViewRepository
  ) { }

  async execute(request: GetPendingChatsRequest): Promise<GetPendingChatsResponse> {
    if (!this.isValidRequest(request)) {
      return {
        success: false,
        error: 'User ID and role are required',
        errorType: 'validation'
      };
    }

    try {
      // Only advisors can check pending chats
      if (request.userRole !== UserRole.ADVISOR) {
        return {
          success: true,
          chats: []
        };
      }

      // Get all chats assigned to this advisor
      const chats = await this.chatRepository.findByAdvisorId(request.userId);

      const pendingChats: PendingChat[] = [];

      for (const chat of chats) {
        // Skip non-open chats
        if (chat.status !== 'OPEN') {
          continue;
        }

        // Get last message (limit 1)
        const messages = await this.messageRepository.findByChatId(chat.id, 1);

        // If no messages, consider it pending (new chat)
        // OR if last message is from client (not the advisor), it's pending
        let isPending = false;
        let lastMessage = null;

        if (messages.length === 0) {
          isPending = true;
        } else {
          lastMessage = messages[0];
          if (lastMessage && lastMessage.authorId !== request.userId) {
            isPending = true;
          }
        }

        if (isPending) {
          const chatView = await this.chatViewRepository.toView(chat);
          pendingChats.push({
            ...chatView,
            lastMessage: lastMessage ? lastMessage.content : null,
            lastMessageAt: lastMessage ? lastMessage.sentAt.toISOString() : null,
            lastMessageAuthorId: lastMessage ? lastMessage.authorId : null
          });
        }
      }

      return {
        success: true,
        chats: pendingChats
      };
    } catch (error) {
      console.error('Error in GetPendingChatsUseCase:', error);
      return {
        success: false,
        error: 'Failed to get pending chats',
        errorType: 'server'
      };
    }
  }

  private isValidRequest(request: GetPendingChatsRequest): boolean {
    return !!(request.userId && request.userRole);
  }
}
