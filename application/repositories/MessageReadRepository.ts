import { MessageRead } from '@lehman-brothers/domain';

export interface MessageReadRepository {
  /**
   * Sauvegarde un statut de lecture
   */
  save(messageRead: MessageRead): Promise<void>;

  /**
   * Trouve tous les statuts de lecture pour un message
   */
  findByMessageId(messageId: string): Promise<MessageRead[]>;

  /**
   * Trouve tous les messages lus par un utilisateur dans un chat
   */
  findByUserIdAndChatId(userId: string, chatId: string): Promise<MessageRead[]>;

  /**
   * Vérifie si un message a été lu par un utilisateur
   */
  hasRead(messageId: string, userId: string): Promise<boolean>;

  /**
   * Marque plusieurs messages comme lus par un utilisateur
   */
  markMultipleAsRead(messageIds: string[], userId: string): Promise<void>;
}
