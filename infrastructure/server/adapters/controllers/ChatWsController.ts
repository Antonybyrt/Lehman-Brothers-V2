import WebSocket from 'ws';
import { WsServerService } from '../services/WsServerService';
import {
  SendMessageUseCase,
  GetMessagesBeforeUseCase,
  MarkAsReadUseCase,
  SetTypingStatusUseCase,
} from '@lehman-brothers/application/usecases/chat';
import {
  UserRepository,
  ChatRepository,
  UserViewRepository
} from '@lehman-brothers/application';
import {
  ClientMessage,
  WsUserContext,
  JoinChatMessage,
  TypingMessage,
  NewMessageMessage,
  MessageReadMessage,
} from '../../ws/types';

/**
 * Contrôleur WebSocket pour le chat
 * 
 * Responsabilités:
 * - Router les événements WebSocket vers les use cases appropriés
 * - Broadcaster les événements (selon les instructions des use cases)
 * - Gérer les erreurs et les envoyer au client
 */
export class ChatController {
  constructor(
    private readonly wsService: WsServerService,
    private readonly sendMessageUseCase: SendMessageUseCase,
    private readonly getMessagesBeforeUseCase: GetMessagesBeforeUseCase,
    private readonly markAsReadUseCase: MarkAsReadUseCase,
    private readonly setTypingStatusUseCase: SetTypingStatusUseCase,
    private readonly userRepository: UserRepository,
    private readonly chatRepository: ChatRepository,
    private readonly userViewRepository: UserViewRepository
  ) {
    this.setupHandlers();
  }

  // Configure les handlers pour les différents types d'événements
  private setupHandlers(): void {
    this.wsService.onConnection(async (ws, message, userContext) => {
      try {
        switch (message.type) {
          case 'join':
            await this.handleJoin(ws, message as JoinChatMessage, userContext);
            break;

          case 'typing':
            await this.handleTyping(ws, message as TypingMessage, userContext);
            break;

          case 'message:new':
            await this.handleNewMessage(ws, message as NewMessageMessage, userContext);
            break;

          case 'message:read':
            await this.handleMessageRead(ws, message as MessageReadMessage, userContext);
            break;

          default:
            this.wsService.sendError(ws, 'Unknown message type');
        }
      } catch (error) {
        console.error('[ChatController] Error handling message:', error);
        const errorMessage = error instanceof Error ? error.message : 'Internal server error';
        this.wsService.sendError(ws, errorMessage);
      }
    });
  }

  // Gère l'événement 'join' - Un utilisateur rejoint un chat
  private async handleJoin(
    ws: WebSocket,
    message: JoinChatMessage,
    userContext: WsUserContext
  ): Promise<void> {
    const { chatId } = message;

    // Vérifier que le chat existe et que l'utilisateur a accès
    const chat = await this.chatRepository.findById(chatId);

    if (!chat) {
      this.wsService.sendError(ws, 'Chat not found');
      return;
    }

    // Vérifier l'accès au chat
    if (!chat.hasAccess(userContext.userId, userContext.userRole)) {
      this.wsService.sendError(ws, 'Unauthorized access to this chat');
      return;
    }

    // Ajouter l'utilisateur à la room
    this.wsService.joinRoom(chatId, ws);

    // Confirmer au client qu'il a rejoint la room
    this.wsService.sendToClient(ws, {
      type: 'join',
      chatId,
      payload: {
        chatId,
        userId: userContext.userId,
        success: true,
      },
    });
  }

  // Gère l'événement 'typing' - Un utilisateur est en train de taper
  private async handleTyping(
    ws: WebSocket,
    message: TypingMessage,
    userContext: WsUserContext
  ): Promise<void> {
    const { chatId, payload } = message;

    // Valider via le use case
    const result = await this.setTypingStatusUseCase.execute({
      chatId,
      userId: userContext.userId,
      userRole: userContext.userRole,
      isTyping: payload.isTyping,
    });

    if (!result.success) {
      this.wsService.sendError(ws, result.error || 'Failed to set typing status');
      return;
    }

    // Broadcaster à tous les autres utilisateurs de la room
    this.wsService.broadcastToRoom(
      chatId,
      {
        type: 'typing',
        chatId,
        payload: {
          userId: userContext.userId,
          userName: userContext.userName,
          isTyping: payload.isTyping,
        },
      },
      ws
    );
  }

  // Gère l'événement 'message:new' - Un nouveau message est envoyé
  private async handleNewMessage(
    ws: WebSocket,
    message: NewMessageMessage,
    userContext: WsUserContext
  ): Promise<void> {
    const { chatId, payload } = message;

    // Préparer la requête pour le use case
    const request: any = {
      chatId,
      authorId: userContext.userId,
      content: payload.content,
    };

    // Ajouter attachmentUrl seulement s'il existe
    if (payload.attachmentUrl) {
      request.attachmentUrl = payload.attachmentUrl;
    }

    // Exécuter le use case
    const result = await this.sendMessageUseCase.execute(request);

    if (!result.success) {
      this.wsService.sendError(ws, result.error || 'Failed to send message');
      return;
    }

    // Récupérer le nom de l'auteur via UserViewRepository
    const authorName = await this.userViewRepository.getFullNameById(userContext.userId) || userContext.userName;

    // Si c'est la première réponse d'un advisor, broadcaster l'assignation
    if (result.isFirstAdvisorResponse) {
      this.wsService.broadcastToRole('ADVISOR', {
        type: 'chat:updated',
        payload: {
          chatId,
          advisorId: userContext.userId,
          advisorName: authorName,
        }
      });

      // Broadcaster aussi au client concerné
      const chat = await this.chatRepository.findById(chatId);
      if (chat && chat.clientId) {
        this.wsService.broadcastToUser(chat.clientId, {
          type: 'chat:updated',
          payload: {
            chatId,
            advisorId: userContext.userId,
            advisorName: authorName,
          }
        });
      }

      console.log(
        `[ChatController] Chat ${chatId} assigned to advisor ${userContext.userId} (${authorName})`
      );
    }

    // ✅ Le Use Case gère maintenant TOUTES les notifications directement via ChatNotificationService
    // Le Controller ne doit PAS renvoyer de notification pour éviter les doublons

    console.log(
      `[ChatController] New message in chat ${chatId} from ${userContext.userId}`
    );
  }

  // Gère l'événement 'message:read' - Un utilisateur marque des messages comme lus
  private async handleMessageRead(
    ws: WebSocket,
    message: MessageReadMessage,
    userContext: WsUserContext
  ): Promise<void> {
    const { chatId, payload } = message;

    // Exécuter le use case
    const result = await this.markAsReadUseCase.execute({
      messageIds: payload.messageIds,
      userId: userContext.userId,
      userRole: userContext.userRole,
    });

    if (!result.success) {
      this.wsService.sendError(ws, result.error || 'Failed to mark messages as read');
      return;
    }

    if (result.markedCount && result.markedCount > 0) {
      // Broadcaster à tous les utilisateurs de la room
      this.wsService.sendToRoom(chatId, {
        type: 'message:read',
        chatId,
        payload: {
          messageIds: payload.messageIds,
          userId: userContext.userId,
          readAt: new Date().toISOString(),
        },
      });

      console.log(
        `[ChatController] User ${userContext.userId} marked ${result.markedCount} messages as read in chat ${chatId}`
      );
    }
  }
}
