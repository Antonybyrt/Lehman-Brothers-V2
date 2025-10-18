import { Message } from '@lehman-brothers/domain';

export interface MessageRepository {
  /**
   * Sauvegarde ou met à jour un message
   */
  save(message: Message): Promise<void>;

  /**
   * Trouve un message par son ID
   */
  findById(id: string): Promise<Message | null>;

  /**
   * Trouve tous les messages d'un chat
   * @param chatId - L'ID du chat
   * @param limit - Nombre maximum de messages à retourner
   * @param beforeId - Retourne les messages envoyés avant ce message ID (pagination)
   */
  findByChatId(
    chatId: string,
    limit?: number,
    beforeId?: string
  ): Promise<Message[]>;

  /**
   * Compte le nombre de messages dans un chat
   */
  countByChatId(chatId: string): Promise<number>;

  /**
   * Supprime un message (hard delete)
   */
  delete(id: string): Promise<void>;
}
