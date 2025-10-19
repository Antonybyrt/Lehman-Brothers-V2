/**
 * Hook pour gérer les handlers de messages du chat
 * - Réception de nouveaux messages
 * - Statut de saisie (typing)
 * - Confirmation de lecture
 * - Envoi de messages
 * - Gestion des erreurs
 */

import { useState, useRef } from 'react'
import { DisplayMessage } from '@/types/chat'
import { MessageCreatedPayload, UserTypingPayload } from '@/hooks/chat/useChatSocket'

interface UseChatHandlersProps {
  userId: string | null
  markAsRead: (messageIds: string[]) => void
  sendMessage: (content: string) => void
  setTyping: (isTyping: boolean) => void
}

interface UseChatHandlersReturn {
  messages: DisplayMessage[]
  setMessages: React.Dispatch<React.SetStateAction<DisplayMessage[]>>
  inputValue: string
  setInputValue: React.Dispatch<React.SetStateAction<string>>
  typingUsers: Set<string>
  handleNewMessage: (payload: MessageCreatedPayload) => void
  handleTypingStatus: (payload: UserTypingPayload) => void
  handleMessageRead: (payload: { messageIds: string[]; userId: string; readAt: string }) => void
  handleError: (error: string) => void
  handleSendMessage: () => void
  handleInputChange: (value: string) => void
}

export function useChatHandlers({
  userId,
  markAsRead,
  sendMessage,
  setTyping,
}: UseChatHandlersProps): UseChatHandlersReturn {
  const [messages, setMessages] = useState<DisplayMessage[]>([])
  const [inputValue, setInputValue] = useState('')
  const [typingUsers, setTypingUsers] = useState<Set<string>>(new Set())
  const typingTimeoutRef = useRef<NodeJS.Timeout | null>(null)

  /**
   * Gère la réception d'un nouveau message
   */
  function handleNewMessage(payload: MessageCreatedPayload) {
    if (!userId) return

    const newMessage: DisplayMessage = {
      id: payload.messageId,
      authorId: payload.authorId,
      authorName: payload.authorName,
      content: payload.content,
      sentAt: new Date(payload.sentAt),
      isRead: false,
    }

    setMessages((prev) => [...prev, newMessage])

    // Si ce n'est pas notre message, le marquer comme lu automatiquement
    if (payload.authorId !== userId) {
      setTimeout(() => {
        markAsRead([payload.messageId])
      }, 1000)
    }
  }

  /**
   * Gère le statut de saisie
   */
  function handleTypingStatus(payload: UserTypingPayload) {
    if (!userId || payload.userId === userId) return

    setTypingUsers((prev) => {
      const newSet = new Set(prev)
      if (payload.isTyping) {
        newSet.add(payload.userName)
      } else {
        newSet.delete(payload.userName)
      }
      return newSet
    })
  }

  /**
   * Gère la confirmation de lecture
   */
  function handleMessageRead(payload: { messageIds: string[]; userId: string; readAt: string }) {
    setMessages((prev) =>
      prev.map((msg) =>
        payload.messageIds.includes(msg.id) ? { ...msg, isRead: true } : msg
      )
    )
  }

  /**
   * Gère les erreurs
   */
  function handleError(error: string) {
    console.error('[Chat] Error:', error)
  }

  /**
   * Envoie un message
   */
  function handleSendMessage() {
    if (!inputValue.trim()) return

    sendMessage(inputValue)
    setInputValue('')
    setTyping(false)
  }

  /**
   * Gère la frappe dans l'input
   */
  function handleInputChange(value: string) {
    setInputValue(value)

    setTyping(true)

    if (typingTimeoutRef.current) {
      clearTimeout(typingTimeoutRef.current)
    }

    typingTimeoutRef.current = setTimeout(() => {
      setTyping(false)
    }, 3000)
  }

  return {
    messages,
    setMessages,
    inputValue,
    setInputValue,
    typingUsers,
    handleNewMessage,
    handleTypingStatus,
    handleMessageRead,
    handleError,
    handleSendMessage,
    handleInputChange,
  }
}
