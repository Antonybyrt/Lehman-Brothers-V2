// Types partagés pour le système de chat

/**
 * Statut d'une conversation
 */
export type ChatStatus = 'OPEN' | 'CLOSED'

/**
 * Type d'onglet pour filtrer les chats
 */
export type ChatTab = 'OPEN' | 'CLOSED'

/**
 *  Priority level of a chat
 */
export type ChatPriority = 'LOW' | 'MEDIUM' | 'HIGH'

/**
 * Statut de connexion WebSocket
 */
export type ConnectionStatus = 'connecting' | 'connected' | 'disconnected' | 'error'

/**
 * Interface principale d'un chat
 */
export interface Chat {
  id: string
  subject: string
  clientId: string
  clientName?: string
  advisorId: string | null
  advisorName?: string
  status: ChatStatus
  priority?: ChatPriority
  createdAt: string
  updatedAt: string
  lastMessage?: string
  lastMessageAt?: string
  lastMessageAuthorId?: string
}

/**
 * Interface d'un message de chat (format API)
 */
export interface ChatMessage {
  id: string
  chatId: string
  authorId: string
  authorName: string
  content: string
  attachmentUrl: string | null
  sentAt: string
  editedAt: string | null
  deletedAt: string | null
  isRead: boolean
}

/**
 * Interface d'un message affiché dans l'UI
 * Version simplifiée avec Date au lieu de string
 */
export interface DisplayMessage {
  id: string
  authorId: string
  authorName: string
  content: string
  sentAt: Date
  isRead: boolean
}

export interface ChatFilters {
  activeTab: ChatTab
}

export interface ChatUser {
  id: string
  role: string
  token: string
}

export interface ScrollState {
  hasMore: boolean
  isLoading: boolean
}
