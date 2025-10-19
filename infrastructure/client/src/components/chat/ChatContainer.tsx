/**
 * ChatContainer - Main chat system wrapper
 * Uses unified useChat hook for all chat functionality
 */

'use client'

import { useChat } from '@/hooks/chat/useChat'
import { ChatSidebar } from './ChatSidebar'
import { ChatHeader } from './ChatHeader'
import { ChatMessageList } from './ChatMessageList'
import { ChatInput } from './ChatInput'
import { CreateChatDialog } from '../dialogs/CreateChatDialog'
import { TransferChatDialog } from '../dialogs/TransferChatDialog'

export function ChatContainer() {
  const chat = useChat()

  if (chat.root.isLoading) {
    return (
      <div className="flex h-screen items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-100 dark:from-gray-900 dark:to-gray-800">
        <div className="text-center">
          <div className="inline-block h-8 w-8 animate-spin rounded-full border-4 border-solid border-blue-600 border-r-transparent"></div>
          <p className="mt-4 text-gray-600 dark:text-gray-400">Loading...</p>
        </div>
      </div>
    )
  }

  if (chat.root.error) {
    return (
      <div className="flex h-screen items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-100 dark:from-gray-900 dark:to-gray-800">
        <div className="text-center">
          <p className="text-red-600 dark:text-red-400">{chat.root.error}</p>
        </div>
      </div>
    )
  }

  return (
    <div className="flex flex-1 rounded-lg overflow-hidden border-0 bg-background/90 backdrop-blur-xl shadow-lg h-210">
      <ChatSidebar {...chat.sidebar} />

      <div className="flex flex-1 flex-col">
        {chat.selected.chatId ? (
          <>
            <ChatHeader {...chat.header} />
            <ChatMessageList {...chat.messageList} />
            <ChatInput {...chat.input} />
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

      <CreateChatDialog {...chat.dialogs.create} />
      <TransferChatDialog {...chat.dialogs.transfer} />
    </div>
  )
}
