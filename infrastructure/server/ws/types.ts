/**
 * Types pour le protocole WebSocket du chat
 * Tous les messages utilisent le format JSON avec un type et un payload
 */

// Types d'événements WebSocket
export type WsEventType = 'join' | 'typing' | 'message:new' | 'message:read' | 'message:created' | 'chat:created' | 'chat:updated' | 'chat:closed' | 'error' | 'pong';

// Message de base WebSocket
export interface WsMessage<T = any> {
  type: WsEventType;
  chatId?: string;
  payload?: T;
}

// ============ Événements Client -> Serveur ============

/**
 * Client rejoint un chat
 */
export interface JoinChatPayload {
  chatId: string;
}

export interface JoinChatMessage extends WsMessage<JoinChatPayload> {
  type: 'join';
  chatId: string;
}

/**
 * Client envoie un statut de saisie
 */
export interface TypingPayload {
  isTyping: boolean;
  userId: string;
  userName: string;
}

export interface TypingMessage extends WsMessage<TypingPayload> {
  type: 'typing';
  chatId: string;
  payload: TypingPayload;
}

/**
 * Client envoie un nouveau message
 */
export interface NewMessagePayload {
  content: string;
  attachmentUrl?: string;
}

export interface NewMessageMessage extends WsMessage<NewMessagePayload> {
  type: 'message:new';
  chatId: string;
  payload: NewMessagePayload;
}

/**
 * Client marque des messages comme lus
 */
export interface MessageReadPayload {
  messageIds: string[];
}

export interface MessageReadMessage extends WsMessage<MessageReadPayload> {
  type: 'message:read';
  chatId: string;
  payload: MessageReadPayload;
}

// ============ Événements Serveur -> Client ============

/**
 * Serveur confirme qu'un utilisateur rejoint le chat
 */
export interface JoinedChatPayload {
  chatId: string;
  userId: string;
  success: boolean;
}

/**
 * Serveur broadcast qu'un utilisateur tape
 */
export interface UserTypingPayload {
  userId: string;
  userName: string;
  isTyping: boolean;
}

/**
 * Serveur broadcast un nouveau message
 */
export interface MessageCreatedPayload {
  messageId: string;
  chatId: string;
  authorId: string;
  authorName: string;
  content: string;
  attachmentUrl: string | null;
  sentAt: string; // ISO date string
  isFirstAdvisorResponse?: boolean;
}

/**
 * Serveur broadcast qu'un message a été lu
 */
export interface MessageReadBroadcastPayload {
  messageIds: string[];
  userId: string;
  readAt: string; // ISO date string
}

/**
 * Serveur envoie une erreur
 */
export interface ErrorPayload {
  message: string;
}

/**
 * Pong en réponse au ping
 */
export interface PongMessage extends WsMessage {
  type: 'pong';
}

/**
 * Serveur notifie les advisors qu'un nouveau chat a été créé
 */
export interface ChatCreatedPayload {
  chatId: string;
  subject: string;
  clientId: string;
  clientName?: string | undefined;
  status: string;
  createdAt: string;
}

/**
 * Serveur notifie qu'un chat a été mis à jour (advisor assigné, transféré, ou status changé)
 */
export interface ChatUpdatedPayload {
  chatId: string;
  advisorId?: string | null | undefined;
  advisorName?: string | null | undefined;
  status?: string;
}

/**
 * Ping/Pong pour keep-alive
 */
export interface PongMessage extends WsMessage {
  type: 'pong';
}

// ============ Types utilitaires ============

/**
 * Union de tous les messages client -> serveur
 */
export type ClientMessage =
  | JoinChatMessage
  | TypingMessage
  | NewMessageMessage
  | MessageReadMessage;

/**
 * Union de tous les messages serveur -> client
 */
export type ServerMessage = WsMessage<
  | JoinedChatPayload
  | UserTypingPayload
  | MessageCreatedPayload
  | MessageReadBroadcastPayload
  | ChatCreatedPayload
  | ChatUpdatedPayload
  | ErrorPayload
  | undefined
>;

/**
 * Données utilisateur extraites du token JWT
 */
export interface WsUserContext {
  userId: string;
  userName: string;
  userRole: string;
}
