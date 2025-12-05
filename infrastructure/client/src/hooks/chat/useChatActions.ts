import { useCallback } from 'react'
import { chatService } from '@/services/chatService'
import toast from 'react-hot-toast'

export function useChatActions(token: string | null, onActionSuccess?: () => void) {
  const closeChat = useCallback(async (chatId: string) => {
    if (!token) return

    try {
      chatService.setAuthToken(token)
      const response = await chatService.closeChat(chatId)

      if (response.success) {
        toast.success('Chat closed successfully')
        onActionSuccess?.()
      } else {
        toast.error(response.error || 'Failed to close chat')
      }
    } catch (error) {
      console.error('Error closing chat:', error)
      toast.error('Failed to close chat')
    }
  }, [token, onActionSuccess])

  const transferChat = useCallback(async (chatId: string, newAdvisorId: string) => {
    if (!token) return

    try {
      chatService.setAuthToken(token)
      const response = await chatService.transferChat(chatId, newAdvisorId)

      if (response.success) {
        toast.success('Chat transferred successfully')
        onActionSuccess?.()
      } else {
        toast.error(response.error || 'Failed to transfer chat')
      }
    } catch (error) {
      console.error('Error transferring chat:', error)
      toast.error('Failed to transfer chat')
    }
  }, [token, onActionSuccess])

  return {
    closeChat,
    transferChat
  }
}
