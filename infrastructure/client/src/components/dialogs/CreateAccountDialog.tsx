"use client"

import { useState } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { X, CreditCard, PiggyBank, Loader2 } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Switch } from "@/components/ui/switch"
import { accountService } from "@/services/accountService"
import toast from "react-hot-toast"

interface CreateAccountDialogProps {
  isOpen: boolean
  onClose: () => void
  isSavings?: boolean
  onAccountCreated?: () => void
}

export function CreateAccountDialog({ 
  isOpen, 
  onClose, 
  isSavings = false, 
  onAccountCreated 
}: CreateAccountDialogProps) {
  const [formData, setFormData] = useState({
    name: '',
    initialBalance: '',
    isSavings: isSavings
  })
  const [loading, setLoading] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!formData.name.trim()) {
      toast.error('Account name is required')
      return
    }

    setLoading(true)
    
    try {
      const token = localStorage.getItem('auth_token')
      if (token) {
        accountService.setAuthToken(token)
      }

      const response = await accountService.createAccount({
        name: formData.name.trim(),
        isSavings: formData.isSavings,
        initialBalance: formData.initialBalance ? parseFloat(formData.initialBalance) : undefined
      })

      if (response.success) {
        toast.success('Account created successfully!')
        setFormData({ name: '', initialBalance: '', isSavings: isSavings })
        onAccountCreated?.()
        onClose()
      } else {
        toast.error(response.error || 'Failed to create account')
      }
    } catch (error) {
      toast.error('Network error occurred')
    } finally {
      setLoading(false)
    }
  }

  const handleClose = () => {
    if (!loading) {
      setFormData({ name: '', initialBalance: '', isSavings: isSavings })
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
                <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${
                  formData.isSavings 
                    ? 'bg-blue-500/20' 
                    : 'bg-primary/20'
                }`}>
                  {formData.isSavings ? (
                    <PiggyBank className="h-5 w-5 text-blue-500" />
                  ) : (
                    <CreditCard className="h-5 w-5 text-primary" />
                  )}
                </div>
                <div>
                  <h2 className="text-lg font-semibold text-foreground">
                    {formData.isSavings ? 'Create Savings Account' : 'Create Account'}
                  </h2>
                  <p className="text-sm text-muted-foreground">
                    {formData.isSavings 
                      ? 'Open a new savings account' 
                      : 'Create a new account'
                    }
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
                  placeholder="e.g., Main Account, Travel Fund..."
                  value={formData.name}
                  onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                  disabled={loading}
                  className="bg-background/60 border-border/30 focus:border-primary/50"
                  required
                />
              </div>

              {/* Account Type */}
              <div className="space-y-3">
                <Label className="text-sm font-medium text-foreground">
                  Account Type
                </Label>
                <div className="flex items-center space-x-3 p-3 bg-background/40 rounded-lg border border-border/30">
                  <Switch
                    id="isSavings"
                    checked={formData.isSavings}
                    onCheckedChange={(checked: boolean) => setFormData(prev => ({ ...prev, isSavings: checked }))}
                    disabled={loading}
                  />
                  <div className="flex-1">
                    <Label htmlFor="isSavings" className="text-sm font-medium text-foreground cursor-pointer">
                      {formData.isSavings ? 'Savings Account' : 'Current Account'}
                    </Label>
                    <p className="text-xs text-muted-foreground">
                      {formData.isSavings 
                        ? 'Earn interest on your savings' 
                        : 'Perfect for daily transactions'
                      }
                    </p>
                  </div>
                </div>
              </div>

              {/* Initial Balance */}
              <div className="space-y-2">
                <Label htmlFor="initialBalance" className="text-sm font-medium text-foreground">
                  Initial Balance (€)
                </Label>
                <Input
                  id="initialBalance"
                  type="number"
                  step="0.01"
                  min="0"
                  placeholder="0.00"
                  value={formData.initialBalance}
                  onChange={(e) => setFormData(prev => ({ ...prev, initialBalance: e.target.value }))}
                  disabled={loading}
                  className="bg-background/60 border-border/30 focus:border-primary/50"
                />
                <p className="text-xs text-muted-foreground">
                  Optional. You can add money later.
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
                  disabled={loading || !formData.name.trim()}
                  className={`flex-1 ${
                    formData.isSavings 
                      ? 'bg-blue-500 hover:bg-blue-600' 
                      : 'bg-primary hover:bg-primary/80'
                  } text-white`}
                >
                  {loading ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Creating...
                    </>
                  ) : (
                    <>
                      {formData.isSavings ? (
                        <PiggyBank className="mr-2 h-4 w-4" />
                      ) : (
                        <CreditCard className="mr-2 h-4 w-4" />
                      )}
                      Create Account
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
