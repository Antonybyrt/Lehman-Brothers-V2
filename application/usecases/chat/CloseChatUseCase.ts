import { Chat } from '@lehman-brothers/domain';
import { ChatRepository } from '../../repositories';
import { ChatNotFoundError, UnauthorizedChatAccessError, ValidationError } from '@lehman-brothers/domain';
import { exhaustive } from 'exhaustive';

export interface CloseChatRequest {
  readonly chatId: string;
  readonly userId: string;
  readonly userRole: string;
}

export interface CloseChatNotifications {
  readonly notifyClient: boolean;
  readonly notifyAdvisor: boolean;
  readonly clientId: string;
  readonly advisorId?: string;
  readonly chatId: string;
}

export interface CloseChatResponse {
  readonly success: boolean;
  readonly chatId?: string;
  readonly error?: string;
  readonly errorType?: 'validation' | 'not_found' | 'unauthorized' | 'server';
  readonly notifications?: CloseChatNotifications;
}

/**
 * Close a chat
 * Business rules: Validates permissions (client owner, assigned advisor, or director), closes the chat
 */
export class CloseChatUseCase {
  constructor(private readonly chatRepository: ChatRepository) { }

  async execute(request: CloseChatRequest): Promise<CloseChatResponse> {
    if (!this.isValidRequest(request)) {
      return {
        success: false,
        error: 'Chat ID, user ID and user role are required',
        errorType: 'validation'
      };
    }

    try {
      const chat = await this.chatRepository.findById(request.chatId);
      if (!chat) {
        throw new ChatNotFoundError(request.chatId);
      }

      const canClose =
        request.userId === chat.clientId ||
        request.userId === chat.advisorId ||
        request.userRole === 'DIRECTOR';

      if (!canClose) {
        throw new UnauthorizedChatAccessError(request.chatId, request.userId);
      }

      const closeResult = chat.close();
      if (!closeResult.isSuccess()) {
        throw closeResult.getError();
      }

      const closedChat = closeResult.getValue();

      await this.chatRepository.save(closedChat);

      const notifications: CloseChatNotifications = {
        notifyClient: true,
        notifyAdvisor: closedChat.advisorId !== null,
        clientId: closedChat.clientId,
        ...(closedChat.advisorId && { advisorId: closedChat.advisorId }),
        chatId: closedChat.id,
      };

      return {
        success: true,
        chatId: closedChat.id,
        notifications,
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

  private isValidRequest(request: CloseChatRequest): boolean {
    const hasRequiredFields = request.chatId && request.userId && request.userRole;

    return exhaustive(String(!!hasRequiredFields), {
      'true': () => true,
      'false': () => false
    });
  }
}
