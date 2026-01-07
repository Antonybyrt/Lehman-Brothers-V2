import { ChatRepository } from '../../repositories';
import { ChatNotFoundError, UnauthorizedChatAccessError } from '@lehman-brothers/domain';
import { exhaustive } from 'exhaustive';

export interface GetChatByIdRequest {
  readonly chatId: string;
  readonly userId: string;
  readonly userRole: string;
}

export interface GetChatByIdResponse {
  readonly success: boolean;
  readonly chat?: {
    readonly id: string;
    readonly subject: string;
    readonly clientId: string;
    readonly advisorId: string | null;
    readonly status: string;
    readonly priority: string;
    readonly createdAt: string;
    readonly updatedAt: string;
  };
  readonly error?: string;
  readonly errorType?: 'validation' | 'not_found' | 'unauthorized' | 'server';
}

export class GetChatByIdUseCase {
  constructor(
    private readonly chatRepository: ChatRepository
  ) { }

  async execute(request: GetChatByIdRequest): Promise<GetChatByIdResponse> {
    if (!request.chatId) {
      return {
        success: false,
        error: 'Chat ID is required',
        errorType: 'validation'
      };
    }

    try {
      const chat = await this.chatRepository.findById(request.chatId);

      if (!chat) {
        return {
          success: false,
          error: 'Chat not found',
          errorType: 'not_found'
        };
      }

      if (!chat.hasAccess(request.userId, request.userRole)) {
        return {
          success: false,
          error: 'Unauthorized access to this chat',
          errorType: 'unauthorized'
        };
      }

      return {
        success: true,
        chat: {
          id: chat.id,
          subject: chat.subject,
          clientId: chat.clientId,
          advisorId: chat.advisorId,
          status: chat.status,
          priority: chat.priority,
          createdAt: chat.createdAt.toISOString(),
          updatedAt: chat.updatedAt.toISOString(),
        }
      };
    } catch (error) {
      console.error('[GetChatByIdUseCase] Error getting chat:', error);
      return {
        success: false,
        error: 'Failed to retrieve chat',
        errorType: 'server'
      };
    }
  }
}
