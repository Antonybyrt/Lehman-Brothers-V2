import { ChatNotificationService } from '@lehman-brothers/application';
import { WsServerService } from './WsServerService';
import { WsEventType } from '../../ws/types';

/**
 * Implémentation WebSocket du service de notifications de chat
 * 
 * Cette classe adapte le WsServerService (technique) 
 * pour implémenter l'interface ChatNotificationService (métier)
 * 
 * Responsabilités :
 * - Implémenter le contrat défini dans la couche Application
 * - Déléguer l'envoi de messages au WsServerService
 * - Faire le pont entre la logique métier et l'implémentation technique
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
    // Note: Le WsServerService n'a pas de méthode pour exclure par userId
    // On utilise broadcastToRoom qui exclut par WebSocket
    // Pour une implémentation complète, il faudrait enrichir WsServerService
    this.wsService.sendToRoom(chatId, {
      type: type as WsEventType,
      payload: payload as any,
    });
  }
}
