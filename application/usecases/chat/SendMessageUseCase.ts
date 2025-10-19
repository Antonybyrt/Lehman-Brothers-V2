import { Chat, Message } from '@lehman-brothers/domain';
import { ChatRepository, MessageRepository, UserRepository, UserViewRepository } from '../../repositories';
import { ChatNotificationService } from '../../services';
import {
  ChatNotFoundError,
  UserNotFoundError,
  UnauthorizedChatAccessError,
  ChatAlreadyClosedError,
  ValidationError
} from '@lehman-brothers/domain';
import { exhaustive } from 'exhaustive';

export interface SendMessageRequest {
  readonly chatId: string;
  readonly authorId: string;
  readonly content: string;
  readonly attachmentUrl?: string;
}

export interface SendMessageResponse {
  readonly success: boolean;
  readonly messageId?: string;
  readonly chatId?: string;
  readonly isFirstAdvisorResponse?: boolean;
  readonly error?: string;
  readonly errorType?: 'validation' | 'not_found' | 'unauthorized' | 'business' | 'server';
}

/**
 * Send a message in a chat
 * Business rules: Validates chat access, auto-assigns advisor on first reply, creates message, notifies participants
 */
export class SendMessageUseCase {
  constructor(
    private readonly chatRepository: ChatRepository,
    private readonly messageRepository: MessageRepository,
    private readonly userRepository: UserRepository,
    private readonly userViewRepository: UserViewRepository,
    private readonly notificationService: ChatNotificationService
  ) { }

  async execute(request: SendMessageRequest): Promise<SendMessageResponse> {
    if (!this.isValidRequest(request)) {
      return {
        success: false,
        error: 'Chat ID, author ID and content are required',
        errorType: 'validation'
      };
    }

    try {
      const chat = await this.chatRepository.findById(request.chatId);
      if (!chat) {
        throw new ChatNotFoundError(request.chatId);
      }

      if (chat.status === 'CLOSED') {
        throw new ChatAlreadyClosedError(request.chatId);
      }

      const author = await this.userRepository.findById(request.authorId);
      if (!author) {
        throw new UserNotFoundError(request.authorId);
      }

      const userRole = author.getRole().getValue();
      if (!chat.hasAccess(request.authorId, userRole)) {
        throw new UnauthorizedChatAccessError(request.chatId, request.authorId);
      }

      let isFirstAdvisorResponse = false;
      if (userRole === 'ADVISOR' && !chat.advisorId) {
        const assignResult = chat.assignAdvisor(request.authorId);
        if (!assignResult.isSuccess()) {
          throw assignResult.getError();
        }
        await this.chatRepository.save(assignResult.getValue());
        isFirstAdvisorResponse = true;
      }

      const messageResult = Message.create({
        id: this.generateMessageId(),
        chatId: request.chatId,
        authorId: request.authorId,
        content: request.content,
        attachmentUrl: request.attachmentUrl || null,
      });

      if (!messageResult.isSuccess()) {
        throw messageResult.getError();
      }

      const message = messageResult.getValue();

      await this.messageRepository.save(message);

      const authorView = await this.userViewRepository.findByIdAsView(request.authorId);
      const authorName = authorView?.fullName || 'Unknown';

      const messagePayload = {
        chatId: chat.id,
        message: {
          id: message.id,
          content: message.content,
          authorId: request.authorId,
          authorName,
          createdAt: message.sentAt.toISOString(),
        },
      };

      await this.notificationService.notifyChat(chat.id, 'message:created', messagePayload);

      if (isFirstAdvisorResponse) {
        const chatUpdatePayload = {
          chatId: chat.id,
          advisorId: request.authorId,
          advisorName: authorName,
          status: chat.status,
        };
        await this.notificationService.notifyUser(chat.clientId, 'chat:updated', chatUpdatePayload);
      }

      return {
        success: true,
        messageId: message.id,
        chatId: chat.id,
        isFirstAdvisorResponse,
      };
    } catch (error) {
      if (error instanceof ChatNotFoundError || error instanceof UserNotFoundError) {
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
      if (error instanceof ChatAlreadyClosedError) {
        return {
          success: false,
          error: error.message,
          errorType: 'business'
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

  private isValidRequest(request: SendMessageRequest): boolean {
    const hasRequiredFields = request.chatId && request.authorId && request.content;
    const isValidContent = request.content && request.content.trim().length > 0;

    return exhaustive(String(hasRequiredFields && isValidContent), {
      'true': () => true,
      'false': () => false
    });
  }

  private generateMessageId(): string {
    const timestamp = Date.now();
    const random = Math.floor(Math.random() * 1000);
    return `${timestamp}${random.toString().padStart(3, '0')}`;
  }
}
