import { Chat } from '@lehman-brothers/domain';

export interface ChatRepository {
  /**
   * Sauvegarde ou met à jour un chat
   */
  save(chat: Chat): Promise<void>;

  /**
   * Trouve un chat par son ID
   */
  findById(id: string): Promise<Chat | null>;

  /**
   * Trouve tous les chats d'un client
   */
  findByClientId(clientId: string): Promise<Chat[]>;

  /**
   * Trouve tous les chats assignés à un conseiller
   */
  findByAdvisorId(advisorId: string): Promise<Chat[]>;

  /**
   * Trouve tous les chats sans conseiller assigné (ouverts à tous les conseillers)
   */
  findUnassigned(): Promise<Chat[]>;

  /**
   * Supprime un chat (hard delete)
   */
  delete(id: string): Promise<void>;
}
