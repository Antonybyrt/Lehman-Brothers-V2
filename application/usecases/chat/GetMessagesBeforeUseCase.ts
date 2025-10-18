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
 * Use case: Récupérer les messages d'un chat avec pagination
 * 
 * Règles métier:
 * - Vérifie que le chat existe et que l'utilisateur y a accès
 * - Retourne les messages par ordre chronologique décroissant (du plus récent au plus ancien)
 * - Pagination basée sur l'ID du message (beforeId)
 */
export class GetMessagesBeforeUseCase {
  constructor(
    private readonly messageRepository: MessageRepository,
    private readonly chatRepository: ChatRepository,
    private readonly messageReadRepository: MessageReadRepository,
    private readonly userRepository: UserRepository
  ) { }

  async execute(request: GetMessagesBeforeRequest): Promise<GetMessagesBeforeResponse> {
    // Early return pattern - validate required fields
    if (!this.isValidRequest(request)) {
      return {
        success: false,
        error: 'Chat ID, user ID and user role are required',
        errorType: 'validation'
      };
    }

    try {
      const limit = request.limit || 50;

      // Vérifier que le chat existe
      const chat = await this.chatRepository.findById(request.chatId);
      if (!chat) {
        throw new ChatNotFoundError(request.chatId);
      }

      // Vérifier l'accès au chat
      if (!chat.hasAccess(request.userId, request.userRole)) {
        throw new UnauthorizedChatAccessError(request.chatId, request.userId);
      }

      // Récupérer les messages avec pagination
      // On demande limit + 1 pour savoir s'il y a d'autres messages
      const messages = await this.messageRepository.findByChatId(
        request.chatId,
        limit + 1,
        request.beforeId
      );

      // Vérifier s'il y a plus de messages
      const hasMore = messages.length > limit;

      // Retourner seulement 'limit' messages
      const resultMessages = hasMore ? messages.slice(0, limit) : messages;

      // Déterminer l'autre participant du chat
      // Si je suis le client, l'autre est l'advisor, et vice versa
      const otherUserId = chat.clientId === request.userId ? chat.advisorId : chat.clientId;

      // Récupérer les statuts de lecture par L'AUTRE utilisateur
      // isRead = true signifie "l'autre personne a lu mon message"
      const messageReads = otherUserId
        ? await this.messageReadRepository.findByUserIdAndChatId(otherUserId, request.chatId)
        : [];

      // Créer un Set des IDs de messages lus PAR L'AUTRE UTILISATEUR
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
