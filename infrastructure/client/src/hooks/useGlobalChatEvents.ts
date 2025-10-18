/**
 * Hook pour gérer les notifications globales de chat via WebSocket
 * - Écoute les événements chat:created (nouveaux chats pour les advisors)
 * - Écoute les événements chat:updated (mises à jour de statut, transferts)
 */

import { useEffect } from 'react'
import toast from 'react-hot-toast'
import { Chat } from '@/services/chatService'

interface UseGlobalChatEventsProps {
  token: string | null
  userId: string | null
  userRole: string | null
  onChatsUpdate: (updateFn: (prevChats: Chat[]) => Chat[]) => void
}

export function useGlobalChatEvents({
  token,
  userId,
  userRole,
  onChatsUpdate,
}: UseGlobalChatEventsProps) {
  useEffect(() => {
    if (!token || !userId) return

    const wsUrl = `${process.env.NEXT_PUBLIC_WS_URL || 'ws://localhost:3000'}?token=${token}`
    let ws: WebSocket | null = null

    try {
      ws = new WebSocket(wsUrl)

      ws.onopen = () => {
        console.log('[WS Global] Connected for chat notifications')
      }

      ws.onmessage = (event) => {
        try {
          const message = JSON.parse(event.data)

          if (message.type === 'chat:created') {
            console.log('[WS Global] New chat created:', message.payload)
            // Ajouter le nouveau chat en haut de la liste (pour advisors et clients)
            const newChat: Chat = {
              id: message.payload.chatId,
              subject: message.payload.subject,
              clientId: message.payload.clientId,
              clientName: message.payload.clientName,
              advisorId: message.payload.advisorId || null,
              advisorName: message.payload.advisorName || undefined,
              status: message.payload.status,
              createdAt: message.payload.createdAt,
              updatedAt: message.payload.createdAt,
            }

            onChatsUpdate((prev) => [newChat, ...prev])

            // Show notification based on role
            if (userRole === 'ADVISOR') {
              toast.success(`New chat created: ${message.payload.subject}`)
            } else if (userRole === 'CLIENT' && message.payload.advisorId) {
              // Client was notified because an advisor created the chat for them
              toast.success(`${message.payload.advisorName || 'An advisor'} created a chat: ${message.payload.subject}`)
            }
          } else if (message.type === 'chat:updated') {
            console.log('[WS Global] Chat updated:', message.payload)

            // Si c'est un transfert et que je suis conseiller
            if (message.payload.advisorId !== undefined && userRole === 'ADVISOR') {
              onChatsUpdate((prev) => {
                // Si le chat n'est plus assigné à moi, le retirer de ma liste
                if (message.payload.advisorId !== userId) {
                  return prev.filter(chat => chat.id !== message.payload.chatId)
                }

                // Si le chat est maintenant assigné à moi
                if (message.payload.advisorId === userId) {
                  // Vérifier si j'ai déjà ce chat dans ma liste
                  const existingChat = prev.find(chat => chat.id === message.payload.chatId)

                  if (existingChat) {
                    // Mettre à jour le chat existant
                    return prev.map(chat => {
                      if (chat.id === message.payload.chatId) {
                        return {
                          ...chat,
                          advisorId: message.payload.advisorId,
                          advisorName: message.payload.advisorName !== undefined ? message.payload.advisorName : chat.advisorName,
                          status: message.payload.status !== undefined ? message.payload.status : chat.status,
                          updatedAt: new Date().toISOString(),
                        }
                      }
                      return chat
                    })
                  } else {
                    // Ajouter le nouveau chat à ma liste (transfert reçu)
                    if (message.payload.subject && message.payload.clientId) {
                      const newChat: Chat = {
                        id: message.payload.chatId,
                        subject: message.payload.subject,
                        clientId: message.payload.clientId,
                        clientName: message.payload.clientName,
                        advisorId: message.payload.advisorId,
                        advisorName: message.payload.advisorName,
                        status: message.payload.status || 'OPEN',
                        createdAt: message.payload.createdAt || new Date().toISOString(),
                        updatedAt: new Date().toISOString(),
                      }
                      return [newChat, ...prev]
                    }
                  }
                }

                return prev
              })
            } else {
              // Pour les clients ou les changements de statut, juste mettre à jour
              onChatsUpdate((prev) => prev.map(chat => {
                if (chat.id === message.payload.chatId) {
                  return {
                    ...chat,
                    advisorId: message.payload.advisorId !== undefined ? message.payload.advisorId : chat.advisorId,
                    advisorName: message.payload.advisorName !== undefined ? message.payload.advisorName : chat.advisorName,
                    status: message.payload.status !== undefined ? message.payload.status : chat.status,
                    updatedAt: new Date().toISOString(),
                  }
                }
                return chat
              }))
            }

            // Afficher une notification si c'est un changement d'advisor
            if (message.payload.advisorName !== undefined) {
              if (message.payload.advisorId === userId) {
                toast.success(`Chat assigned to you`)
              } else if (userRole === 'ADVISOR') {
                toast.success(`Chat transferred to ${message.payload.advisorName}`)
              }
            } else if (message.payload.status) {
              toast.success(`Chat status changed to ${message.payload.status}`)
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
    } catch (error) {
      console.error('[WS Global] Failed to create WebSocket:', error)
    }

    return () => {
      if (ws) {
        ws.close()
      }
    }
  }, [token, userId, userRole, onChatsUpdate])
}
