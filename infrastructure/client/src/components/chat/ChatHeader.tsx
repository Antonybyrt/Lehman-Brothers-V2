/**
 * Composant Header du chat avec actions
 * - Affichage du sujet et de l'interlocuteur
 * - Statut de connexion WebSocket
 * - Boutons Transfer et Close (pour les advisors)
 */

import { Button } from '@/components/ui/button'
import { ArrowRightLeft } from 'lucide-react'
import { Chat, ConnectionStatus } from '@/types/chat'

interface ChatHeaderProps {
  chat: Chat | undefined
  otherPersonName: string | null
  status: ConnectionStatus
  userRole: string | null
  userId: string | null
  onTransferClick: () => void
  onCloseClick: () => void
  onReconnect: () => void
}

export function ChatHeader({
  chat,
  otherPersonName,
  status,
  userRole,
  userId,
  onTransferClick,
  onCloseClick,
  onReconnect,
}: ChatHeaderProps) {
  // Si le chat n'existe pas (pendant un transfert), ne rien afficher
  if (!chat) {
    return null
  }
  return (
    <div className="p-4 border-b border-border/50 bg-background/50">
      <div className="flex items-center justify-between">
        <div className="flex-1">
          <div className="flex items-center space-x-3">
            <h3 className="font-semibold text-foreground">
              {chat.subject}
            </h3>
            {otherPersonName && (
              <span className="text-sm text-muted-foreground">
                • with {otherPersonName}
              </span>
            )}
          </div>
          <div className="flex items-center space-x-2 mt-1">
            <div
              className={`w-2 h-2 rounded-full ${status === 'connected'
                ? 'bg-green-500'
                : status === 'connecting'
                  ? 'bg-yellow-500'
                  : 'bg-red-500'
                }`}
            />
            <span className="text-sm text-muted-foreground capitalize">
              {status}
            </span>
            {status !== 'connected' && (
              <button
                onClick={onReconnect}
                className="text-xs text-primary hover:text-primary/80"
              >
                Reconnect
              </button>
            )}
          </div>
        </div>
        <div className="flex items-center space-x-2">
          <span className={`text-xs px-2 py-1 rounded ${chat.status === 'OPEN'
            ? 'bg-green-100 text-green-700'
            : chat.status === 'CLOSED'
              ? 'bg-gray-100 text-gray-700'
              : 'bg-blue-100 text-blue-700'
            }`}>
            {chat.status}
          </span>
          {userRole === 'ADVISOR' && chat.status === 'OPEN' && chat.advisorId === userId && (
            <>
              <Button
                onClick={onTransferClick}
                size="sm"
                variant="outline"
                className="text-xs"
              >
                <ArrowRightLeft className="h-3 w-3 mr-1" />
                Transfer
              </Button>
              <Button
                onClick={onCloseClick}
                size="sm"
                variant="outline"
                className="text-xs"
              >
                Close Chat
              </Button>
            </>
          )}
        </div>
      </div>
    </div>
  )
}
