import { useState, useEffect, useCallback, useRef } from 'react'
import { chatService } from '@/services/chatService'
import { DisplayMessage } from '@/types/chat'
import toast from 'react-hot-toast'

type WsEventType = 'join' | 'typing' | 'message:new' | 'message:created' | 'message:read' | 'error'

interface WsMessage {
  type: WsEventType
  chatId?: string
  payload?: any
}

export function useChatMessages(
  selectedChatId: string | null,
  userId: string | null,
  token: string | null
) {
  const [messages, setMessages] = useState<DisplayMessage[]>([])
  const [loadingMessages, setLoadingMessages] = useState(false)
  const [hasMoreMessages, setHasMoreMessages] = useState(true)
  const [loadingMoreMessages, setLoadingMoreMessages] = useState(false)
  const [typingUsers, setTypingUsers] = useState<Set<string>>(new Set())
  const [wsStatus, setWsStatus] = useState<'connecting' | 'connected' | 'disconnected' | 'error'>('disconnected')

  const chatWsRef = useRef<WebSocket | null>(null)
  const messagesContainerRef = useRef<HTMLDivElement>(null)
  const messagesEndRef = useRef<HTMLDivElement>(null)
  const isMountedRef = useRef(true)

  // Load messages
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

  // Load more messages
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

  // Connect to WebSocket
  useEffect(() => {
    if (!token || !selectedChatId) return

    if (chatWsRef.current) {
      chatWsRef.current.close()
      chatWsRef.current = null
    }

    const wsUrl = process.env.NEXT_PUBLIC_WS_URL || 'ws://localhost:3000'
    const ws = new WebSocket(wsUrl, `Bearer.${token}`)
    chatWsRef.current = ws

    ws.onopen = () => {
      if (!isMountedRef.current) {
        ws.close()
        return
      }
      console.log('[WS Chat] Connected')
      setWsStatus('connected')

      ws.send(JSON.stringify({
        type: 'join',
        chatId: selectedChatId,
        payload: { chatId: selectedChatId },
      }))
    }

    ws.onmessage = (event) => {
      try {
        const message: WsMessage = JSON.parse(event.data)

        switch (message.type) {
          case 'message:created': {
            const payload = message.payload
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
            const payload = message.payload
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
            const payload = message.payload
            setMessages(prev =>
              prev.map(msg =>
                payload.messageIds.includes(msg.id) ? { ...msg, isRead: true } : msg
              )
            )
            break
          }
        }
      } catch (error) {
        console.error('[WS Chat] Error parsing message:', error)
      }
    }

    ws.onerror = () => setWsStatus('error')
    ws.onclose = () => setWsStatus('disconnected')

    loadMessages(selectedChatId)

    return () => {
      ws.close()
    }
  }, [token, selectedChatId, userId, loadMessages])

  // Scroll effect
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

  const sendMessage = useCallback((content: string) => {
    if (!content.trim() || !chatWsRef.current || chatWsRef.current.readyState !== WebSocket.OPEN || !selectedChatId) return

    chatWsRef.current.send(JSON.stringify({
      type: 'message:new',
      chatId: selectedChatId,
      payload: { content },
    }))

    chatWsRef.current.send(JSON.stringify({
      type: 'typing',
      chatId: selectedChatId,
      payload: { isTyping: false },
    }))
  }, [selectedChatId])

  const sendTyping = useCallback((isTyping: boolean) => {
    if (chatWsRef.current?.readyState === WebSocket.OPEN && selectedChatId) {
      chatWsRef.current.send(JSON.stringify({
        type: 'typing',
        chatId: selectedChatId,
        payload: { isTyping },
      }))
    }
  }, [selectedChatId])

  return {
    messages,
    loadingMessages,
    loadingMoreMessages,
    hasMoreMessages,
    typingUsers,
    wsStatus,
    messagesContainerRef,
    messagesEndRef,
    setMessages,
    sendMessage,
    sendTyping
  }
}
