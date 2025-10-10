"use client"

import { useState, useEffect } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { X, Settings, Loader2 } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { accountService } from "@/services/accountService"
import toast from "react-hot-toast"

interface EditAccountDialogProps {
  isOpen: boolean
  onClose: () => void
  accountId: string
  currentName: string
  onAccountUpdated?: () => void
}

export function EditAccountDialog({ 
  isOpen, 
  onClose, 
  accountId,
  currentName,
  onAccountUpdated 
}: EditAccountDialogProps) {
  const [formData, setFormData] = useState({
    name: currentName
  })
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    if (isOpen) {
      setFormData({ name: currentName })
    }
  }, [isOpen, currentName])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!formData.name.trim()) {
      toast.error('Account name is required')
      return
    }

    if (formData.name.trim() === currentName) {
      toast.error('No changes made')
      return
    }

    setLoading(true)
    
    try {
      const token = localStorage.getItem('auth_token')
      if (token) {
        accountService.setAuthToken(token)
      }

      const response = await accountService.updateAccount(accountId, {
        name: formData.name.trim()
      })

      if (response.success) {
        toast.success('Account name updated successfully!')
        onAccountUpdated?.()
        onClose()
      } else {
        toast.error(response.error || 'Failed to update account')
      }
    } catch (error) {
      toast.error('Network error occurred')
    } finally {
      setLoading(false)
    }
  }

  const handleClose = () => {
    if (!loading) {
      setFormData({ name: currentName })
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
            <div className="flex items-center justify-between p-6 border-b border-border/30">
              <div className="flex items-center space-x-3">
                <div className="w-10 h-10 bg-primary/20 rounded-lg flex items-center justify-center">
                  <Settings className="h-5 w-5 text-primary" />
                </div>
                <div>
                  <h2 className="text-lg font-semibold text-foreground">
                    Edit Account
                  </h2>
                  <p className="text-sm text-muted-foreground">
                    Update account name
                  </p>
                </div>
              </div>
              <Button
                variant="ghost"
                size="sm"
                onClick={handleClose}
                disabled={loading}
                className="h-8 w-8 p-0 hover:bg-background/60"
              >
                <X className="h-4 w-4" />
              </Button>
            </div>

            {/* Form */}
            <form onSubmit={handleSubmit} className="p-6 space-y-6">
              {/* Account Name */}
              <div className="space-y-2">
                <Label htmlFor="name" className="text-sm font-medium text-foreground">
                  Account Name *
                </Label>
                <Input
                  id="name"
                  type="text"
                  placeholder="Enter new account name..."
                  value={formData.name}
                  onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                  disabled={loading}
                  className="bg-background/60 border-border/30 focus:border-primary/50"
                  required
                />
                <p className="text-xs text-muted-foreground">
                  Current name: <span className="font-medium">{currentName}</span>
                </p>
              </div>

              {/* Actions */}
              <div className="flex space-x-3 pt-4">
                <Button
                  type="button"
                  variant="outline"
                  onClick={handleClose}
                  disabled={loading}
                  className="flex-1 border-border/30 hover:bg-background/60"
                >
                  Cancel
                </Button>
                <Button
                  type="submit"
                  disabled={loading || !formData.name.trim() || formData.name.trim() === currentName}
                  className="flex-1 bg-primary hover:bg-primary/80 text-white"
                >
                  {loading ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Updating...
                    </>
                  ) : (
                    <>
                      <Settings className="mr-2 h-4 w-4" />
                      Update Name
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
