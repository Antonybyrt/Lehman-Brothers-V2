/**
 * Composant de chat intégré au dashboard (refactorisé)
 * 
 * Features:
 * - Liste des chats dans une sidebar
 * - Création de nouveaux chats
 * - Sélection d'un chat pour afficher la conversation
 * - Messages en temps réel via WebSocket
 * - Statut de saisie
 * - Marquage de lecture
 * - Authentification automatique
 */

"use client"

import { useState, useEffect, useRef } from "react"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from '@/components/ui/button'
import { MessageSquare, Loader2, AlertCircle, Plus } from "lucide-react"
import { authService } from '@/services/authService'
import { useChatSocket } from '@/hooks/useChatSocket'
import { useGlobalChatEvents } from '@/hooks/useGlobalChatEvents'

import { useChatMessages } from '@/hooks/useChatMessages'
import { chatService, Chat } from '@/services/chatService'
import { CreateChatDialog, TransferChatDialog } from '@/components/dialogs'
import { ChatSidebar } from '@/components/chat/ChatSidebar'
import { ChatHeader } from '@/components/chat/ChatHeader'
import { ChatMessageList } from '@/components/chat/ChatMessageList'
import { ChatInput } from '@/components/chat/ChatInput'
import toast from 'react-hot-toast'

export function DashboardChat() {
  // États d'authentification
  const [userId, setUserId] = useState<string | null>(null)
  const [userRole, setUserRole] = useState<string | null>(null)
  const [token, setToken] = useState<string | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  // Ref pour le timeout du typing
  const typingTimeoutRef = useRef<NodeJS.Timeout | null>(null)

  // États pour la liste des chats
  const [chats, setChats] = useState<Chat[]>([])
  const [selectedChatId, setSelectedChatId] = useState<string | null>(null)
  const [loadingChats, setLoadingChats] = useState(true)
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false)
  const [isTransferDialogOpen, setIsTransferDialogOpen] = useState(false)
  const [activeTab, setActiveTab] = useState<'OPEN' | 'CLOSED'>('OPEN')

  // Calculer le chat sélectionné
  const selectedChat = chats.find(c => c.id === selectedChatId)

  // États pour les messages
  const [messages, setMessages] = useState<Array<{
    id: string
    authorId: string
    authorName: string
    content: string
    sentAt: Date
    isRead: boolean
  }>>([])
  const [inputValue, setInputValue] = useState('')
  const [typingUsers, setTypingUsers] = useState<Set<string>>(new Set())

  // Handlers de messages
  const handleNewMessage = (payload: {
    messageId: string
    authorId: string
    authorName: string
    content: string
    sentAt: string
  }) => {
    if (!userId) return
    const newMessage = {
      id: payload.messageId,
      authorId: payload.authorId,
      authorName: payload.authorName,
      content: payload.content,
      sentAt: new Date(payload.sentAt),
      isRead: false,
    }
    setMessages((prev) => [...prev, newMessage])
    if (payload.authorId !== userId) {
      setTimeout(() => markAsRead([payload.messageId]), 1000)
    }
  }

  const handleTypingStatus = (payload: {
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
  }

  const handleMessageRead = (payload: {
    messageIds: string[]
    userId: string
    readAt: string
  }) => {
    setMessages((prev) =>
      prev.map((msg) =>
        payload.messageIds.includes(msg.id) ? { ...msg, isRead: true } : msg
      )
    )
  }

  const handleError = (error: string) => {
    console.error('[Chat] Error:', error)
  }

  // Hook WebSocket
  const { status, sendMessage, setTyping, markAsRead, reconnect } = useChatSocket({
    chatId: (selectedChatId && selectedChat?.status === 'OPEN') ? selectedChatId : '',
    token: token || '',
    onMessage: handleNewMessage,
    onTyping: handleTypingStatus,
    onMessageRead: handleMessageRead,
    onError: handleError,
    autoReconnect: true,
  })

  // Handlers d'envoi
  const handleSendMessage = () => {
    if (!inputValue.trim()) return
    sendMessage(inputValue)
    setInputValue('')
    setTyping(false)
  }

  const handleInputChange = (value: string) => {
    setInputValue(value)
    setTyping(true)

    // Clear le timeout précédent
    if (typingTimeoutRef.current) {
      clearTimeout(typingTimeoutRef.current)
    }

    // Définir un nouveau timeout pour arrêter le typing après 3 secondes
    typingTimeoutRef.current = setTimeout(() => {
      setTyping(false)
    }, 3000)
  }

  // Cleanup du timeout au démontage
  useEffect(() => {
    return () => {
      if (typingTimeoutRef.current) {
        clearTimeout(typingTimeoutRef.current)
      }
    }
  }, [])

  // Hook pour gérer le chargement des messages
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

  // Hook pour les notifications globales de chat
  useGlobalChatEvents({
    token,
    userId,
    userRole,
    onChatsUpdate: setChats,
  })

  // Mettre à jour les callbacks du WebSocket
  useEffect(() => {
    if (selectedChatId && selectedChat?.status === 'OPEN') {
      // Les callbacks sont maintenant gérés via les hooks
    }
  }, [selectedChatId, selectedChat])

  /**
   * Charge l'authentification
   */
  useEffect(() => {
    const fetchUserId = async () => {
      try {
        const authToken = typeof window !== 'undefined' ? localStorage.getItem('auth_token') : null
        if (!authToken) {
          setError("No authentication token found")
          setIsLoading(false)
          return
        }

        setToken(authToken)
        authService.setAuthToken(authToken)
        const roleResponse = await authService.getRole()

        if (roleResponse.success && roleResponse.userId) {
          setUserId(roleResponse.userId)
          setUserRole(roleResponse.role || null)
        } else {
          setError("Unable to get user ID")
        }
      } catch (err) {
        setError("Error loading user information")
        console.error("Error fetching user:", err)
      } finally {
        setIsLoading(false)
      }
    }

    fetchUserId()
  }, [])

  /**
   * Charge tous les chats de l'utilisateur
   */
  const loadChats = async () => {
    if (!token) return

    setLoadingChats(true)
    try {
      chatService.setAuthToken(token)
      const response = await chatService.getUserChats()

      if (response.success && response.chats) {
        // Trier les chats par date de création (les plus récents en premier)
        const sortedChats = response.chats.sort((a, b) =>
          new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
        )
        setChats(sortedChats)

        // Sélectionner le premier chat par défaut s'il n'y en a pas de sélectionné
        if (!selectedChatId && sortedChats.length > 0) {
          setSelectedChatId(sortedChats[0].id)
        }
      } else {
        toast.error(response.error || 'Failed to load chats')
      }
    } catch (error) {
      console.error('Error loading chats:', error)
      toast.error('Failed to load chats')
    } finally {
      setLoadingChats(false)
    }
  }

  /**
   * Gère la création d'un nouveau chat
   */
  const handleChatCreated = (chatId: string) => {
    loadChats().then(() => {
      setSelectedChatId(chatId)
    })
  }

  /**
   * Gère la sélection d'un chat
   */
  const handleSelectChat = (chatId: string) => {
    // Ne rien faire si c'est déjà le chat sélectionné
    if (chatId === selectedChatId) {
      return
    }

    setSelectedChatId(chatId)
    setMessages([])
  }

  /**
   * Ferme un chat (advisor uniquement)
   */
  const handleCloseChat = async () => {
    if (!selectedChatId || !token) return

    try {
      chatService.setAuthToken(token)
      const response = await chatService.closeChat(selectedChatId)

      if (response.success) {
        toast.success('Chat closed successfully')
        // Recharger la liste des chats
        loadChats()
      } else {
        toast.error(response.error || 'Failed to close chat')
      }
    } catch (error) {
      console.error('Error closing chat:', error)
      toast.error('Failed to close chat')
    }
  }

  /**
   * Transfère un chat à un autre advisor
   */
  const handleTransferChat = async (newAdvisorId: string) => {
    if (!selectedChatId || !token) return

    try {
      chatService.setAuthToken(token)
      const response = await chatService.transferChat(selectedChatId, newAdvisorId)

      if (response.success) {
        toast.success('Chat transferred successfully')
        // Pas besoin de recharger, le WebSocket va mettre à jour
      } else {
        toast.error(response.error || 'Failed to transfer chat')
      }
    } catch (error) {
      console.error('Error transferring chat:', error)
      toast.error('Failed to transfer chat')
    }
  }

  /**
   * Charge les chats au montage (une fois authentifié)
   */
  useEffect(() => {
    if (token && userId) {
      loadChats()
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [token, userId])

  /**
   * Charge les messages quand un chat est sélectionné
   */
  useEffect(() => {
    if (selectedChatId && token && userId) {
      loadMessages(selectedChatId)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedChatId])

  /**
   * Désélectionner le chat s'il n'existe plus dans la liste (après transfert)
   */
  useEffect(() => {
    if (selectedChatId && !selectedChat) {
      // Le chat sélectionné n'existe plus (probablement transféré)
      setSelectedChatId(null)
      setMessages([])
    }
  }, [selectedChatId, selectedChat])

  // Calculer le nom de l'interlocuteur
  const otherPersonName = selectedChat
    ? (selectedChat.clientId === userId ? selectedChat.advisorName || 'Unassigned' : selectedChat.clientName || 'Client')
    : null

  // États de chargement
  if (isLoading) {
    return (
      <Card className="border-0 shadow-lg bg-background/90 backdrop-blur-xl">
        <CardContent className="flex items-center justify-center h-[600px]">
          <div className="text-center space-y-4">
            <Loader2 className="h-12 w-12 animate-spin text-primary mx-auto" />
            <p className="text-muted-foreground">Loading chat...</p>
          </div>
        </CardContent>
      </Card>
    )
  }

  if (error || !userId || !token) {
    return (
      <Card className="border-0 shadow-lg bg-background/90 backdrop-blur-xl">
        <CardContent className="flex items-center justify-center h-[600px]">
          <div className="text-center space-y-4">
            <div className="w-16 h-16 mx-auto bg-gradient-to-br from-primary/20 to-primary/10 rounded-full flex items-center justify-center mb-4">
              <MessageSquare className="h-8 w-8 text-primary" />
            </div>
            <AlertCircle className="h-12 w-12 text-destructive mx-auto" />
            <h3 className="text-lg font-semibold text-foreground mb-2">
              Authentication Required
            </h3>
            <p className="text-sm text-muted-foreground">
              {error || "Please log in to access chat"}
            </p>
          </div>
        </CardContent>
      </Card>
    )
  }

  // Interface principale du chat
  return (
    <div className="flex h-[600px] bg-background border border-border/50 rounded-lg overflow-hidden">
      {/* Sidebar - Liste des chats */}
      <ChatSidebar
        chats={chats}
        selectedChatId={selectedChatId}
        activeTab={activeTab}
        loadingChats={loadingChats}
        onSelectChat={handleSelectChat}
        onCreateChat={() => setIsCreateDialogOpen(true)}
        onTabChange={setActiveTab}
      />

      {/* Zone de chat principale */}
      <div className="flex-1 flex flex-col">
        {!selectedChatId ? (
          /* Aucun chat sélectionné */
          <div className="flex-1 flex items-center justify-center bg-background/30">
            <div className="text-center">
              <MessageSquare className="h-16 w-16 mx-auto text-muted-foreground/30 mb-4" />
              <h3 className="text-lg font-semibold text-foreground mb-2">
                Select a chat
              </h3>
              <p className="text-sm text-muted-foreground mb-6">
                Choose a conversation from the sidebar or create a new one
              </p>
              <Button
                onClick={() => setIsCreateDialogOpen(true)}
                className="bg-primary hover:bg-primary/90"
              >
                <Plus className="h-4 w-4 mr-2" />
                New Support Chat
              </Button>
            </div>
          </div>
        ) : !selectedChat ? (
          /* Chat sélectionné mais plus dans la liste (transfert en cours) */
          <div className="flex-1 flex items-center justify-center bg-background/30">
            <div className="text-center">
              <Loader2 className="h-8 w-8 animate-spin text-primary mx-auto mb-4" />
              <p className="text-sm text-muted-foreground">
                Loading chat...
              </p>
            </div>
          </div>
        ) : (
          <>
            {/* Header du chat */}
            <ChatHeader
              chat={selectedChat}
              otherPersonName={otherPersonName}
              status={status}
              userRole={userRole}
              userId={userId}
              onTransferClick={() => setIsTransferDialogOpen(true)}
              onCloseClick={handleCloseChat}
              onReconnect={reconnect}
            />

            {/* Messages */}
            <ChatMessageList
              messages={messages}
              userId={userId}
              loadingMessages={loadingMessages}
              loadingMoreMessages={loadingMoreMessages}
              hasMoreMessages={hasMoreMessages}
              typingUsers={typingUsers}
              messagesContainerRef={messagesContainerRef}
              messagesEndRef={messagesEndRef}
            />

            {/* Input */}
            <ChatInput
              inputValue={inputValue}
              status={status}
              isChatClosed={selectedChat.status === 'CLOSED'}
              onInputChange={handleInputChange}
              onSendMessage={handleSendMessage}
            />
          </>
        )}
      </div>

      {/* Dialog de création de chat */}
      <CreateChatDialog
        isOpen={isCreateDialogOpen}
        onClose={() => setIsCreateDialogOpen(false)}
        onChatCreated={handleChatCreated}
        userRole={userRole}
      />

      {/* Dialog de transfert de chat */}
      <TransferChatDialog
        isOpen={isTransferDialogOpen}
        onClose={() => setIsTransferDialogOpen(false)}
        onTransfer={handleTransferChat}
        currentAdvisorId={selectedChat?.advisorId || undefined}
      />
    </div>
  )
}
