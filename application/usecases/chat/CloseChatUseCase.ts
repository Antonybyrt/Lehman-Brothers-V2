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
 * Use case: Fermer un chat
 * 
 * Règles métier:
 * - Vérifie que le chat existe
 * - Vérifie que l'utilisateur a les permissions (client propriétaire, conseiller assigné, ou directeur)
 * - Ferme le chat
 */
export class CloseChatUseCase {
  constructor(private readonly chatRepository: ChatRepository) { }

  async execute(request: CloseChatRequest): Promise<CloseChatResponse> {
    // Early return pattern - validate required fields
    if (!this.isValidRequest(request)) {
      return {
        success: false,
        error: 'Chat ID, user ID and user role are required',
        errorType: 'validation'
      };
    }

    try {
      // Vérifier que le chat existe
      const chat = await this.chatRepository.findById(request.chatId);
      if (!chat) {
        throw new ChatNotFoundError(request.chatId);
      }

      // Vérifier les permissions
      const canClose =
        request.userId === chat.clientId ||
        request.userId === chat.advisorId ||
        request.userRole === 'DIRECTOR';

      if (!canClose) {
        throw new UnauthorizedChatAccessError(request.chatId, request.userId);
      }

      // Fermer le chat
      const closeResult = chat.close();
      if (!closeResult.isSuccess()) {
        throw closeResult.getError();
      }

      const closedChat = closeResult.getValue();

      // Sauvegarder
      await this.chatRepository.save(closedChat);

      // Décider qui notifier (logique métier)
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
