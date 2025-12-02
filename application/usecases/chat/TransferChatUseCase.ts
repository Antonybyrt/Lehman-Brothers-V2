import { Chat } from '@lehman-brothers/domain';
import { ChatRepository, UserRepository } from '../../repositories';
import {
  ChatNotFoundError,
  UserNotFoundError,
  InvalidUserRoleError,
  UnauthorizedChatAccessError,
  ValidationError
} from '@lehman-brothers/domain';
import { exhaustive } from 'exhaustive';

export interface TransferChatRequest {
  readonly chatId: string;
  readonly newAdvisorId: string;
  readonly requestingUserId: string;
  readonly requestingUserRole: string;
}

export interface TransferChatNotifications {
  readonly notifyPreviousAdvisor: boolean;
  readonly notifyNewAdvisor: boolean;
  readonly notifyClient: boolean;
  readonly previousAdvisorId?: string;
  readonly newAdvisorId: string;
  readonly clientId: string;
  readonly chatId: string;
}

export interface TransferChatResponse {
  readonly success: boolean;
  readonly chatId?: string;
  readonly previousAdvisorId?: string;
  readonly newAdvisorId?: string;
  readonly error?: string;
  readonly errorType?: 'validation' | 'not_found' | 'unauthorized' | 'server';
  readonly notifications?: TransferChatNotifications;
}

/**
 * Transfer a chat to another advisor
 * Business rules: Validates permissions (director or current advisor), verifies new advisor role, updates chat
 */
export class TransferChatUseCase {
  constructor(
    private readonly chatRepository: ChatRepository,
    private readonly userRepository: UserRepository
  ) { }

  async execute(request: TransferChatRequest): Promise<TransferChatResponse> {
    if (!this.isValidRequest(request)) {
      return {
        success: false,
        error: 'Chat ID, new advisor ID, requesting user ID and role are required',
        errorType: 'validation'
      };
    }

    try {
      const chat = await this.chatRepository.findById(request.chatId);
      if (!chat) {
        throw new ChatNotFoundError(request.chatId);
      }

      if (!chat.advisorId) {
        throw new ValidationError('chat', 'Chat has no assigned advisor');
      }

      const isDirector = request.requestingUserRole === 'DIRECTOR';
      const isCurrentAdvisor = chat.advisorId === request.requestingUserId;

      if (!isDirector && !isCurrentAdvisor) {
        throw new UnauthorizedChatAccessError(request.chatId, request.requestingUserId);
      }

      const newAdvisor = await this.userRepository.findById(request.newAdvisorId);
      if (!newAdvisor) {
        throw new UserNotFoundError(request.newAdvisorId);
      }

      const newAdvisorRole = newAdvisor.getRole().getValue();
      if (newAdvisorRole !== 'ADVISOR') {
        throw new InvalidUserRoleError(newAdvisorRole, ['ADVISOR']);
      }

      const previousAdvisorId = chat.advisorId;

      const transferResult = chat.transferTo(request.newAdvisorId);
      if (!transferResult.isSuccess()) {
        throw transferResult.getError();
      }

      const updatedChat = transferResult.getValue();

      await this.chatRepository.save(updatedChat);

      const notifications: TransferChatNotifications = {
        notifyPreviousAdvisor: previousAdvisorId !== null,
        notifyNewAdvisor: true,
        notifyClient: true,
        ...(previousAdvisorId && { previousAdvisorId }),
        newAdvisorId: request.newAdvisorId,
        clientId: updatedChat.clientId,
        chatId: updatedChat.id,
      };

      return {
        success: true,
        chatId: updatedChat.id,
        ...(previousAdvisorId && { previousAdvisorId }),
        newAdvisorId: request.newAdvisorId,
        notifications,
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
      if (error instanceof InvalidUserRoleError || error instanceof ValidationError) {
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

  private isValidRequest(request: TransferChatRequest): boolean {
    const hasRequiredFields = request.chatId && request.newAdvisorId &&
      request.requestingUserId && request.requestingUserRole;

    return exhaustive(String(!!hasRequiredFields), {
      'true': () => true,
      'false': () => false
    });
  }
}
