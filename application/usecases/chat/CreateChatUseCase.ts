import { Chat } from '@lehman-brothers/domain';
import { ChatRepository, UserRepository, ChatViewRepository } from '../../repositories';
import { ChatNotificationService } from '../../services';
import { UserNotFoundError, InvalidUserRoleError, ValidationError } from '@lehman-brothers/domain';
import { exhaustive } from 'exhaustive';

export interface CreateChatRequest {
  readonly clientId: string;
  readonly subject: string;
  readonly creatorRole?: string; // Role of the user creating the chat (CLIENT or ADVISOR)
  readonly creatorId?: string; // ID of the user creating the chat (to auto-assign advisor)
}

export interface CreateChatResponse {
  readonly success: boolean;
  readonly chatId?: string;
  readonly subject?: string;
  readonly error?: string;
  readonly errorType?: 'validation' | 'not_found' | 'server';
}

/**
 * Use case: Créer un nouveau chat
 * 
 * Règles métier:
 * - Vérifie que l'utilisateur existe et est un client
 * - Crée un nouveau chat avec le sujet spécifié
 * - Le chat est créé avec le statut OPEN et sans conseiller assigné
 * - Envoie les notifications appropriées (advisors, client si créé par advisor)
 */
export class CreateChatUseCase {
  constructor(
    private readonly chatRepository: ChatRepository,
    private readonly userRepository: UserRepository,
    private readonly chatViewRepository: ChatViewRepository,
    private readonly notificationService: ChatNotificationService
  ) { }

  async execute(request: CreateChatRequest): Promise<CreateChatResponse> {
    // Early return pattern - validate required fields
    if (!this.isValidRequest(request)) {
      return {
        success: false,
        error: 'Client ID and subject are required',
        errorType: 'validation'
      };
    }

    try {
      // Vérifier que le client existe
      const client = await this.userRepository.findById(request.clientId);
      if (!client) {
        throw new UserNotFoundError(request.clientId);
      }

      // Vérifier que le clientId correspond bien à un CLIENT
      // (un advisor ne peut créer un chat que pour un client, pas pour un autre advisor)
      const clientRole = client.getRole().getValue();
      if (clientRole !== 'CLIENT') {
        throw new InvalidUserRoleError(clientRole, ['CLIENT']);
      }

      // Note: Si creatorRole === 'ADVISOR', un advisor crée un chat pour un client
      // C'est autorisé. Seul le clientId doit être un CLIENT.

      // Si c'est un advisor qui crée le chat, l'assigner automatiquement
      const advisorId = (request.creatorRole === 'ADVISOR' || request.creatorRole === 'DIRECTOR') && request.creatorId
        ? request.creatorId
        : null;

      // Créer le chat
      const chatResult = Chat.create({
        id: crypto.randomUUID(),
        subject: request.subject,
        clientId: request.clientId,
        advisorId: advisorId,
      });

      if (!chatResult.isSuccess()) {
        throw chatResult.getError();
      }

      const chat = chatResult.getValue();

      // Sauvegarder le chat
      await this.chatRepository.save(chat);

      // Récupérer les données enrichies pour la notification
      const chatView = await this.chatViewRepository.findByIdWithNames(chat.id);

      if (chatView) {
        // Envoyer les notifications (logique métier dans le Use Case)
        const chatPayload = {
          chatId: chatView.id,
          subject: chatView.subject,
          clientId: chatView.clientId,
          clientName: chatView.clientName,
          advisorId: chatView.advisorId || undefined,
          advisorName: chatView.advisorName || undefined,
          status: chatView.status,
        };

        // Toujours notifier tous les advisors des nouveaux chats
        await this.notificationService.notifyRole('ADVISOR', 'chat:created', chatPayload);

        // Notifier le client si le chat a été créé par un advisor
        const shouldNotifyClient = request.creatorRole === 'ADVISOR' || request.creatorRole === 'DIRECTOR';
        if (shouldNotifyClient) {
          await this.notificationService.notifyUser(chat.clientId, 'chat:created', chatPayload);
        }
      }

      return {
        success: true,
        chatId: chat.id,
        subject: chat.subject,
      };
    } catch (error) {
      if (error instanceof UserNotFoundError) {
        return {
          success: false,
          error: error.message,
          errorType: 'not_found'
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

  private isValidRequest(request: CreateChatRequest): boolean {
    const hasRequiredFields = request.clientId && request.subject;
    const isValidSubject = request.subject && request.subject.trim().length > 0;

    return exhaustive(String(hasRequiredFields && isValidSubject), {
      'true': () => true,
      'false': () => false
    });
  }
}
