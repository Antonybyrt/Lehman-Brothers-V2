"use client"

import { useState, useEffect } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { X, MessageSquare, Loader2 } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { chatService } from "@/services/chatService"
import { authService } from "@/services/authService"
import toast from "react-hot-toast"

interface CreateChatDialogProps {
  isOpen: boolean
  onClose: () => void
  onChatCreated?: (chatId: string) => void
  userRole?: string | null
}

interface Client {
  id: string
  email: string
  firstName: string
  lastName: string
  role: string
}

export function CreateChatDialog({
  isOpen,
  onClose,
  onChatCreated,
  userRole
}: CreateChatDialogProps) {
  const [subject, setSubject] = useState('')
  const [selectedClientId, setSelectedClientId] = useState('')
  const [clients, setClients] = useState<Client[]>([])
  const [loadingClients, setLoadingClients] = useState(false)
  const [loading, setLoading] = useState(false)

  const isAdvisor = userRole === 'ADVISOR' || userRole === 'DIRECTOR'

  // Charger les clients quand le dialog s'ouvre (pour les advisors)
  useEffect(() => {
    if (isOpen && isAdvisor) {
      loadClients()
    }
  }, [isOpen, isAdvisor])

  const loadClients = async () => {
    setLoadingClients(true)
    try {
      const token = localStorage.getItem('auth_token')
      if (token) {
        authService.setAuthToken(token)
      }

      const response = await authService.getAllUsers()

      if (response.success && response.users) {
        // Filtrer uniquement les clients
        const clientsList = response.users.filter(user => user.role === 'CLIENT')
        setClients(clientsList)
      } else {
        toast.error('Failed to load clients')
      }
    } catch (error) {
      console.error('Error loading clients:', error)
      toast.error('Failed to load clients')
    } finally {
      setLoadingClients(false)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!subject.trim()) {
      toast.error('Subject is required')
      return
    }

    if (subject.length > 200) {
      toast.error('Subject must be 200 characters or less')
      return
    }

    // Pour les advisors, vérifier qu'un client est sélectionné
    if (isAdvisor && !selectedClientId) {
      toast.error('Please select a client')
      return
    }

    setLoading(true)

    try {
      const token = localStorage.getItem('auth_token')
      if (token) {
        chatService.setAuthToken(token)
      }

      const response = await chatService.createChat({
        subject: subject.trim(),
        ...(isAdvisor && selectedClientId ? { clientId: selectedClientId } : {})
      })

      if (response.success && response.chatId) {
        toast.success('Chat created successfully!')
        setSubject('')
        setSelectedClientId('')
        onChatCreated?.(response.chatId)
        onClose()
      } else {
        toast.error(response.error || 'Failed to create chat')
      }
    } catch {
      toast.error('Network error occurred')
    } finally {
      setLoading(false)
    }
  }

  const handleClose = () => {
    if (!loading) {
      setSubject('')
      onClose()
    }
  }

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          className="fixed inset-0 z-50 flex items-center justify-center"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.2 }}
        >
          {/* Backdrop */}
          <div
            className="absolute inset-0 bg-black/50 backdrop-blur-sm"
            onClick={handleClose}
          />

          {/* Modal */}
          <motion.div
            className="relative w-full max-w-md mx-4 bg-background/95 backdrop-blur-xl border border-border/50 rounded-xl shadow-2xl"
            initial={{ opacity: 0, scale: 0.95, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 20 }}
            transition={{ duration: 0.3 }}
          >
            {/* Header */}
            <div className="flex items-center justify-between p-6 border-b border-border/50">
              <div className="flex items-center space-x-3">
                <div className="w-10 h-10 bg-gradient-to-br from-primary/20 to-primary/10 rounded-lg flex items-center justify-center">
                  <MessageSquare className="h-5 w-5 text-primary" />
                </div>
                <div>
                  <h2 className="text-xl font-semibold text-foreground">New Support Chat</h2>
                  <p className="text-sm text-muted-foreground">Contact our advisors</p>
                </div>
              </div>
              <button
                onClick={handleClose}
                disabled={loading}
                className="text-muted-foreground hover:text-foreground transition-colors disabled:opacity-50"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            {/* Form */}
            <form onSubmit={handleSubmit} className="p-6 space-y-4">
              {/* Sélecteur de client (pour advisors uniquement) */}
              {isAdvisor && (
                <div className="space-y-2">
                  <Label htmlFor="client" className="text-foreground">
                    Client <span className="text-red-500">*</span>
                  </Label>
                  {loadingClients ? (
                    <div className="flex items-center justify-center py-4">
                      <Loader2 className="h-5 w-5 animate-spin text-primary" />
                    </div>
                  ) : (
                    <select
                      id="client"
                      value={selectedClientId}
                      onChange={(e) => setSelectedClientId(e.target.value)}
                      disabled={loading}
                      className="w-full px-3 py-2 bg-background/50 border border-border/50 rounded-md focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      <option value="">Select a client...</option>
                      {clients.map((client) => (
                        <option key={client.id} value={client.id}>
                          {client.firstName} {client.lastName} ({client.email})
                        </option>
                      ))}
                    </select>
                  )}
                </div>
              )}

              <div className="space-y-2">
                <Label htmlFor="subject" className="text-foreground">
                  Subject <span className="text-red-500">*</span>
                </Label>
                <Input
                  id="subject"
                  type="text"
                  placeholder="e.g., Question about my account"
                  value={subject}
                  onChange={(e) => setSubject(e.target.value)}
                  disabled={loading}
                  maxLength={200}
                  className="bg-background/50 border-border/50 focus:border-primary"
                />
                <p className="text-xs text-muted-foreground">
                  {subject.length}/200 characters
                </p>
              </div>

              {/* Actions */}
              <div className="flex space-x-3 pt-4">
                <Button
                  type="button"
                  variant="outline"
                  onClick={handleClose}
                  disabled={loading}
                  className="flex-1"
                >
                  Cancel
                </Button>
                <Button
                  type="submit"
                  disabled={loading || !subject.trim()}
                  className="flex-1 bg-primary hover:bg-primary/90"
                >
                  {loading ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Creating...
                    </>
                  ) : (
                    <>
                      <MessageSquare className="mr-2 h-4 w-4" />
                      Create Chat
                    </>
                  )}
                </Button>
              </div>
            </form>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  )
}
