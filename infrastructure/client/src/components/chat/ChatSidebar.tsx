/**
 * Composant Sidebar pour la liste des chats
 * - Tabs pour filtrer par statut (OPEN/CLOSED)
 * - Liste des chats avec sélection
 * - Bouton de création de nouveau chat
 */

import { Button } from '@/components/ui/button'
import { MessageSquare, Plus, UserCircle, Loader2 } from 'lucide-react'
import { Chat } from '@/services/chatService'

interface ChatSidebarProps {
  chats: Chat[]
  selectedChatId: string | null
  activeTab: 'OPEN' | 'CLOSED'
  loadingChats: boolean
  onSelectChat: (chatId: string) => void
  onCreateChat: () => void
  onTabChange: (tab: 'OPEN' | 'CLOSED') => void
}

export function ChatSidebar({
  chats,
  selectedChatId,
  activeTab,
  loadingChats,
  onSelectChat,
  onCreateChat,
  onTabChange,
}: ChatSidebarProps) {
  const filteredChats = chats.filter(chat => chat.status === activeTab)

  return (
    <div className="w-80 border-r border-border/50 flex flex-col bg-background/50">
      {/* Header de la sidebar */}
      <div className="p-4 border-b border-border/50">
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-lg font-semibold text-foreground">Support Chats</h2>
          <Button
            onClick={onCreateChat}
            size="sm"
            className="bg-primary hover:bg-primary/90"
          >
            <Plus className="h-4 w-4 mr-1" />
            New
          </Button>
        </div>

        {/* Tabs pour filtrer par statut */}
        <div className="flex gap-1 bg-muted/30 p-1 rounded-md">
          <button
            onClick={() => onTabChange('OPEN')}
            className={`flex-1 px-3 py-1.5 text-xs font-medium rounded transition-all ${activeTab === 'OPEN'
                ? 'bg-background text-foreground shadow-sm'
                : 'text-muted-foreground hover:text-foreground'
              }`}
          >
            Open
          </button>
          <button
            onClick={() => onTabChange('CLOSED')}
            className={`flex-1 px-3 py-1.5 text-xs font-medium rounded transition-all ${activeTab === 'CLOSED'
                ? 'bg-background text-foreground shadow-sm'
                : 'text-muted-foreground hover:text-foreground'
              }`}
          >
            Closed
          </button>
        </div>
      </div>

      {/* Liste des chats */}
      <div className="flex-1 overflow-y-auto scrollbar-thin">
        {loadingChats ? (
          <div className="flex items-center justify-center py-8">
            <Loader2 className="h-6 w-6 animate-spin text-primary" />
          </div>
        ) : filteredChats.length === 0 ? (
          <div className="text-center py-8 px-4">
            <MessageSquare className="h-12 w-12 mx-auto text-muted-foreground/50 mb-3" />
            <p className="text-sm text-muted-foreground mb-4">
              {activeTab === 'OPEN' ? 'No open chats' : 'No closed chats'}
            </p>
            {activeTab === 'OPEN' && (
              <Button
                onClick={onCreateChat}
                size="sm"
                variant="outline"
              >
                <Plus className="h-4 w-4 mr-2" />
                Create your first chat
              </Button>
            )}
          </div>
        ) : (
          <div className="divide-y divide-border/30">
            {filteredChats.map((chat) => (
              <button
                key={chat.id}
                onClick={() => onSelectChat(chat.id)}
                className={`w-full p-4 text-left hover:bg-background/80 transition-colors ${selectedChatId === chat.id ? 'bg-primary/10 border-l-2 border-primary' : ''
                  }`}
              >
                <div className="flex items-start space-x-3">
                  <div className="w-10 h-10 rounded-lg flex items-center justify-center flex-shrink-0 bg-primary/10">
                    <MessageSquare className="h-5 w-5 text-primary" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center space-x-2">
                      <p className="text-sm font-medium text-foreground truncate">
                        {chat.subject}
                      </p>
                      {!chat.advisorId && (
                        <span className="text-xs px-1.5 py-0.5 rounded bg-orange-100 text-orange-700 flex items-center space-x-1 flex-shrink-0">
                          <UserCircle className="h-3 w-3" />
                          <span>Unassigned</span>
                        </span>
                      )}
                    </div>
                    <p className="text-xs text-muted-foreground mt-1">
                      {new Date(chat.createdAt).toLocaleDateString()}
                    </p>
                  </div>
                </div>
              </button>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
