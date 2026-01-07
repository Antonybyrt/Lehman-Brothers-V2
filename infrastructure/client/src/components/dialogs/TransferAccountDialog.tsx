"use client"

import { useState, useEffect } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { X, ArrowRightLeft, Loader2, CreditCard, Building2 } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group"
import { accountService, Account } from "@/services/accountService"
import toast from "react-hot-toast"

interface TransferAccountDialogProps {
  isOpen: boolean
  onClose: () => void
  sourceAccount: Account | null
  userAccounts: Account[]
  onTransferComplete?: () => void
}

export function TransferAccountDialog({ 
  isOpen, 
  onClose, 
  sourceAccount,
  userAccounts,
  onTransferComplete 
}: TransferAccountDialogProps) {
  const [transferType, setTransferType] = useState<'internal' | 'external'>('internal')
  const [selectedAccountId, setSelectedAccountId] = useState('')
  const [externalIban, setExternalIban] = useState('')
  const [amount, setAmount] = useState('')
  const [description, setDescription] = useState('')
  const [loading, setLoading] = useState(false)

  // Reset form when dialog opens
  useEffect(() => {
    if (isOpen) {
      setTransferType('internal')
      setSelectedAccountId('')
      setExternalIban('')
      setAmount('')
      setDescription('')
      
      // Select first available account by default
      const otherAccounts = userAccounts.filter(acc => acc.id !== sourceAccount?.id)
      if (otherAccounts.length > 0) {
        setSelectedAccountId(otherAccounts[0].id)
      }
    }
  }, [isOpen, userAccounts, sourceAccount])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!sourceAccount) return

    const transferAmount = parseFloat(amount)

    // Validation
    if (isNaN(transferAmount) || transferAmount <= 0) {
      toast.error('Please enter a valid amount')
      return
    }

    if (transferAmount > sourceAccount.balance) {
      toast.error('Insufficient funds')
      return
    }

    if (transferType === 'internal' && !selectedAccountId) {
      toast.error('Please select an account to transfer to')
      return
    }
    
      if (transferType === 'external' && !externalIban.trim()) {
        toast.error('Please enter an IBAN')
        return
      }

      // Check if trying to transfer to same account
      const cleanedExternalIban = externalIban.replace(/\s/g, '')
      if (transferType === 'external' && cleanedExternalIban === sourceAccount.iban.replace(/\s/g, '')) {
        toast.error('Cannot transfer to the same account')
        return
      }

      setLoading(true)
    
      try {
        const token = localStorage.getItem('auth_token')
        if (token) {
          accountService.setAuthToken(token)
        }

        let targetIban: string
      
        if (transferType === 'internal') {
          const selectedAccount = userAccounts.find(acc => acc.id === selectedAccountId)
          if (!selectedAccount) {
            toast.error('Selected account not found')
            setLoading(false)
            return
          }
          targetIban = selectedAccount.iban.replace(/\s/g, '')
        } else {
          targetIban = externalIban.replace(/\s/g, '')
        }

        const response = await accountService.transferAccount(sourceAccount.id, {
          targetIban,
          amount: transferAmount,
          description: description.trim() || undefined
        })

        if (response.success) {
          toast.success(response.message || 'Transfer completed successfully!')
          onTransferComplete?.()
          onClose()
          resetForm()
        } else {
          toast.error(response.error || 'Failed to complete transfer')
        }
      } catch (error) {
        toast.error('Network error occurred')
      } finally {
        setLoading(false)
      }
    }

    const handleClose = () => {
    if (!loading) {
      resetForm()
      onClose()
    }
  }

  const resetForm = () => {
    setTransferType('internal')
    setSelectedAccountId('')
    setExternalIban('')
    setAmount('')
    setDescription('')
  }

  const otherAccounts = userAccounts.filter(acc => acc.id !== sourceAccount?.id)
  const hasOtherAccounts = otherAccounts.length > 0

  return (
    <AnimatePresence>
      {isOpen && sourceAccount && (
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
            className="relative w-full max-w-lg mx-4 bg-background/95 backdrop-blur-xl border border-border/50 rounded-xl shadow-2xl max-h-[90vh] overflow-y-auto"
            initial={{ opacity: 0, scale: 0.95, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 20 }}
            transition={{ duration: 0.3 }}
          >
            {/* Header */}
            <div className="flex items-center justify-between p-6 border-b border-border/30">
              <div className="flex items-center space-x-3">
                <div className="w-10 h-10 bg-primary/20 rounded-lg flex items-center justify-center">
                  <ArrowRightLeft className="h-5 w-5 text-primary" />
                </div>
                <div>
                  <h2 className="text-lg font-semibold text-foreground">
                    Transfer Funds
                  </h2>
                  <p className="text-sm text-muted-foreground">
                    From {sourceAccount.name}
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

            {/* Content */}
            <form onSubmit={handleSubmit} className="p-6 space-y-6">
              {/* Source Account Info */}
              <div className="p-4 bg-background/40 rounded-lg border border-border/30">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="font-medium text-foreground">{sourceAccount.name}</p>
                    <p className="text-sm text-muted-foreground">{sourceAccount.iban}</p>
                  </div>
                  <div className="text-right">
                    <p className="font-bold text-foreground">
                      {sourceAccount.balance.toLocaleString('fr-FR')} €
                    </p>
                    <p className="text-xs text-muted-foreground">
                      Available balance
                    </p>
                  </div>
                </div>
              </div>

              {/* Amount */}
              <div className="space-y-2">
                <Label htmlFor="amount" className="text-sm font-medium text-foreground">
                  Amount *
                </Label>
                <div className="relative">
                  <Input
                    id="amount"
                    type="number"
                    step="0.01"
                    min="0.01"
                    max={sourceAccount.balance}
                    placeholder="0.00"
                    value={amount}
                    onChange={(e) => setAmount(e.target.value)}
                    disabled={loading}
                    className="bg-background/60 border-border/30 focus:border-primary/50 pr-8"
                  />
                  <span className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground">€</span>
                </div>
                <p className="text-xs text-muted-foreground">
                  Max: {sourceAccount.balance.toLocaleString('fr-FR')} €
                </p>
              </div>

              {/* Transfer Type */}
              <div className="space-y-4">
                <Label className="text-sm font-medium text-foreground">
                  Transfer to:
                </Label>
                
                <RadioGroup
                  value={transferType}
                  onValueChange={(value: 'internal' | 'external') => setTransferType(value)}
                  className="space-y-3"
                >
                  {/* Internal Transfer (Own accounts) */}
                  {hasOtherAccounts && (
                    <div className="space-y-2">
                      <div className="flex items-center space-x-2">
                        <RadioGroupItem value="internal" id="internal" />
                        <Label htmlFor="internal" className="text-sm font-medium text-foreground cursor-pointer flex items-center">
                          <CreditCard className="h-4 w-4 mr-2 text-primary" />
                          My other accounts
                        </Label>
                      </div>
                      
                      {transferType === 'internal' && (
                        <div className="ml-6 space-y-2">
                          {otherAccounts.map((account) => (
                            <div 
                              key={account.id} 
                              className={`flex items-center space-x-2 p-3 rounded-lg cursor-pointer transition-colors ${
                                selectedAccountId === account.id 
                                  ? 'bg-primary/10 border border-primary/20' 
                                  : 'bg-background/40 hover:bg-background/60 border border-transparent'
                              }`}
                              onClick={() => setSelectedAccountId(account.id)}
                            >
                              <div className={`w-4 h-4 rounded-full border-2 flex items-center justify-center ${
                                selectedAccountId === account.id 
                                  ? 'border-primary bg-primary' 
                                  : 'border-border'
                              }`}>
                                {selectedAccountId === account.id && (
                                  <div className="w-2 h-2 bg-white rounded-full" />
                                )}
                              </div>
                              <div className="flex-1">
                                <div className="flex items-center justify-between">
                                  <span className={`text-sm ${selectedAccountId === account.id ? 'text-primary font-medium' : 'text-foreground'}`}>
                                    {account.name}
                                  </span>
                                  <span className="font-medium text-sm">{account.balance.toLocaleString('fr-FR')} €</span>
                                </div>
                                <p className="text-xs text-muted-foreground">{account.iban}</p>
                              </div>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  )}

                  {/* External Transfer */}
                  <div className="space-y-2">
                    <div className="flex items-center space-x-2">
                      <RadioGroupItem value="external" id="external" />
                      <Label htmlFor="external" className="text-sm font-medium text-foreground cursor-pointer flex items-center">
                        <Building2 className="h-4 w-4 mr-2 text-blue-500" />
                        External account (IBAN)
                      </Label>
                    </div>
                    
                    {transferType === 'external' && (
                      <div className="ml-6 space-y-2">
                        <Input
                          type="text"
                          placeholder="FR76 3000 1007 9412 3456 7890 123"
                          value={externalIban}
                          onChange={(e) => setExternalIban(e.target.value.toUpperCase())}
                          disabled={loading}
                          className="bg-background/60 border-border/30 focus:border-primary/50 font-mono"
                        />
                        <p className="text-xs text-muted-foreground">
                          Enter the IBAN of the recipient's account
                        </p>
                      </div>
                    )}
                  </div>
                </RadioGroup>
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
                  disabled={
                    loading || 
                    !amount || 
                    parseFloat(amount) <= 0 || 
                    parseFloat(amount) > sourceAccount.balance ||
                    (transferType === 'internal' && !selectedAccountId) || 
                    (transferType === 'external' && !externalIban.trim())
                  }
                  className="flex-1 bg-primary hover:bg-primary/90 text-primary-foreground"
                >
                  {loading ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Processing...
                    </>
                  ) : (
                    <>
                      <ArrowRightLeft className="mr-2 h-4 w-4" />
                      Transfer {amount ? `${parseFloat(amount).toLocaleString('fr-FR')} €` : ''}
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
