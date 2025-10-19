/**
 * Service d'abstraction pour les notifications de chat en temps réel
 * 
 * Responsabilités (Couche Application) :
 * - Définir le contrat pour envoyer des notifications
 * - Encapsuler la logique de notification sans dépendre de l'implémentation technique
 * 
 * L'implémentation concrète (WebSocket, Server-Sent Events, etc.) 
 * sera dans la couche Infrastructure
 */

export interface ChatNotificationPayload {
  chatId: string;
  subject?: string;
  clientId?: string;
  clientName?: string;
  advisorId?: string;
  advisorName?: string;
  status?: string;
  lastMessage?: {
    id: string;
    content: string;
    authorId: string;
    authorName: string;
    createdAt: string;
  };
}

export interface MessageNotificationPayload {
  chatId: string;
  message: {
    id: string;
    content: string;
    authorId: string;
    authorName: string;
    createdAt: string;
  };
}

export interface ChatNotificationService {
  /**
   * Notifie un utilisateur spécifique
   */
  notifyUser(userId: string, type: string, payload: unknown): Promise<void>;

  /**
   * Notifie tous les utilisateurs d'un rôle spécifique
   */
  notifyRole(role: string, type: string, payload: unknown): Promise<void>;

  /**
   * Notifie tous les participants d'un chat
   */
  notifyChat(chatId: string, type: string, payload: unknown): Promise<void>;

  /**
   * Notifie tous les participants d'un chat sauf l'émetteur
   */
  notifyChatExcept(chatId: string, userId: string, type: string, payload: unknown): Promise<void>;
}
