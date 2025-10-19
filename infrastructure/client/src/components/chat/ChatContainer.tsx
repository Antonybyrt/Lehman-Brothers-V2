/**
 * ChatContainer - Composant wrapper pour le système de chat
 * 
 * Utilise le hook useChatLogic pour centraliser la logique
 * et passer des props structurées aux composants enfants.
 * 
 * Réduit le props drilling de ~26 props individuelles à 4-5 objets structurés.
 */

'use client'

import { useChatLogic } from '@/hooks/chat/useChatLogic'
import { ChatSidebar } from './ChatSidebar'
import { ChatHeader } from './ChatHeader'
import { ChatMessageList } from './ChatMessageList'
import { ChatInput } from './ChatInput'
import { CreateChatDialog } from '../dialogs/CreateChatDialog'
import { TransferChatDialog } from '../dialogs/TransferChatDialog'

export function ChatContainer() {
  const chatLogic = useChatLogic()

  // État de chargement initial
  if (chatLogic.root.isLoading) {
    return (
      <div className="flex h-screen items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-100 dark:from-gray-900 dark:to-gray-800">
        <div className="text-center">
          <div className="inline-block h-8 w-8 animate-spin rounded-full border-4 border-solid border-blue-600 border-r-transparent"></div>
          <p className="mt-4 text-gray-600 dark:text-gray-400">Loading...</p>
        </div>
      </div>
    )
  }

  // Gestion des erreurs
  if (chatLogic.root.error) {
    return (
      <div className="flex h-screen items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-100 dark:from-gray-900 dark:to-gray-800">
        <div className="text-center">
          <p className="text-red-600 dark:text-red-400">{chatLogic.root.error}</p>
        </div>
      </div>
    )
  }

  return (
    <div className="flex flex-1 rounded-lg overflow-hidden border-0 bg-background/90 backdrop-blur-xl shadow-lg h-210">
      {/* Sidebar avec la liste des chats */}
      <ChatSidebar {...chatLogic.sidebar} />

      {/* Zone principale du chat */}
      <div className="flex flex-1 flex-col">
        {chatLogic.selected.chatId ? (
          <>
            {/* Header du chat */}
            <ChatHeader {...chatLogic.header} />

            {/* Liste des messages */}
            <ChatMessageList {...chatLogic.messageList} />

            {/* Input pour envoyer des messages */}
            <ChatInput {...chatLogic.input} />
          </>
        ) : (
          <div className="flex flex-1 items-center justify-center">
            <div className="text-center">
              <div className="mb-4 text-6xl">💬</div>
              <h2 className="text-2xl font-semibold text-gray-700 dark:text-gray-300">
                Select a chat to start messaging
              </h2>
              <p className="mt-2 text-gray-500 dark:text-gray-400">
                Choose a conversation from the sidebar
              </p>
            </div>
          </div>
        )}
      </div>

      {/* Dialogs */}
      <CreateChatDialog {...chatLogic.dialogs.create} />
      <TransferChatDialog {...chatLogic.dialogs.transfer} />
    </div>
  )
}
