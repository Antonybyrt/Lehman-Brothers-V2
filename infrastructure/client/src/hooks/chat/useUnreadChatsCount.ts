/**
 * Hook to count chats pending advisor response
 * 
 * For an advisor, counts chats where the last message
 * is from a client and hasn't received a response yet.
 * 
 * Updates the counter in real-time via WebSocket.
 */

import { useState, useEffect } from 'react'
import { chatService } from '@/services/chatService'
import { useAuth } from '@/hooks/useAuth'

export function usePendingChatsCount() {
  const [count, setCount] = useState(0)
  const [loading, setLoading] = useState(true)
  const { token } = useAuth()

  useEffect(() => {
    const fetchPendingCount = async () => {
      try {
        if (!token) {
          setLoading(false)
          return
        }

        chatService.setAuthToken(token)
        const response = await chatService.getPendingChatsCount()

        if (response.success && response.count !== undefined) {
          setCount(response.count)
        }
      } catch (error) {
        console.error('Error fetching pending chats count:', error)
      } finally {
        setLoading(false)
      }
    }

    fetchPendingCount()

    // Refresh every 30 seconds
    const interval = setInterval(fetchPendingCount, 30000)

    // Listen to WebSocket events for real-time updates
    if (token) {
      const wsUrl = `${process.env.NEXT_PUBLIC_WS_URL || 'ws://localhost:3000'}?token=${token}`
      let ws: WebSocket | null = null

      try {
        ws = new WebSocket(wsUrl)

        ws.onmessage = (event) => {
          try {
            const message = JSON.parse(event.data)

            // Refresh counter when:
            // - A new message is created (can change the last message)
            // - A chat is created, updated or closed
            if (message.type === 'message:created' ||
              message.type === 'chat:created' ||
              message.type === 'chat:updated' ||
              message.type === 'chat:closed') {
              fetchPendingCount()
            }
          } catch {
            // Ignore parsing errors
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
  }, [token])

  return { count, loading }
}
