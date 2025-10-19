/**
 * Hook pour gérer le chargement et la pagination des messages
 * - Chargement initial des messages
 * - Chargement de messages plus anciens (infinite scroll)
 * - Gestion du scroll et de la position
 */

import { useState, useRef, useCallback, useEffect } from 'react'
import { chatService } from '@/services/chatService'
import { DisplayMessage } from '@/types/chat'
import toast from 'react-hot-toast'

interface UseChatMessagesProps {
  selectedChatId: string | null
  token: string | null
  userId: string | null
  messages: DisplayMessage[]
  setMessages: React.Dispatch<React.SetStateAction<DisplayMessage[]>>
  markAsRead: (messageIds: string[]) => void
}

interface UseChatMessagesReturn {
  loadingMessages: boolean
  hasMoreMessages: boolean
  loadingMoreMessages: boolean
  messagesContainerRef: React.RefObject<HTMLDivElement | null>
  messagesEndRef: React.RefObject<HTMLDivElement | null>
  loadMessages: (chatId: string, reset?: boolean) => Promise<void>
  loadMoreMessages: () => Promise<void>
}

export function useChatMessages({
  selectedChatId,
  token,
  userId,
  messages,
  setMessages,
  markAsRead,
}: UseChatMessagesProps): UseChatMessagesReturn {
  const [loadingMessages, setLoadingMessages] = useState(false)
  const [hasMoreMessages, setHasMoreMessages] = useState(true)
  const [loadingMoreMessages, setLoadingMoreMessages] = useState(false)

  const messagesContainerRef = useRef<HTMLDivElement>(null)
  const messagesEndRef = useRef<HTMLDivElement>(null)

  // Charge les messages d'un chat
  const loadMessages = async (chatId: string, reset: boolean = true) => {
    if (!token || !userId) return

    setLoadingMessages(true)
    try {
      chatService.setAuthToken(token)
      const response = await chatService.getChatMessages(chatId, { limit: 50 })

      if (response.success && response.messages) {
        const displayMessages: DisplayMessage[] = response.messages.map(msg => ({
          id: msg.id,
          authorId: msg.authorId,
          authorName: msg.authorName,
          content: msg.content,
          sentAt: new Date(msg.sentAt),
          isRead: msg.isRead,
        }))

        // Inverser l'ordre pour afficher les plus anciens en haut et les plus récents en bas
        const reversedMessages = displayMessages.reverse()

        if (reset) {
          setMessages(reversedMessages)

          // Scroller vers le bas après le chargement initial
          setTimeout(() => {
            const container = messagesContainerRef.current
            if (container) {
              container.scrollTop = container.scrollHeight
            }
          }, 100)
        }

        // Mettre à jour hasMoreMessages en fonction de la réponse
        setHasMoreMessages(response.hasMore || false)

        // Marquer tous les messages NON LUS qui ne sont pas de l'utilisateur comme lus
        const messagesToMarkAsRead = reversedMessages
          .filter(msg => msg.authorId !== userId && !msg.isRead)
          .map(msg => msg.id)

        if (messagesToMarkAsRead.length > 0) {
          // Attendre un peu pour s'assurer que le WebSocket est connecté
          setTimeout(() => {
            markAsRead(messagesToMarkAsRead)
          }, 1000)
        }
      } else {
        toast.error(response.error || 'Failed to load messages')
      }
    } catch (error) {
      console.error('Error loading messages:', error)
      toast.error('Failed to load messages')
    } finally {
      setLoadingMessages(false)
    }
  }

  // Charge plus de messages (messages plus anciens)
  const loadMoreMessages = useCallback(async () => {
    if (!selectedChatId || !token || !userId || !hasMoreMessages || loadingMoreMessages) {
      return
    }

    // Récupérer l'ID du message le plus ancien
    const oldestMessageId = messages.length > 0 ? messages[0].id : undefined
    if (!oldestMessageId) return

    setLoadingMoreMessages(true)

    // Sauvegarder la hauteur du scroll avant le chargement
    const container = messagesContainerRef.current
    const previousScrollHeight = container?.scrollHeight || 0

    try {
      chatService.setAuthToken(token)
      const response = await chatService.getChatMessages(selectedChatId, {
        limit: 30,
        beforeId: oldestMessageId
      })

      if (response.success && response.messages) {
        const displayMessages: DisplayMessage[] = response.messages.map(msg => ({
          id: msg.id,
          authorId: msg.authorId,
          authorName: msg.authorName,
          content: msg.content,
          sentAt: new Date(msg.sentAt),
          isRead: msg.isRead,
        }))

        // Inverser l'ordre pour afficher les plus anciens en haut
        const reversedMessages = displayMessages.reverse()

        // Filtrer les doublons (vérifier que les IDs ne sont pas déjà présents)
        setMessages(prev => {
          const existingIds = new Set(prev.map(m => m.id))
          const newMessages = reversedMessages.filter(m => !existingIds.has(m.id))
          return [...newMessages, ...prev]
        })

        // Mettre à jour hasMoreMessages
        setHasMoreMessages(response.hasMore || false)

        // Restaurer la position du scroll après le chargement
        setTimeout(() => {
          if (container) {
            const newScrollHeight = container.scrollHeight
            container.scrollTop = newScrollHeight - previousScrollHeight
          }
        }, 0)
      }
    } catch (error) {
      console.error('Error loading more messages:', error)
      toast.error('Failed to load more messages')
    } finally {
      setLoadingMoreMessages(false)
    }
  }, [selectedChatId, token, userId, hasMoreMessages, loadingMoreMessages, messages, setMessages])

  // Gestionnaire de scroll pour charger plus de messages
  useEffect(() => {
    const container = messagesContainerRef.current
    if (!container) return

    const handleScroll = () => {
      // Si on est en haut (scrollTop proche de 0) et qu'il y a plus de messages
      if (container.scrollTop < 100 && hasMoreMessages && !loadingMoreMessages) {
        loadMoreMessages()
      }
    }

    container.addEventListener('scroll', handleScroll)
    return () => container.removeEventListener('scroll', handleScroll)
  }, [hasMoreMessages, loadingMoreMessages, loadMoreMessages])

  // Scroll vers le bas uniquement si l'utilisateur est déjà en bas
  useEffect(() => {
    const container = messagesContainerRef.current
    if (!container) return

    // Vérifier si l'utilisateur est proche du bas (dans les 150px du bas)
    const isNearBottom = container.scrollHeight - container.scrollTop - container.clientHeight < 150

    // Scroller uniquement si l'utilisateur est déjà en bas
    if (isNearBottom) {
      messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
    }
  }, [messages])

  return {
    loadingMessages,
    hasMoreMessages,
    loadingMoreMessages,
    messagesContainerRef,
    messagesEndRef,
    loadMessages,
    loadMoreMessages,
  }
}
