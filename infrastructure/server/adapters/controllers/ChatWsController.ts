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
 * WebSocket controller for chat
 * Routes WS events to use cases and broadcasts responses
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

  private async handleJoin(
    ws: WebSocket,
    message: JoinChatMessage,
    userContext: WsUserContext
  ): Promise<void> {
    const { chatId } = message;

    const chat = await this.chatRepository.findById(chatId);
    if (!chat) {
      this.wsService.sendError(ws, 'Chat not found');
      return;
    }

    if (!chat.hasAccess(userContext.userId, userContext.userRole)) {
      this.wsService.sendError(ws, 'Unauthorized access to this chat');
      return;
    }

    this.wsService.joinRoom(chatId, ws);
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

  private async handleTyping(
    ws: WebSocket,
    message: TypingMessage,
    userContext: WsUserContext
  ): Promise<void> {
    const { chatId, payload } = message;

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

  private async handleNewMessage(
    ws: WebSocket,
    message: NewMessageMessage,
    userContext: WsUserContext
  ): Promise<void> {
    const { chatId, payload } = message;

    const request: any = {
      chatId,
      authorId: userContext.userId,
      content: payload.content,
    };

    if (payload.attachmentUrl) {
      request.attachmentUrl = payload.attachmentUrl;
    }

    const result = await this.sendMessageUseCase.execute(request);
    if (!result.success) {
      this.wsService.sendError(ws, result.error || 'Failed to send message');
      return;
    }

    const authorName = await this.userViewRepository.getFullNameById(userContext.userId) || userContext.userName;

    if (result.isFirstAdvisorResponse) {
      this.wsService.broadcastToRole('ADVISOR', {
        type: 'chat:updated',
        payload: {
          chatId,
          advisorId: userContext.userId,
          advisorName: authorName,
        }
      });

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

      console.log(`[ChatController] Chat ${chatId} assigned to advisor ${userContext.userId} (${authorName})`);
    }
  }

  private async handleMessageRead(
    ws: WebSocket,
    message: MessageReadMessage,
    userContext: WsUserContext
  ): Promise<void> {
    const { chatId, payload } = message;

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
      this.wsService.sendToRoom(chatId, {
        type: 'message:read',
        chatId,
        payload: {
          messageIds: payload.messageIds,
          userId: userContext.userId,
          readAt: new Date().toISOString(),
        },
      });

    }
  }
}
