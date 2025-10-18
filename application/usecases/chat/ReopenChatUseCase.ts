import { Chat } from '@lehman-brothers/domain';
import { ChatRepository } from '../../repositories';
import { ChatNotFoundError, UnauthorizedChatAccessError, ValidationError } from '@lehman-brothers/domain';
import { exhaustive } from 'exhaustive';

export interface ReopenChatRequest {
  readonly chatId: string;
  readonly userId: string;
  readonly userRole: string;
}

export interface ReopenChatResponse {
  readonly success: boolean;
  readonly chatId?: string;
  readonly error?: string;
  readonly errorType?: 'validation' | 'not_found' | 'unauthorized' | 'server';
}

/**
 * Use case: Rouvrir un chat fermé
 * 
 * Règles métier:
 * - Vérifie que le chat existe
 * - Vérifie que l'utilisateur a les permissions (client propriétaire, conseiller assigné, ou directeur)
 * - Rouvre le chat
 */
export class ReopenChatUseCase {
  constructor(private readonly chatRepository: ChatRepository) { }

  async execute(request: ReopenChatRequest): Promise<ReopenChatResponse> {
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
      const canReopen =
        request.userId === chat.clientId ||
        request.userId === chat.advisorId ||
        request.userRole === 'DIRECTOR';

      if (!canReopen) {
        throw new UnauthorizedChatAccessError(request.chatId, request.userId);
      }

      // Rouvrir le chat
      const reopenResult = chat.reopen();
      if (!reopenResult.isSuccess()) {
        throw reopenResult.getError();
      }

      const reopenedChat = reopenResult.getValue();

      // Sauvegarder
      await this.chatRepository.save(reopenedChat);

      return {
        success: true,
        chatId: reopenedChat.id,
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

  private isValidRequest(request: ReopenChatRequest): boolean {
    const hasRequiredFields = request.chatId && request.userId && request.userRole;

    return exhaustive(String(!!hasRequiredFields), {
      'true': () => true,
      'false': () => false
    });
  }
}
