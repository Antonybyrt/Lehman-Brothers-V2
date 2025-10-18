import { MessageRead } from '@lehman-brothers/domain';
import { MessageReadRepository, MessageRepository, ChatRepository } from '../../repositories';
import {
  MessageNotFoundError,
  ChatNotFoundError,
  UnauthorizedChatAccessError,
  ValidationError
} from '@lehman-brothers/domain';
import { exhaustive } from 'exhaustive';

export interface MarkAsReadRequest {
  readonly messageIds: string[];
  readonly userId: string;
  readonly userRole: string;
}

export interface MarkAsReadResponse {
  readonly success: boolean;
  readonly markedCount?: number;
  readonly error?: string;
  readonly errorType?: 'validation' | 'not_found' | 'unauthorized' | 'server';
}

/**
 * Use case: Marquer des messages comme lus par un utilisateur
 * 
 * Règles métier:
 * - Vérifie que les messages existent et appartiennent au même chat
 * - Vérifie que l'utilisateur a accès au chat
 * - Ne marque que les messages non encore lus
 */
export class MarkAsReadUseCase {
  constructor(
    private readonly messageReadRepository: MessageReadRepository,
    private readonly messageRepository: MessageRepository,
    private readonly chatRepository: ChatRepository
  ) { }

  async execute(request: MarkAsReadRequest): Promise<MarkAsReadResponse> {
    // Early return pattern - validate required fields
    if (!this.isValidRequest(request)) {
      return {
        success: false,
        error: 'User ID and user role are required',
        errorType: 'validation'
      };
    }

    if (request.messageIds.length === 0) {
      return {
        success: true,
        markedCount: 0
      };
    }

    try {
      // Récupérer le premier message pour obtenir le chatId
      const firstMessageId = request.messageIds[0];
      if (!firstMessageId) {
        throw new ValidationError('messageIds', 'Invalid message ID');
      }

      const firstMessage = await this.messageRepository.findById(firstMessageId);
      if (!firstMessage) {
        throw new MessageNotFoundError(firstMessageId);
      }

      // Vérifier que le chat existe
      const chat = await this.chatRepository.findById(firstMessage.chatId);
      if (!chat) {
        throw new ChatNotFoundError(firstMessage.chatId);
      }

      // Vérifier l'accès au chat
      if (!chat.hasAccess(request.userId, request.userRole)) {
        throw new UnauthorizedChatAccessError(firstMessage.chatId, request.userId);
      }

      // Vérifier que tous les messages appartiennent au même chat
      const messages = await Promise.all(
        request.messageIds.map(id => this.messageRepository.findById(id))
      );

      for (const message of messages) {
        if (!message) {
          throw new MessageNotFoundError('unknown');
        }
        if (message.chatId !== firstMessage.chatId) {
          throw new ValidationError('messages', 'All messages must belong to the same chat');
        }
      }

      // Filtrer les messages non encore lus
      const unreadMessageIds: string[] = [];
      for (const messageId of request.messageIds) {
        const hasRead = await this.messageReadRepository.hasRead(messageId, request.userId);
        if (!hasRead) {
          unreadMessageIds.push(messageId);
        }
      }

      // Marquer les messages comme lus
      if (unreadMessageIds.length > 0) {
        console.log('[MarkAsReadUseCase] Marking messages as read:', {
          userId: request.userId,
          messageIds: unreadMessageIds,
          count: unreadMessageIds.length
        });
        await this.messageReadRepository.markMultipleAsRead(unreadMessageIds, request.userId);
      }

      return {
        success: true,
        markedCount: unreadMessageIds.length,
      };
    } catch (error) {
      if (error instanceof MessageNotFoundError || error instanceof ChatNotFoundError) {
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

  private isValidRequest(request: MarkAsReadRequest): boolean {
    const hasRequiredFields = request.userId && request.userRole;

    return exhaustive(String(!!hasRequiredFields), {
      'true': () => true,
      'false': () => false
    });
  }
}
