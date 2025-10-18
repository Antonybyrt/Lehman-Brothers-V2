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

export interface TransferChatResponse {
  readonly success: boolean;
  readonly chatId?: string;
  readonly previousAdvisorId?: string;
  readonly newAdvisorId?: string;
  readonly error?: string;
  readonly errorType?: 'validation' | 'not_found' | 'unauthorized' | 'server';
}

/**
 * Use case: Transférer un chat à un autre conseiller
 * 
 * Règles métier:
 * - Vérifie que le chat existe et a un conseiller assigné
 * - Vérifie que le nouvel utilisateur est un conseiller
 * - Vérifie que l'utilisateur demandant le transfert est autorisé (directeur ou conseiller actuel)
 * - Met à jour le chat avec le nouveau conseiller
 */
export class TransferChatUseCase {
  constructor(
    private readonly chatRepository: ChatRepository,
    private readonly userRepository: UserRepository
  ) { }

  async execute(request: TransferChatRequest): Promise<TransferChatResponse> {
    // Early return pattern - validate required fields
    if (!this.isValidRequest(request)) {
      return {
        success: false,
        error: 'Chat ID, new advisor ID, requesting user ID and role are required',
        errorType: 'validation'
      };
    }

    try {
      // Vérifier que le chat existe
      const chat = await this.chatRepository.findById(request.chatId);
      if (!chat) {
        throw new ChatNotFoundError(request.chatId);
      }

      // Vérifier que le chat a un conseiller assigné
      if (!chat.advisorId) {
        throw new ValidationError('chat', 'Chat has no assigned advisor');
      }

      // Vérifier les permissions de l'utilisateur demandant le transfert
      const isDirector = request.requestingUserRole === 'DIRECTOR';
      const isCurrentAdvisor = chat.advisorId === request.requestingUserId;

      if (!isDirector && !isCurrentAdvisor) {
        throw new UnauthorizedChatAccessError(request.chatId, request.requestingUserId);
      }

      // Vérifier que le nouveau conseiller existe et est bien un conseiller
      const newAdvisor = await this.userRepository.findById(request.newAdvisorId);
      if (!newAdvisor) {
        throw new UserNotFoundError(request.newAdvisorId);
      }

      const newAdvisorRole = newAdvisor.getRole().getValue();
      if (newAdvisorRole !== 'ADVISOR') {
        throw new InvalidUserRoleError(newAdvisorRole, ['ADVISOR']);
      }

      // Sauvegarder l'ancien conseiller pour la réponse
      const previousAdvisorId = chat.advisorId;

      // Transférer le chat
      const transferResult = chat.transferTo(request.newAdvisorId);
      if (!transferResult.isSuccess()) {
        throw transferResult.getError();
      }

      const updatedChat = transferResult.getValue();

      // Sauvegarder
      await this.chatRepository.save(updatedChat);

      return {
        success: true,
        chatId: updatedChat.id,
        previousAdvisorId,
        newAdvisorId: request.newAdvisorId,
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
