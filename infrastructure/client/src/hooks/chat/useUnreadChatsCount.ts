/**
 * Hook pour compter les chats avec des messages non répondus
 * 
 * Pour un advisor, compte les chats où le dernier message
 * vient d'un client et n'a pas encore reçu de réponse.
 * 
 * Met à jour le compteur en temps réel via WebSocket.
 */

import { useState, useEffect } from 'react'
import { chatService } from '@/services/chatService'
import { useAuth } from '@/hooks/useAuth'

export function usePendingChatsCount() {
  const [count, setCount] = useState(0)
  const [loading, setLoading] = useState(true)
  const { token, userId } = useAuth()

  useEffect(() => {
    const fetchUnreadCount = async () => {
      try {
        if (!token) {
          setLoading(false)
          return
        }

        chatService.setAuthToken(token)
        const response = await chatService.getUserChats()

        if (response.success && response.chats) {
          // Compter les chats où le dernier message est d'un client et le chat est ouvert
          const pendingChats = await Promise.all(
            response.chats.map(async (chat) => {
              if (chat.status !== 'OPEN') return false

              const messages = await chatService.getChatMessages(chat.id, { limit: 1 })
              if (!messages.success) return false
              if (!messages.messages || messages.messages.length === 0) return true
              const lastMessage = messages.messages[0]
              return lastMessage.authorId !== userId
            })
          )

          setCount(pendingChats.filter(Boolean).length)
        }
      } catch (error) {
        console.error('Error fetching unread count:', error)
      } finally {
        setLoading(false)
      }
    }

    fetchUnreadCount()

    // Rafraîchir toutes les 30 secondes
    const interval = setInterval(fetchUnreadCount, 30000)

    // Écouter les événements WebSocket pour mettre à jour en temps réel
    if (token) {
      const wsUrl = `${process.env.NEXT_PUBLIC_WS_URL || 'ws://localhost:3000'}?token=${token}`
      let ws: WebSocket | null = null

      try {
        ws = new WebSocket(wsUrl)

        ws.onmessage = (event) => {
          try {
            const message = JSON.parse(event.data)

            // Rafraîchir le compteur quand :
            // - Un nouveau message est créé (peut changer le dernier message)
            // - Un chat est créé, mis à jour ou fermé
            if (message.type === 'message:created' ||
              message.type === 'chat:created' ||
              message.type === 'chat:updated' ||
              message.type === 'chat:closed') {
              fetchUnreadCount()
            }
          } catch {
            // Ignorer les erreurs de parsing
          }
        }
      } catch (error) {
        console.error('Error connecting to WebSocket:', error)
      }

      return () => {
        clearInterval(interval)
        if (ws) {
          ws.close()
        }
      }
    }

    return () => clearInterval(interval)
  }, [token, userId])

  return { count, loading }
}
