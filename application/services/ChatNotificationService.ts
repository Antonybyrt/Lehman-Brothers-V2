/**
 * Chat notification service abstraction (Application layer)
 * Defines contract for sending notifications without depending on technical implementation
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
  notifyUser(userId: string, type: string, payload: unknown): Promise<void>;
  notifyRole(role: string, type: string, payload: unknown): Promise<void>;
  notifyChat(chatId: string, type: string, payload: unknown): Promise<void>;
  notifyChatExcept(chatId: string, userId: string, type: string, payload: unknown): Promise<void>;
}
