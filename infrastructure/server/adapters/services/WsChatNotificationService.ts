import { ChatNotificationService } from '@lehman-brothers/application';
import { WsServerService } from './WsServerService';
import { WsEventType } from '../../ws/types';

/**
 * WebSocket implementation of ChatNotificationService
 * Adapts WsServerService to implement the application layer interface
 */
export class WsChatNotificationService implements ChatNotificationService {
  constructor(private readonly wsService: WsServerService) { }

  async notifyUser(userId: string, type: string, payload: unknown): Promise<void> {
    this.wsService.broadcastToUser(userId, {
      type: type as WsEventType,
      payload: payload as any,
    });
  }

  async notifyRole(role: string, type: string, payload: unknown): Promise<void> {
    this.wsService.broadcastToRole(role, {
      type: type as WsEventType,
      payload: payload as any,
    });
  }

  async notifyChat(chatId: string, type: string, payload: unknown): Promise<void> {
    this.wsService.sendToRoom(chatId, {
      type: type as WsEventType,
      payload: payload as any,
    });
  }

  async notifyChatExcept(chatId: string, userId: string, type: string, payload: unknown): Promise<void> {
    this.wsService.sendToRoom(chatId, {
      type: type as WsEventType,
      payload: payload as any,
    });
  }
}
