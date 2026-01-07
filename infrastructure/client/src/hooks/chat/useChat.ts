/**
 * Unified chat hook - manages all chat functionality in one place
 * Refactored to use smaller hooks for better separation of concerns.
 */

import { useState, useCallback, useMemo, useRef } from 'react'
import { ChatTab } from '@/types/chat'
import { useAuth } from '@/hooks/useAuth'
import { UserRole } from '@lehman-brothers/domain/values/UserRole';
import { useChatList } from './useChatList';
import { useChatMessages } from './useChatMessages';
import { useChatActions } from './useChatActions';

export function useChat(initialChatId?: string | null) {
  const { userId, userRole, token, isLoading, error } = useAuth()

  // ========== Chat list state ==========
  const { chats, loadingChats, loadChats } = useChatList(userId, userRole, token)
  const [selectedChatId, setSelectedChatId] = useState<string | null>(initialChatId || null)
  const [activeTab, setActiveTab] = useState<ChatTab>('OPEN')

  // ========== Messages state ==========
  const {
    messages,
    loadingMessages,
    loadingMoreMessages,
    hasMoreMessages,
    typingUsers,
    wsStatus,
    messagesContainerRef,
    messagesEndRef,
    sendMessage,
    sendTyping,
    setMessages
  } = useChatMessages(selectedChatId, userId, token)

  // ========== Actions ==========
  const { closeChat, transferChat } = useChatActions(token, loadChats)

  // ========== Input state ==========
  const [inputValue, setInputValue] = useState('')
  const typingTimeoutRef = useRef<NodeJS.Timeout | null>(null)

  // ========== Dialog state ==========
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false)
  const [isTransferDialogOpen, setIsTransferDialogOpen] = useState(false)

  // ========== Computed values ==========
  const selectedChat = chats.find(c => c.id === selectedChatId)
  const otherPersonName = selectedChat
    ? (selectedChat.clientId === userId ? selectedChat.advisorName || 'Unassigned' : selectedChat.clientName || UserRole.CLIENT)
    : null

  // ========== Event Handlers ==========
  const handleSelectChat = useCallback((chatId: string) => {
    if (chatId === selectedChatId) return
    setSelectedChatId(chatId)
    setMessages([]) // Clear messages immediately
  }, [selectedChatId, setMessages])

  const handleChatCreated = useCallback((chatId: string) => {
    loadChats().then(() => {
      setSelectedChatId(chatId)
    })
  }, [loadChats])

  const handleCloseChat = useCallback(async () => {
    if (!selectedChatId) return
    await closeChat(selectedChatId)
  }, [selectedChatId, closeChat])

  const handleTransferChat = useCallback(async (newAdvisorId: string) => {
    if (!selectedChatId) return
    await transferChat(selectedChatId, newAdvisorId)
  }, [selectedChatId, transferChat])

  const handleSendMessage = useCallback(() => {
    sendMessage(inputValue)
    setInputValue('')
  }, [inputValue, sendMessage])

  const handleInputChange = useCallback((value: string) => {
    setInputValue(value)

    sendTyping(true)

    if (typingTimeoutRef.current) {
      clearTimeout(typingTimeoutRef.current)
    }

    typingTimeoutRef.current = setTimeout(() => {
      sendTyping(false)
    }, 3000)
  }, [sendTyping])

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
      onReconnect: () => { }, // Reconnect handled automatically by hook
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
