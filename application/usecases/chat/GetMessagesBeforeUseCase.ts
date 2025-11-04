import { Message } from '@lehman-brothers/domain';
import { MessageRepository, ChatRepository, MessageReadRepository, UserRepository } from '../../repositories';
import { ChatNotFoundError, UnauthorizedChatAccessError, ValidationError } from '@lehman-brothers/domain';
import { exhaustive } from 'exhaustive';

export interface GetMessagesBeforeRequest {
  readonly chatId: string;
  readonly userId: string;
  readonly userRole: string;
  readonly limit?: number;
  readonly beforeId?: string;
}

export interface GetMessagesBeforeResponse {
  readonly success: boolean;
  readonly messages?: Array<{
    readonly id: string;
    readonly chatId: string;
    readonly authorId: string;
    readonly authorName: string;
    readonly content: string;
    readonly attachmentUrl: string | null;
    readonly edited: boolean;
    readonly deleted: boolean;
    readonly sentAt: Date;
    readonly updatedAt: Date;
    readonly isRead: boolean;
  }>;
  readonly hasMore?: boolean;
  readonly error?: string;
  readonly errorType?: 'validation' | 'not_found' | 'unauthorized' | 'server';
}

/**
 * Get chat messages with pagination
 * Business rules: Validates chat access, returns messages in reverse chronological order, pagination by message ID
 */
export class GetMessagesBeforeUseCase {
  constructor(
    private readonly messageRepository: MessageRepository,
    private readonly chatRepository: ChatRepository,
    private readonly messageReadRepository: MessageReadRepository,
    private readonly userRepository: UserRepository
  ) { }

  async execute(request: GetMessagesBeforeRequest): Promise<GetMessagesBeforeResponse> {
    if (!this.isValidRequest(request)) {
      return {
        success: false,
        error: 'Chat ID, user ID and user role are required',
        errorType: 'validation'
      };
    }

    try {
      const limit = request.limit || 50;

      const chat = await this.chatRepository.findById(request.chatId);
      if (!chat) {
        throw new ChatNotFoundError(request.chatId);
      }

      if (!chat.hasAccess(request.userId, request.userRole)) {
        throw new UnauthorizedChatAccessError(request.chatId, request.userId);
      }

      const messages = await this.messageRepository.findByChatId(
        request.chatId,
        limit + 1,
        request.beforeId
      );

      const hasMore = messages.length > limit;

      const resultMessages = hasMore ? messages.slice(0, limit) : messages;

      const otherUserId = chat.clientId === request.userId ? chat.advisorId : chat.clientId;

      const messageReads = otherUserId
        ? await this.messageReadRepository.findByUserIdAndChatId(otherUserId, request.chatId)
        : [];

      const readMessageIds = new Set(messageReads.map(mr => mr.messageId));

      // Récupérer les noms des auteurs de manière unique
      const uniqueAuthorIds = [...new Set(resultMessages.map(msg => msg.authorId))];
      const authorsMap = new Map<string, string>();

      for (const authorId of uniqueAuthorIds) {
        const user = await this.userRepository.findById(authorId);
        if (user) {
          authorsMap.set(authorId, user.getFullName());
        } else {
          authorsMap.set(authorId, 'Unknown User');
        }
      }

      return {
        success: true,
        messages: resultMessages.map(msg => ({
          id: msg.id,
          chatId: msg.chatId,
          authorId: msg.authorId,
          authorName: authorsMap.get(msg.authorId) || 'Unknown User',
          content: msg.content,
          attachmentUrl: msg.attachmentUrl,
          edited: msg.edited,
          deleted: msg.deleted,
          sentAt: msg.sentAt,
          updatedAt: msg.updatedAt,
          isRead: readMessageIds.has(msg.id),
        })),
        hasMore,
      };
    } catch (error) {
      if (error instanceof ChatNotFoundError) {
        return {
          success: false,
          error: error.message,
          errorType: 'not_found'
        };
      }
      if (error instanceof UnauthorizedChatAccessError) {
        return {
          success: false,
          error: error.message,
          errorType: 'unauthorized'
        };
      }
      if (error instanceof ValidationError) {
        return {
          success: false,
          error: error.message,
          errorType: 'validation'
        };
      }
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error occurred',
        errorType: 'server'
      };
    }
  }

  private isValidRequest(request: GetMessagesBeforeRequest): boolean {
    const hasRequiredFields = request.chatId && request.userId && request.userRole;

    return exhaustive(String(!!hasRequiredFields), {
      'true': () => true,
      'false': () => false
    });
  }
}
