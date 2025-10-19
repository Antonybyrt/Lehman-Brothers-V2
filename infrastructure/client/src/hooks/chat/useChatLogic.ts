/**
 * Hook centralisé pour la logique du chat
 * 
 * Encapsule toute la logique métier et les états du chat,
 * retourne des objets structurés pour chaque composant enfant.
 * 
 * Avantages:
 * - Réduit le props drilling
 * - Centralise la logique
 * - Facilite les tests
 * - Pas de re-render en cascade (contrairement à Context)
 */

import { useState, useEffect, useRef, useCallback, useMemo } from 'react'
import { chatService } from '@/services/chatService'
import { useChatSocket } from '@/hooks/chat/useChatSocket'
import { useGlobalChatEvents } from '@/hooks/chat/useGlobalChatEvents'
import { useChatMessages } from '@/hooks/chat/useChatMessages'
import { Chat, DisplayMessage, ChatTab } from '@/types/chat'
import { useAuth } from '@/hooks/useAuth'
import toast from 'react-hot-toast'

export function useChatLogic() {
  // ========== Utiliser le contexte d'authentification ==========
  const { userId, userRole, token, isLoading, error } = useAuth()

  // ========== État des chats ==========
  const [chats, setChats] = useState<Chat[]>([])
  const [selectedChatId, setSelectedChatId] = useState<string | null>(null)
  const [loadingChats, setLoadingChats] = useState(true)
  const [activeTab, setActiveTab] = useState<ChatTab>('OPEN')

  // ========== État des messages ==========
  const [messages, setMessages] = useState<DisplayMessage[]>([])
  const [inputValue, setInputValue] = useState('')
  const [typingUsers, setTypingUsers] = useState<Set<string>>(new Set())

  // ========== État des dialogs ==========
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false)
  const [isTransferDialogOpen, setIsTransferDialogOpen] = useState(false)

  // ========== Refs ==========
  const typingTimeoutRef = useRef<NodeJS.Timeout | null>(null)
  const markAsReadRef = useRef<((messageIds: string[]) => void) | null>(null)
  const loadMessagesRef = useRef<((chatId: string) => Promise<void>) | null>(null)

  // ========== Valeurs calculées ==========
  const selectedChat = chats.find(c => c.id === selectedChatId)
  const otherPersonName = selectedChat
    ? (selectedChat.clientId === userId ? selectedChat.advisorName || 'Unassigned' : selectedChat.clientName || 'Client')
    : null

  // ========== Handlers WebSocket ==========
  const handleNewMessage = useCallback((payload: {
    chatId: string
    message: {
      id: string
      content: string
      authorId: string
      authorName: string
      createdAt: string
    }
  }) => {
    if (!userId) return

    const newMessage: DisplayMessage = {
      id: payload.message.id,
      authorId: payload.message.authorId,
      authorName: payload.message.authorName,
      content: payload.message.content,
      sentAt: new Date(payload.message.createdAt),
      isRead: false,
    }
    setMessages((prev) => [...prev, newMessage])
    // Marque comme lu après un court délai si ce n'est pas notre message
    if (payload.message.authorId !== userId && markAsReadRef.current) {
      setTimeout(() => {
        markAsReadRef.current?.([payload.message.id])
      }, 1000)
    }
  }, [userId])

  const handleTypingStatus = useCallback((payload: {
    userId: string
    userName: string
    isTyping: boolean
  }) => {
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
  }, [userId])

  const handleMessageRead = useCallback((payload: {
    messageIds: string[]
    userId: string
    readAt: string
  }) => {
    setMessages((prev) =>
      prev.map((msg) =>
        payload.messageIds.includes(msg.id) ? { ...msg, isRead: true } : msg
      )
    )
  }, [])

  const handleError = useCallback((error: string) => {
    console.error('[Chat] Error:', error)
  }, [])

  // ========== Hook WebSocket ==========
  const { status, sendMessage, setTyping, markAsRead, reconnect } = useChatSocket({
    chatId: (selectedChatId && selectedChat?.status === 'OPEN') ? selectedChatId : '',
    token: token || '',
    onMessage: handleNewMessage,
    onTyping: handleTypingStatus,
    onMessageRead: handleMessageRead,
    onError: handleError,
    autoReconnect: true,
  })

  // Met à jour les refs pour éviter les dépendances circulaires
  useEffect(() => {
    markAsReadRef.current = markAsRead
  }, [markAsRead])

  // ========== Hook pour les messages ==========
  const {
    loadingMessages,
    hasMoreMessages,
    loadingMoreMessages,
    messagesContainerRef,
    messagesEndRef,
    loadMessages,
  } = useChatMessages({
    selectedChatId,
    token,
    userId,
    messages,
    setMessages,
    markAsRead,
  })

  // Mise à jour de la ref après que loadMessages soit disponible
  useEffect(() => {
    loadMessagesRef.current = loadMessages
  }, [loadMessages])

  // ========== Hook pour les notifications globales ==========
  useGlobalChatEvents({
    token,
    userId,
    userRole,
    onChatsUpdate: setChats,
  })

  // ========== Chargement des chats ==========
  const loadChats = useCallback(async () => {
    if (!token) return

    setLoadingChats(true)
    try {
      chatService.setAuthToken(token)
      const response = await chatService.getUserChats()

      if (response.success && response.chats) {
        const sortedChats = response.chats.sort((a, b) =>
          new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
        )
        setChats(sortedChats)

        // Sélectionne le premier chat uniquement si aucun chat n'est sélectionné
        // et évite la dépendance circulaire
        setSelectedChatId(prevId => {
          if (!prevId && sortedChats.length > 0) {
            return sortedChats[0].id
          }
          return prevId
        })
      } else {
        toast.error(response.error || 'Failed to load chats')
      }
    } catch (error) {
      console.error('Error loading chats:', error)
      toast.error('Failed to load chats')
    } finally {
      setLoadingChats(false)
    }
  }, [token])

  // ========== Actions de chat ==========
  const handleSelectChat = useCallback((chatId: string) => {
    if (chatId === selectedChatId) return
    setSelectedChatId(chatId)
    setMessages([])
  }, [selectedChatId])

  const handleChatCreated = useCallback((chatId: string) => {
    loadChats().then(() => {
      setSelectedChatId(chatId)
    })
  }, [loadChats])

  const handleCloseChat = useCallback(async () => {
    if (!selectedChatId || !token) return

    try {
      chatService.setAuthToken(token)
      const response = await chatService.closeChat(selectedChatId)

      if (response.success) {
        toast.success('Chat closed successfully')
        loadChats()
      } else {
        toast.error(response.error || 'Failed to close chat')
      }
    } catch (error) {
      console.error('Error closing chat:', error)
      toast.error('Failed to close chat')
    }
  }, [selectedChatId, token, loadChats])

  const handleTransferChat = useCallback(async (newAdvisorId: string) => {
    if (!selectedChatId || !token) return

    try {
      chatService.setAuthToken(token)
      const response = await chatService.transferChat(selectedChatId, newAdvisorId)

      if (response.success) {
        toast.success('Chat transferred successfully')
      } else {
        toast.error(response.error || 'Failed to transfer chat')
      }
    } catch (error) {
      console.error('Error transferring chat:', error)
      toast.error('Failed to transfer chat')
    }
  }, [selectedChatId, token])

  // ========== Actions de messages ==========
  const handleSendMessage = useCallback(() => {
    if (!inputValue.trim()) return
    sendMessage(inputValue)
    setInputValue('')
    setTyping(false)

    if (typingTimeoutRef.current) {
      clearTimeout(typingTimeoutRef.current)
    }
  }, [inputValue, sendMessage, setTyping])

  const handleInputChange = useCallback((value: string) => {
    setInputValue(value)
    setTyping(true)

    if (typingTimeoutRef.current) {
      clearTimeout(typingTimeoutRef.current)
    }

    typingTimeoutRef.current = setTimeout(() => {
      setTyping(false)
    }, 3000)
  }, [setTyping])

  // ========== Effets ==========
  // Charge les chats une seule fois au montage
  const hasLoadedChatsRef = useRef(false)
  useEffect(() => {
    if (token && userId && !hasLoadedChatsRef.current) {
      hasLoadedChatsRef.current = true
      loadChats()
    }
  }, [token, userId, loadChats])

  useEffect(() => {
    if (selectedChatId && token && userId && loadMessagesRef.current) {
      loadMessagesRef.current(selectedChatId)
    }
  }, [selectedChatId, token, userId])

  useEffect(() => {
    if (selectedChatId && !selectedChat) {
      setSelectedChatId(null)
      setMessages([])
    }
  }, [selectedChatId, selectedChat])

  useEffect(() => {
    return () => {
      if (typingTimeoutRef.current) {
        clearTimeout(typingTimeoutRef.current)
      }
    }
  }, [])

  // ========== Callbacks stables pour les dialogs ==========
  const handleCreateDialogOpen = useCallback(() => setIsCreateDialogOpen(true), [])
  const handleCreateDialogClose = useCallback(() => setIsCreateDialogOpen(false), [])
  const handleTransferDialogOpen = useCallback(() => setIsTransferDialogOpen(true), [])
  const handleTransferDialogClose = useCallback(() => setIsTransferDialogOpen(false), [])

  // ========== Retour des props structurées avec useMemo ==========
  return useMemo(() => ({
    // Props pour la racine
    root: {
      isLoading,
      error,
      userId,
      token,
    },

    // Props pour le sidebar
    sidebar: {
      chats,
      selectedChatId,
      activeTab,
      loadingChats,
      onSelectChat: handleSelectChat,
      onCreateChat: handleCreateDialogOpen,
      onTabChange: setActiveTab,
    },

    // Props pour le header
    header: {
      chat: selectedChat,
      otherPersonName,
      status,
      userRole,
      userId,
      onTransferClick: handleTransferDialogOpen,
      onCloseClick: handleCloseChat,
      onReconnect: reconnect,
    },

    // Props pour la liste de messages
    messageList: {
      messages,
      userId,
      loadingMessages,
      loadingMoreMessages,
      hasMoreMessages,
      typingUsers,
      messagesContainerRef,
      messagesEndRef,
    },

    // Props pour l'input
    input: {
      inputValue,
      status,
      isChatClosed: selectedChat?.status === 'CLOSED',
      onInputChange: handleInputChange,
      onSendMessage: handleSendMessage,
    },

    // Props pour les dialogs
    dialogs: {
      create: {
        isOpen: isCreateDialogOpen,
        onClose: handleCreateDialogClose,
        onChatCreated: handleChatCreated,
        userRole,
      },
      transfer: {
        isOpen: isTransferDialogOpen,
        onClose: handleTransferDialogClose,
        onTransfer: handleTransferChat,
        currentAdvisorId: selectedChat?.advisorId || undefined,
      },
    },

    // État du chat sélectionné
    selected: {
      chat: selectedChat,
      chatId: selectedChatId,
    },
  }), [
    isLoading,
    error,
    userId,
    token,
    chats,
    selectedChatId,
    activeTab,
    loadingChats,
    handleSelectChat,
    handleCreateDialogOpen,
    setActiveTab,
    selectedChat,
    otherPersonName,
    status,
    userRole,
    handleTransferDialogOpen,
    handleCloseChat,
    reconnect,
    messages,
    loadingMessages,
    loadingMoreMessages,
    hasMoreMessages,
    typingUsers,
    messagesContainerRef,
    messagesEndRef,
    inputValue,
    handleInputChange,
    handleSendMessage,
    isCreateDialogOpen,
    handleCreateDialogClose,
    handleChatCreated,
    isTransferDialogOpen,
    handleTransferDialogClose,
    handleTransferChat,
  ])
}
