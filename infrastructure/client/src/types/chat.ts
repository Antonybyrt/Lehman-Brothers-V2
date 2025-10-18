/**
 * Types partagés pour le système de chat
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
  activeTab: 'OPEN' | 'CLOSED'
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
