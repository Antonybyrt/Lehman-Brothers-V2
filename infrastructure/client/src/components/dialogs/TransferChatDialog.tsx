"use client"

import { useState, useEffect, useCallback } from 'react'
import { Button } from '@/components/ui/button'
import { Loader2, Users, X } from 'lucide-react'
import { authService } from '@/services/authService'
import toast from 'react-hot-toast'

interface User {
  id: string
  firstName: string
  lastName: string
  email: string
  role: string
}

interface TransferChatDialogProps {
  isOpen: boolean
  onClose: () => void
  onTransfer: (newAdvisorId: string) => void
  currentAdvisorId?: string
}

export function TransferChatDialog({ isOpen, onClose, onTransfer, currentAdvisorId }: TransferChatDialogProps) {
  const [advisors, setAdvisors] = useState<User[]>([])
  const [loading, setLoading] = useState(false)
  const [selectedAdvisorId, setSelectedAdvisorId] = useState<string | null>(null)

  const loadAdvisors = useCallback(async () => {
    setLoading(true)
    try {
      const response = await authService.getAllUsers()

      if (response.success && response.users) {
        // Filtrer pour ne garder que les advisors (sauf l'advisor actuel)
        const advisorList = response.users.filter(
          (user: User) => user.role === 'ADVISOR' && user.id !== currentAdvisorId
        )
        setAdvisors(advisorList)
      } else {
        toast.error('Failed to load advisors')
      }
    } catch (error) {
      console.error('Error loading advisors:', error)
      toast.error('Failed to load advisors')
    } finally {
      setLoading(false)
    }
  }, [currentAdvisorId])

  useEffect(() => {
    if (isOpen) {
      loadAdvisors()
      setSelectedAdvisorId(null)
    }
  }, [isOpen, loadAdvisors])

  const handleTransfer = () => {
    if (!selectedAdvisorId) {
      toast.error('Please select an advisor')
      return
    }

    onTransfer(selectedAdvisorId)
    onClose()
  }

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/50 backdrop-blur-sm"
        onClick={onClose}
      />

      {/* Dialog */}
      <div className="relative bg-background rounded-lg shadow-xl max-w-[500px] w-full mx-4 max-h-[80vh] overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-border">
          <div>
            <h2 className="text-lg font-semibold text-foreground">Transfer Chat to Another Advisor</h2>
            <p className="text-sm text-muted-foreground mt-1">
              Select an advisor to transfer this conversation to.
            </p>
          </div>
          <button
            onClick={onClose}
            className="text-muted-foreground hover:text-foreground transition-colors"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6">
          {loading ? (
            <div className="flex items-center justify-center py-8">
              <Loader2 className="h-8 w-8 animate-spin text-primary" />
            </div>
          ) : advisors.length === 0 ? (
            <div className="text-center py-8">
              <Users className="h-12 w-12 mx-auto text-muted-foreground/50 mb-3" />
              <p className="text-sm text-muted-foreground">No other advisors available</p>
            </div>
          ) : (
            <div className="space-y-2 max-h-[400px] overflow-y-auto">
              {advisors.map((advisor) => (
                <button
                  key={advisor.id}
                  onClick={() => setSelectedAdvisorId(advisor.id)}
                  className={`w-full p-4 rounded-lg border-2 transition-all text-left ${selectedAdvisorId === advisor.id
                      ? 'border-primary bg-primary/10'
                      : 'border-border hover:border-primary/50'
                    }`}
                >
                  <div className="flex items-center space-x-3">
                    <div className="w-10 h-10 rounded-full bg-primary/20 flex items-center justify-center flex-shrink-0">
                      <Users className="h-5 w-5 text-primary" />
                    </div>
                    <div className="flex-1">
                      <p className="font-medium text-foreground">
                        {advisor.firstName} {advisor.lastName}
                      </p>
                      <p className="text-sm text-muted-foreground">{advisor.email}</p>
                    </div>
                  </div>
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="flex justify-end space-x-2 p-6 border-t border-border">
          <Button variant="outline" onClick={onClose}>
            Cancel
          </Button>
          <Button
            onClick={handleTransfer}
            disabled={!selectedAdvisorId || loading}
            className="bg-primary hover:bg-primary/90"
          >
            Transfer Chat
          </Button>
        </div>
      </div>
    </div>
  )
}
