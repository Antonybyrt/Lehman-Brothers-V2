import { useState, useEffect, useCallback } from 'react'
import { chatService } from '@/services/chatService'
import { Chat, ChatStatus } from '@/types/chat'
import toast from 'react-hot-toast'
import { UserRole } from '@lehman-brothers/domain/values/UserRole';

type WsEventType = 'chat:created' | 'chat:updated' | 'error'

interface WsMessage {
  type: WsEventType
  payload?: any
}

export function useChatList(userId: string | null, userRole: string | null, token: string | null) {
  const [chats, setChats] = useState<Chat[]>([])
  const [loadingChats, setLoadingChats] = useState(true)

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

  // Connect to global WebSocket for chat updates
  useEffect(() => {
    if (!token || !userId) return

    const wsUrl = process.env.NEXT_PUBLIC_WS_URL || 'ws://localhost:3000'
    const ws = new WebSocket(wsUrl, `Bearer.${token}`)

    ws.onopen = () => {
      console.log('[WS Global] Connected')
    }

    ws.onmessage = (event) => {
      try {
        const message: WsMessage = JSON.parse(event.data)

        if (message.type === 'chat:created') {
          const payload = message.payload
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
            priority: payload.priority || 'NORMAL', // Default priority
            lastMessage: undefined,
            lastMessageAt: undefined,
            lastMessageAuthorId: undefined
          }

          setChats(prev => [newChat, ...prev])

          if (userRole === UserRole.ADVISOR) {
            toast.success(`New chat created: ${payload.subject}`)
          } else if (userRole === UserRole.CLIENT && payload.advisorId) {
            toast.success(`${payload.advisorName || 'An advisor'} created a chat: ${payload.subject}`)
          }
        } else if (message.type === 'chat:updated') {
          const payload = message.payload

          if (payload.advisorId !== undefined && userRole === UserRole.ADVISOR) {
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
                  // Chat assigned to me, add it
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
                    priority: payload.priority || 'NORMAL',
                    lastMessage: undefined,
                    lastMessageAt: undefined,
                    lastMessageAuthorId: undefined
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
            } else if (userRole === UserRole.ADVISOR) {
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

    return () => {
      ws.close()
    }
  }, [token, userId, userRole])

  // Initial load
  useEffect(() => {
    if (token && userId) {
      loadChats()
    }
  }, [token, userId, loadChats])

  return {
    chats,
    loadingChats,
    loadChats,
    setChats
  }
}
