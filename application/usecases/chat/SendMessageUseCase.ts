import { Chat, Message } from '@lehman-brothers/domain';
import { ChatRepository, MessageRepository, UserRepository } from '../../repositories';
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
 * Use case: Envoyer un message dans un chat
 * 
 * Règles métier:
 * - Vérifie que le chat existe et que l'utilisateur y a accès
 * - Vérifie que l'auteur existe
 * - Si c'est la première réponse d'un conseiller, assigne le conseiller au chat
 * - Crée et sauvegarde le message
 */
export class SendMessageUseCase {
  constructor(
    private readonly chatRepository: ChatRepository,
    private readonly messageRepository: MessageRepository,
    private readonly userRepository: UserRepository
  ) { }

  async execute(request: SendMessageRequest): Promise<SendMessageResponse> {
    // Early return pattern - validate required fields
    if (!this.isValidRequest(request)) {
      return {
        success: false,
        error: 'Chat ID, author ID and content are required',
        errorType: 'validation'
      };
    }

    try {
      // Vérifier que le chat existe
      const chat = await this.chatRepository.findById(request.chatId);
      if (!chat) {
        throw new ChatNotFoundError(request.chatId);
      }

      // Vérifier que le chat n'est pas fermé
      if (chat.status === 'CLOSED') {
        throw new ChatAlreadyClosedError(request.chatId);
      }

      // Vérifier que l'auteur existe
      const author = await this.userRepository.findById(request.authorId);
      if (!author) {
        throw new UserNotFoundError(request.authorId);
      }

      // Vérifier l'accès au chat
      const userRole = author.getRole().getValue();
      if (!chat.hasAccess(request.authorId, userRole)) {
        throw new UnauthorizedChatAccessError(request.chatId, request.authorId);
      }

      // Détecter si c'est la première réponse d'un conseiller
      let isFirstAdvisorResponse = false;
      if (userRole === 'ADVISOR' && !chat.advisorId) {
        const assignResult = chat.assignAdvisor(request.authorId);
        if (!assignResult.isSuccess()) {
          throw assignResult.getError();
        }
        await this.chatRepository.save(assignResult.getValue());
        isFirstAdvisorResponse = true;
      }

      // Créer le message
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

      // Sauvegarder le message
      await this.messageRepository.save(message);

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

  // Génère un ID unique pour le message (bigint timestamp + random)
  private generateMessageId(): string {
    const timestamp = Date.now();
    const random = Math.floor(Math.random() * 1000);
    return `${timestamp}${random.toString().padStart(3, '0')}`;
  }
}
