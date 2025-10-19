/**
 * Composant Input pour envoyer des messages
 * - Zone de saisie de texte
 * - Bouton d'envoi
 * - Message pour chat fermé
 */

import { Button } from '@/components/ui/button'
import { Send } from 'lucide-react'

type ConnectionStatus = 'connected' | 'connecting' | 'disconnected' | 'error'

interface ChatInputProps {
  inputValue: string
  status: ConnectionStatus
  isChatClosed: boolean
  onInputChange: (value: string) => void
  onSendMessage: () => void
}

export function ChatInput({
  inputValue,
  status,
  isChatClosed,
  onInputChange,
  onSendMessage,
}: ChatInputProps) {
  if (isChatClosed) {
    return (
      <div className="border-t border-border/50 p-4 bg-background/50">
        <div className="text-center py-2">
          <p className="text-sm text-muted-foreground">
            This chat is closed. No more messages can be sent.
          </p>
        </div>
      </div>
    )
  }

  return (
    <div className="border-t border-border/50 p-4 bg-background/50">
      <div className="flex space-x-2">
        <input
          type="text"
          value={inputValue}
          onChange={(e) => onInputChange(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && onSendMessage()}
          placeholder="Type your message..."
          disabled={status !== 'connected'}
          className="flex-1 px-4 py-2 border border-border/50 rounded-lg bg-background focus:outline-none focus:ring-2 focus:ring-primary disabled:bg-background/50 disabled:cursor-not-allowed"
        />
        <Button
          onClick={onSendMessage}
          disabled={status !== 'connected' || !inputValue.trim()}
          className="bg-primary hover:bg-primary/90"
        >
          <Send className="h-4 w-4" />
        </Button>
      </div>
    </div>
  )
}
