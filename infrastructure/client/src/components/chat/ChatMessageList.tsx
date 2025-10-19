/**
 * Composant pour afficher la liste des messages
 * - Affichage des messages avec scroll
 * - Infinite scroll pour charger les messages plus anciens
 * - Indicateur de typing
 * - Indicateurs de lecture
 */

import { Loader2, CheckCheck, Check } from 'lucide-react'
import { DisplayMessage } from '@/types/chat'

interface ChatMessageListProps {
  messages: DisplayMessage[]
  userId: string | null
  loadingMessages: boolean
  loadingMoreMessages: boolean
  hasMoreMessages: boolean
  typingUsers: Set<string>
  messagesContainerRef: React.RefObject<HTMLDivElement | null>
  messagesEndRef: React.RefObject<HTMLDivElement | null>
}

export function ChatMessageList({
  messages,
  userId,
  loadingMessages,
  loadingMoreMessages,
  hasMoreMessages,
  typingUsers,
  messagesContainerRef,
  messagesEndRef,
}: ChatMessageListProps) {
  if (loadingMessages) {
    return (
      <div className="flex-1 overflow-y-auto p-4 bg-background/30 scrollbar-thin">
        <div className="flex items-center justify-center h-full">
          <Loader2 className="h-6 w-6 animate-spin text-primary" />
        </div>
      </div>
    )
  }

  if (messages.length === 0) {
    return (
      <div className="flex-1 overflow-y-auto p-4 bg-background/30 scrollbar-thin">
        <div className="flex items-center justify-center h-full">
          <p className="text-muted-foreground">No messages yet. Start the conversation!</p>
        </div>
      </div>
    )
  }

  return (
    <div
      ref={messagesContainerRef}
      className="flex-1 overflow-y-auto p-4 bg-background/30 scrollbar-thin"
    >
      {/* Indicateur de chargement en haut */}
      {loadingMoreMessages && (
        <div className="flex justify-center py-2">
          <Loader2 className="h-4 w-4 animate-spin text-primary" />
        </div>
      )}

      {/* Message si plus de messages à charger */}
      {!hasMoreMessages && messages.length > 0 && (
        <div className="text-center py-2">
          <p className="text-xs text-muted-foreground">No more messages</p>
        </div>
      )}

      {/* Liste des messages */}
      {messages.map((message) => (
        <div
          key={message.id}
          className={`mb-4 flex ${message.authorId === userId ? 'justify-end' : 'justify-start'
            }`}
        >
          <div
            className={`max-w-xs lg:max-w-md px-4 py-2 rounded-lg ${message.authorId === userId
                ? 'bg-primary text-primary-foreground'
                : 'bg-background border border-border/50'
              }`}
          >
            {message.authorId !== userId && (
              <p className="text-xs font-semibold mb-1 opacity-70">
                {message.authorName}
              </p>
            )}
            <p className="break-words">{message.content}</p>
            <div className="flex justify-between items-center mt-1">
              <p className="text-xs opacity-70">
                {message.sentAt.toLocaleTimeString('fr-FR', {
                  hour: '2-digit',
                  minute: '2-digit',
                })}
              </p>
              {message.authorId === userId && (
                <span className="text-xs ml-2">
                  {message.isRead ? (
                    <CheckCheck className="h-3 w-3 inline" />
                  ) : (
                    <Check className="h-3 w-3 inline" />
                  )}
                </span>
              )}
            </div>
          </div>
        </div>
      ))}

      {/* Indicateur de saisie */}
      {typingUsers.size > 0 && (
        <div className="flex items-center space-x-2 text-sm text-muted-foreground mb-2">
          <div className="flex space-x-1">
            <span className="animate-bounce">•</span>
            <span className="animate-bounce delay-75">•</span>
            <span className="animate-bounce delay-150">•</span>
          </div>
          <span>{Array.from(typingUsers).join(', ')} typing...</span>
        </div>
      )}

      <div ref={messagesEndRef} />
    </div>
  )
}
