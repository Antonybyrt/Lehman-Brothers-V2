import { ChatRepository } from '../../repositories';
import { ChatNotFoundError, UnauthorizedChatAccessError, ValidationError } from '@lehman-brothers/domain';
import { exhaustive } from 'exhaustive';

export interface SetTypingStatusRequest {
  readonly chatId: string;
  readonly userId: string;
  readonly userRole: string;
  readonly isTyping: boolean;
}

export interface SetTypingStatusResponse {
  readonly success: boolean;
  readonly error?: string;
  readonly errorType?: 'validation' | 'not_found' | 'unauthorized' | 'server';
}

/**
 * Use case: Définir le statut de saisie d'un utilisateur dans un chat
 * 
 * Règles métier:
 * - Vérifie que le chat existe
 * - Vérifie que l'utilisateur a accès au chat
 * - Ce use case ne persiste pas le statut (géré par WebSocket en mémoire)
 * - Il valide simplement les permissions avant que le WS broadcast l'événement
 */
export class SetTypingStatusUseCase {
  constructor(private readonly chatRepository: ChatRepository) { }

  async execute(request: SetTypingStatusRequest): Promise<SetTypingStatusResponse> {
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

      // Vérifier l'accès au chat
      if (!chat.hasAccess(request.userId, request.userRole)) {
        throw new UnauthorizedChatAccessError(request.chatId, request.userId);
      }

      // La logique de broadcast est gérée par le controller/service WS
      return {
        success: true,
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

  private isValidRequest(request: SetTypingStatusRequest): boolean {
    const hasRequiredFields = request.chatId && request.userId && request.userRole;
    const hasTypingStatus = typeof request.isTyping === 'boolean';

    return exhaustive(String(hasRequiredFields && hasTypingStatus), {
      'true': () => true,
      'false': () => false
    });
  }
}
