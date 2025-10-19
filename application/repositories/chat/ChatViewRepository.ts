import { Chat } from '@lehman-brothers/domain';

/**
 * Interface pour représenter un chat enrichi avec les noms complets
 * Utilisé pour les vues/réponses API
 */
export interface ChatView {
  id: string;
  subject: string;
  clientId: string;
  clientName: string;
  advisorId: string | null;
  advisorName: string | null;
  status: string;
  createdAt: Date;
  updatedAt: Date;
}

/**
 * Repository pour obtenir des vues enrichies de chats
 * Sépare la responsabilité d'enrichissement de données de la logique métier
 */
export interface ChatViewRepository {
  /**
   * Récupère un chat avec les noms complets enrichis
   */
  findByIdWithNames(chatId: string): Promise<ChatView | null>;

  /**
   * Convertit un chat en vue enrichie avec les noms
   */
  toView(chat: Chat): Promise<ChatView>;
}
