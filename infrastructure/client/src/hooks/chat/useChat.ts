/**
 * Unified chat hook - manages all chat functionality in one place
 * 
 * Features:
 * - Load and manage chat list with real-time updates
 * - WebSocket connection for selected chat room
 * - Send/receive messages in real-time
 * - Message pagination (infinite scroll)
 * - Typing indicators
 * - Read receipts
 * - Chat actions (create, transfer, close)
 * 
 * Replaces: useChatLogic, useChatSocket, useChatMessages, useGlobalChatEvents
 */

import { useState, useEffect, useRef, useCallback, useMemo } from 'react'
import { chatService } from '@/services/chatService'
import { Chat, DisplayMessage, ChatTab, ChatStatus } from '@/types/chat'
import { useAuth } from '@/hooks/useAuth'
import toast from 'react-hot-toast'

// WebSocket message types
type WsEventType = 'join' | 'typing' | 'message:new' | 'message:created' | 'message:read' | 'chat:created' | 'chat:updated' | 'error'

interface WsMessage<T = unknown> {
  type: WsEventType
  chatId?: string
  payload?: T
}

type ConnectionStatus = 'connecting' | 'connected' | 'disconnected' | 'error'

export function useChat() {
  const { userId, userRole, token, isLoading, error } = useAuth()

  // ========== Chat list state ==========
  const [chats, setChats] = useState<Chat[]>([])
  const [selectedChatId, setSelectedChatId] = useState<string | null>(null)
  const [loadingChats, setLoadingChats] = useState(true)
  const [activeTab, setActiveTab] = useState<ChatTab>('OPEN')

  // ========== Messages state ==========
  const [messages, setMessages] = useState<DisplayMessage[]>([])
  const [loadingMessages, setLoadingMessages] = useState(false)
  const [hasMoreMessages, setHasMoreMessages] = useState(true)
  const [loadingMoreMessages, setLoadingMoreMessages] = useState(false)

  // ========== Input state ==========
  const [inputValue, setInputValue] = useState('')
  const [typingUsers, setTypingUsers] = useState<Set<string>>(new Set())

  // ========== Dialog state ==========
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false)
  const [isTransferDialogOpen, setIsTransferDialogOpen] = useState(false)

  // ========== WebSocket state ==========
  const [wsStatus, setWsStatus] = useState<ConnectionStatus>('disconnected')
  const chatWsRef = useRef<WebSocket | null>(null)
  const globalWsRef = useRef<WebSocket | null>(null)

  // ========== Refs ==========
  const typingTimeoutRef = useRef<NodeJS.Timeout | null>(null)
  const messagesContainerRef = useRef<HTMLDivElement>(null)
  const messagesEndRef = useRef<HTMLDivElement>(null)
  const reconnectTimeoutRef = useRef<NodeJS.Timeout | null>(null)
  const isMountedRef = useRef(true)
  const hasLoadedChatsRef = useRef(false)

  // ========== Computed values ==========
  const selectedChat = chats.find(c => c.id === selectedChatId)
  const otherPersonName = selectedChat
    ? (selectedChat.clientId === userId ? selectedChat.advisorName || 'Unassigned' : selectedChat.clientName || 'Client')
    : null

  // ========== Load chats from API ==========
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

        // Select first chat if none selected
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

  // ========== Load messages for a chat ==========
  const loadMessages = useCallback(async (chatId: string) => {
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

        const reversedMessages = displayMessages.reverse()
        setMessages(reversedMessages)
        setHasMoreMessages(response.hasMore || false)

        // Scroll to bottom
        setTimeout(() => {
          const container = messagesContainerRef.current
          if (container) {
            container.scrollTop = container.scrollHeight
          }
        }, 100)

        // Mark unread messages as read
        const messagesToMarkAsRead = reversedMessages
          .filter(msg => msg.authorId !== userId && !msg.isRead)
          .map(msg => msg.id)

        if (messagesToMarkAsRead.length > 0 && chatWsRef.current?.readyState === WebSocket.OPEN) {
          setTimeout(() => {
            chatWsRef.current?.send(JSON.stringify({
              type: 'message:read',
              chatId,
              payload: { messageIds: messagesToMarkAsRead },
            }))
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
  }, [token, userId])

  // ========== Load more messages (pagination) ==========
  const loadMoreMessages = useCallback(async () => {
    if (!selectedChatId || !token || !userId || !hasMoreMessages || loadingMoreMessages) {
      return
    }

    const oldestMessageId = messages.length > 0 ? messages[0].id : undefined
    if (!oldestMessageId) return

    setLoadingMoreMessages(true)

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

        const reversedMessages = displayMessages.reverse()

        setMessages(prev => {
          const existingIds = new Set(prev.map(m => m.id))
          const newMessages = reversedMessages.filter(m => !existingIds.has(m.id))
          return [...newMessages, ...prev]
        })

        setHasMoreMessages(response.hasMore || false)

        // Restore scroll position
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
  }, [selectedChatId, token, userId, hasMoreMessages, loadingMoreMessages, messages])

  // ========== WebSocket: Connect to chat room ==========
  const connectToChatRoom = useCallback((chatId: string) => {
    if (!token || !chatId) return

    // Close existing connection
    if (chatWsRef.current) {
      chatWsRef.current.close()
      chatWsRef.current = null
    }

    const wsUrl = `${process.env.NEXT_PUBLIC_WS_URL || 'ws://localhost:3000'}?token=${token}`
    const ws = new WebSocket(wsUrl)
    chatWsRef.current = ws

    ws.onopen = () => {
      if (!isMountedRef.current) {
        ws.close()
        return
      }
      console.log('[WS Chat] Connected')
      setWsStatus('connected')

      // Join chat room
      ws.send(JSON.stringify({
        type: 'join',
        chatId,
        payload: { chatId },
      }))
    }

    ws.onmessage = (event) => {
      try {
        const message: WsMessage = JSON.parse(event.data)

        switch (message.type) {
          case 'message:created': {
            const payload = message.payload as {
              chatId: string
              message: {
                id: string
                content: string
                authorId: string
                authorName: string
                createdAt: string
              }
            }
            if (!userId) return

            const newMessage: DisplayMessage = {
              id: payload.message.id,
              authorId: payload.message.authorId,
              authorName: payload.message.authorName,
              content: payload.message.content,
              sentAt: new Date(payload.message.createdAt),
              isRead: false,
            }

            setMessages(prev => [...prev, newMessage])

            // Mark as read if not our message
            if (payload.message.authorId !== userId && ws.readyState === WebSocket.OPEN) {
              setTimeout(() => {
                ws.send(JSON.stringify({
                  type: 'message:read',
                  chatId: payload.chatId,
                  payload: { messageIds: [payload.message.id] },
                }))
              }, 1000)
            }
            break
          }

          case 'typing': {
            const payload = message.payload as {
              userId: string
              userName: string
              isTyping: boolean
            }
            if (!userId || payload.userId === userId) return

            setTypingUsers(prev => {
              const newSet = new Set(prev)
              if (payload.isTyping) {
                newSet.add(payload.userName)
              } else {
                newSet.delete(payload.userName)
              }
              return newSet
            })
            break
          }

          case 'message:read': {
            const payload = message.payload as {
              messageIds: string[]
              userId: string
              readAt: string
            }
            setMessages(prev =>
              prev.map(msg =>
                payload.messageIds.includes(msg.id) ? { ...msg, isRead: true } : msg
              )
            )
            break
          }

          case 'error': {
            console.error('[WS Chat] Server error:', message.payload)
            break
          }

          default:
            console.log('[WS Chat] Unknown message type:', message.type)
        }
      } catch (error) {
        console.error('[WS Chat] Error parsing message:', error)
      }
    }

    ws.onerror = (error) => {
      console.error('[WS Chat] Connection error:', error)
      setWsStatus('error')
    }

    ws.onclose = () => {
      if (!isMountedRef.current) return
      console.log('[WS Chat] Connection closed')
      setWsStatus('disconnected')
    }
  }, [token, userId])

  // ========== WebSocket: Global events (chat updates) ==========
  const connectToGlobalEvents = useCallback(() => {
    if (!token || !userId) return

    const wsUrl = `${process.env.NEXT_PUBLIC_WS_URL || 'ws://localhost:3000'}?token=${token}`
    const ws = new WebSocket(wsUrl)
    globalWsRef.current = ws

    ws.onopen = () => {
      console.log('[WS Global] Connected')
    }

    ws.onmessage = (event) => {
      try {
        const message: WsMessage = JSON.parse(event.data)

        if (message.type === 'chat:created') {
          const payload = message.payload as {
            chatId: string
            subject: string
            clientId: string
            clientName: string
            advisorId?: string
            advisorName?: string
            status: ChatStatus
            createdAt: string
          }
          const newChat: Chat = {
            id: payload.chatId,
            subject: payload.subject,
            clientId: payload.clientId,
            clientName: payload.clientName,
            advisorId: payload.advisorId || null,
            advisorName: payload.advisorName || undefined,
            status: payload.status,
            createdAt: payload.createdAt || new Date().toISOString(),
            updatedAt: payload.createdAt || new Date().toISOString(),
          }

          setChats(prev => [newChat, ...prev])

          if (userRole === 'ADVISOR') {
            toast.success(`New chat created: ${payload.subject}`)
          } else if (userRole === 'CLIENT' && payload.advisorId) {
            toast.success(`${payload.advisorName || 'An advisor'} created a chat: ${payload.subject}`)
          }
        } else if (message.type === 'chat:updated') {
          const payload = message.payload as {
            chatId: string
            advisorId?: string | null
            advisorName?: string
            status?: ChatStatus
            subject?: string
            clientId?: string
            clientName?: string
            createdAt?: string
          }

          if (payload.advisorId !== undefined && userRole === 'ADVISOR') {
            setChats(prev => {
              if (payload.advisorId !== userId) {
                return prev.filter(chat => chat.id !== payload.chatId)
              }

              if (payload.advisorId === userId) {
                const existingChat = prev.find(chat => chat.id === payload.chatId)

                if (existingChat) {
                  return prev.map(chat => {
                    if (chat.id === payload.chatId) {
                      return {
                        ...chat,
                        advisorId: payload.advisorId ?? chat.advisorId,
                        advisorName: payload.advisorName !== undefined ? payload.advisorName : chat.advisorName,
                        status: payload.status !== undefined ? payload.status : chat.status,
                        updatedAt: new Date().toISOString(),
                      }
                    }
                    return chat
                  })
                } else if (payload.subject && payload.clientId) {
                  const newChat: Chat = {
                    id: payload.chatId,
                    subject: payload.subject,
                    clientId: payload.clientId,
                    clientName: payload.clientName,
                    advisorId: payload.advisorId ?? null,
                    advisorName: payload.advisorName,
                    status: (payload.status || 'OPEN') as ChatStatus,
                    createdAt: payload.createdAt || new Date().toISOString(),
                    updatedAt: new Date().toISOString(),
                  }
                  return [newChat, ...prev]
                }
              }

              return prev
            })
          } else {
            setChats(prev => prev.map(chat => {
              if (chat.id === payload.chatId) {
                return {
                  ...chat,
                  advisorId: payload.advisorId !== undefined ? (payload.advisorId ?? null) : chat.advisorId,
                  advisorName: payload.advisorName !== undefined ? payload.advisorName : chat.advisorName,
                  status: payload.status !== undefined ? payload.status : chat.status,
                  updatedAt: new Date().toISOString(),
                }
              }
              return chat
            }))
          }

          if (payload.advisorName !== undefined) {
            if (payload.advisorId === userId) {
              toast.success('Chat assigned to you')
            } else if (userRole === 'ADVISOR') {
              toast.success(`Chat transferred to ${payload.advisorName}`)
            }
          } else if (payload.status) {
            toast.success(`Chat status changed to ${payload.status}`)
          }
        }
      } catch (error) {
        console.error('[WS Global] Error parsing message:', error)
      }
    }

    ws.onerror = (error) => {
      console.error('[WS Global] Connection error:', error)
    }

    ws.onclose = () => {
      console.log('[WS Global] Connection closed')
    }
  }, [token, userId, userRole])

  // ========== Chat actions ==========
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

  // ========== Message actions ==========
  const handleSendMessage = useCallback(() => {
    if (!inputValue.trim() || !chatWsRef.current || chatWsRef.current.readyState !== WebSocket.OPEN) return

    chatWsRef.current.send(JSON.stringify({
      type: 'message:new',
      chatId: selectedChatId,
      payload: { content: inputValue },
    }))

    setInputValue('')

    // Stop typing indicator
    chatWsRef.current.send(JSON.stringify({
      type: 'typing',
      chatId: selectedChatId,
      payload: { isTyping: false },
    }))

    if (typingTimeoutRef.current) {
      clearTimeout(typingTimeoutRef.current)
    }
  }, [inputValue, selectedChatId])

  const handleInputChange = useCallback((value: string) => {
    setInputValue(value)

    if (chatWsRef.current?.readyState === WebSocket.OPEN) {
      chatWsRef.current.send(JSON.stringify({
        type: 'typing',
        chatId: selectedChatId,
        payload: { isTyping: true },
      }))

      if (typingTimeoutRef.current) {
        clearTimeout(typingTimeoutRef.current)
      }

      typingTimeoutRef.current = setTimeout(() => {
        chatWsRef.current?.send(JSON.stringify({
          type: 'typing',
          chatId: selectedChatId,
          payload: { isTyping: false },
        }))
      }, 3000)
    }
  }, [selectedChatId])

  // ========== Effects ==========

  // Load chats on mount
  useEffect(() => {
    isMountedRef.current = true

    if (token && userId && !hasLoadedChatsRef.current) {
      hasLoadedChatsRef.current = true
      loadChats()
    }

    return () => {
      isMountedRef.current = false
    }
  }, [token, userId, loadChats])

  // Connect to global WebSocket for chat updates
  useEffect(() => {
    if (!token || !userId) return

    connectToGlobalEvents()

    return () => {
      if (globalWsRef.current) {
        globalWsRef.current.close()
        globalWsRef.current = null
      }
    }
  }, [token, userId, connectToGlobalEvents])

  // Connect to chat room when chat is selected
  useEffect(() => {
    if (selectedChatId && selectedChat?.status === 'OPEN') {
      connectToChatRoom(selectedChatId)
      loadMessages(selectedChatId)
    }

    return () => {
      if (chatWsRef.current) {
        chatWsRef.current.close()
        chatWsRef.current = null
      }
    }
  }, [selectedChatId, selectedChat?.status, connectToChatRoom, loadMessages])

  // Handle infinite scroll
  useEffect(() => {
    const container = messagesContainerRef.current
    if (!container) return

    const handleScroll = () => {
      if (container.scrollTop < 100 && hasMoreMessages && !loadingMoreMessages) {
        loadMoreMessages()
      }
    }

    container.addEventListener('scroll', handleScroll)
    return () => container.removeEventListener('scroll', handleScroll)
  }, [hasMoreMessages, loadingMoreMessages, loadMoreMessages])

  // Auto-scroll to bottom when new messages arrive (if user is near bottom)
  useEffect(() => {
    const container = messagesContainerRef.current
    if (!container) return

    const isNearBottom = container.scrollHeight - container.scrollTop - container.clientHeight < 150

    if (isNearBottom) {
      messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
    }
  }, [messages])

  // Cleanup
  useEffect(() => {
    const typingTimeout = typingTimeoutRef.current
    const reconnectTimeout = reconnectTimeoutRef.current

    return () => {
      if (typingTimeout) {
        clearTimeout(typingTimeout)
      }
      if (reconnectTimeout) {
        clearTimeout(reconnectTimeout)
      }
    }
  }, [])

  // ========== Return structured props for components ==========
  return useMemo(() => ({
    root: {
      isLoading,
      error,
      userId,
      token,
    },

    sidebar: {
      chats,
      selectedChatId,
      activeTab,
      loadingChats,
      onSelectChat: handleSelectChat,
      onCreateChat: () => setIsCreateDialogOpen(true),
      onTabChange: setActiveTab,
    },

    header: {
      chat: selectedChat,
      otherPersonName,
      status: wsStatus,
      userRole,
      userId,
      onTransferClick: () => setIsTransferDialogOpen(true),
      onCloseClick: handleCloseChat,
      onReconnect: () => selectedChatId && connectToChatRoom(selectedChatId),
    },

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

    input: {
      inputValue,
      status: wsStatus,
      isChatClosed: selectedChat?.status === 'CLOSED',
      onInputChange: handleInputChange,
      onSendMessage: handleSendMessage,
    },

    dialogs: {
      create: {
        isOpen: isCreateDialogOpen,
        onClose: () => setIsCreateDialogOpen(false),
        onChatCreated: handleChatCreated,
        userRole,
      },
      transfer: {
        isOpen: isTransferDialogOpen,
        onClose: () => setIsTransferDialogOpen(false),
        onTransfer: handleTransferChat,
        currentAdvisorId: selectedChat?.advisorId || undefined,
      },
    },

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
    selectedChat,
    otherPersonName,
    wsStatus,
    userRole,
    handleCloseChat,
    connectToChatRoom,
    messages,
    loadingMessages,
    loadingMoreMessages,
    hasMoreMessages,
    typingUsers,
    inputValue,
    handleInputChange,
    handleSendMessage,
    isCreateDialogOpen,
    handleChatCreated,
    isTransferDialogOpen,
    handleTransferChat,
  ])
}
