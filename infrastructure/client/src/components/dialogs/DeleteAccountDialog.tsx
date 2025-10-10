"use client"

import { useState, useEffect } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { X, Trash2, Loader2, CreditCard, ArrowRight } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group"
import { accountService, Account } from "@/services/accountService"
import toast from "react-hot-toast"

interface DeleteAccountDialogProps {
  isOpen: boolean
  onClose: () => void
  accountToDelete: Account | null
  userAccounts: Account[]
  onAccountDeleted?: () => void
}

export function DeleteAccountDialog({ 
  isOpen, 
  onClose, 
  accountToDelete,
  userAccounts,
  onAccountDeleted 
}: DeleteAccountDialogProps) {
  const [transferOption, setTransferOption] = useState<'own' | 'external'>('own')
  const [selectedAccountId, setSelectedAccountId] = useState('')
  const [externalIban, setExternalIban] = useState('')
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    if (isOpen && userAccounts.length > 0) {
      // Select first available account by default
      const otherAccounts = userAccounts.filter(acc => acc.id !== accountToDelete?.id)
      if (otherAccounts.length > 0) {
        setSelectedAccountId(otherAccounts[0].id)
      }
    }
  }, [isOpen, userAccounts, accountToDelete])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!accountToDelete) return

    if (accountToDelete.balance > 0) {
      if (transferOption === 'own' && !selectedAccountId) {
        toast.error('Please select an account to transfer funds to')
        return
      }
      
      if (transferOption === 'external' && !externalIban.trim()) {
        toast.error('Please enter an IBAN to transfer funds to')
        return
      }
    }

    setLoading(true)
    
    try {
      const token = localStorage.getItem('auth_token')
      if (token) {
        accountService.setAuthToken(token)
      }

      let transferIban: string | undefined
      
      if (accountToDelete.balance > 0) {
        if (transferOption === 'own') {
          const selectedAccount = userAccounts.find(acc => acc.id === selectedAccountId)
          if (selectedAccount) {
            transferIban = selectedAccount.iban.replace(/\s/g, '')
          }
        } else {
          transferIban = externalIban.replace(/\s/g, '')
        }
      }

      const response = await accountService.deleteAccount(accountToDelete.id, {
        transferIban
      })

      if (response.success) {
        toast.success('Account deleted successfully!')
        onAccountDeleted?.()
        onClose()
        resetForm()
      } else {
        toast.error(response.error || 'Failed to delete account')
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
    setTransferOption('own')
    setSelectedAccountId('')
    setExternalIban('')
  }

  const otherAccounts = userAccounts.filter(acc => acc.id !== accountToDelete?.id)

  return (
    <AnimatePresence>
      {isOpen && accountToDelete && (
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
            className="relative w-full max-w-lg mx-4 bg-background/95 backdrop-blur-xl border border-border/50 rounded-xl shadow-2xl"
            initial={{ opacity: 0, scale: 0.95, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 20 }}
            transition={{ duration: 0.3 }}
          >
            {/* Header */}
            <div className="flex items-center justify-between p-6 border-b border-border/30">
              <div className="flex items-center space-x-3">
                <div className="w-10 h-10 bg-red-500/20 rounded-lg flex items-center justify-center">
                  <Trash2 className="h-5 w-5 text-red-500" />
                </div>
                <div>
                  <h2 className="text-lg font-semibold text-foreground">
                    Delete Account
                  </h2>
                  <p className="text-sm text-muted-foreground">
                    {accountToDelete.name}
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
            <div className="p-6 space-y-6">
              {/* Account Info */}
              <div className="p-4 bg-background/40 rounded-lg border border-border/30">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="font-medium text-foreground">{accountToDelete.name}</p>
                    <p className="text-sm text-muted-foreground">{accountToDelete.iban}</p>
                  </div>
                  <div className="text-right">
                    <p className="font-bold text-foreground">
                      {accountToDelete.balance.toLocaleString('fr-FR')} €
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {accountToDelete.isSavings ? 'Savings' : 'Current'}
                    </p>
                  </div>
                </div>
              </div>

              {/* Transfer Options */}
              {accountToDelete.balance > 0 && (
                <div className="space-y-4">
                  <Label className="text-sm font-medium text-foreground">
                    Transfer funds to:
                  </Label>
                  
                  <RadioGroup
                    value={transferOption}
                    onValueChange={(value: 'own' | 'external') => setTransferOption(value)}
                    className="space-y-3"
                  >
                    {/* Own Accounts */}
                    {otherAccounts.length > 0 && (
                      <div className="space-y-2">
                        <div className="flex items-center space-x-2">
                          <RadioGroupItem value="own" id="own" />
                          <Label htmlFor="own" className="text-sm font-medium text-foreground cursor-pointer">
                            My other accounts
                          </Label>
                        </div>
                        
                        {transferOption === 'own' && (
                          <div className="ml-6 space-y-2">
                            {otherAccounts.map((account) => (
                              <div 
                                key={account.id} 
                                className={`flex items-center space-x-2 p-2 rounded-lg cursor-pointer transition-colors ${
                                  selectedAccountId === account.id ? 'bg-primary/10 border border-primary/20' : 'hover:bg-background/40'
                                }`}
                                onClick={(e: React.MouseEvent) => {
                                  e.stopPropagation()
                                  setSelectedAccountId(account.id)
                                }}
                              >
                                <div className={`w-4 h-4 rounded-full border-2 ${
                                  selectedAccountId === account.id 
                                    ? 'border-primary bg-primary' 
                                    : 'border-border'
                                }`}>
                                  {selectedAccountId === account.id && (
                                    <div className="w-2 h-2 bg-white rounded-full m-0.5" />
                                  )}
                                </div>
                                <div className="flex-1">
                                  <div className="flex items-center justify-between">
                                    <span className={`text-sm ${selectedAccountId === account.id ? 'text-primary font-medium' : 'text-muted-foreground'}`}>
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

                    {/* External IBAN */}
                    <div className="space-y-2">
                      <div className="flex items-center space-x-2">
                        <RadioGroupItem value="external" id="external" />
                        <Label htmlFor="external" className="text-sm font-medium text-foreground cursor-pointer">
                          External IBAN
                        </Label>
                      </div>
                      
                      {transferOption === 'external' && (
                        <div className="ml-6 space-y-2">
                          <Input
                            type="text"
                            placeholder="FR76 3000 1007 9412 3456 7890 123"
                            value={externalIban}
                            onChange={(e) => setExternalIban(e.target.value)}
                            disabled={loading}
                            className="bg-background/60 border-border/30 focus:border-primary/50"
                          />
                          <p className="text-xs text-muted-foreground">
                            Enter the IBAN of the account to transfer funds to
                          </p>
                        </div>
                      )}
                    </div>
                  </RadioGroup>
                </div>
              )}

              {/* Warning */}
              <div className="p-4 bg-red-500/10 border border-red-500/20 rounded-lg">
                <div className="flex items-start space-x-2">
                  <Trash2 className="h-4 w-4 text-red-500 mt-0.5" />
                  <div>
                    <p className="text-sm font-medium text-red-500">Warning</p>
                    <p className="text-xs text-red-400 mt-1">
                      This action cannot be undone. The account will be permanently deleted.
                      {accountToDelete.balance > 0 && ' Funds will be transferred as specified above.'}
                    </p>
                  </div>
                </div>
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
                  type="button"
                  onClick={handleSubmit}
                  disabled={loading || (accountToDelete.balance > 0 && transferOption === 'own' && !selectedAccountId) || (accountToDelete.balance > 0 && transferOption === 'external' && !externalIban.trim())}
                  className="flex-1 bg-red-500 hover:bg-red-600 text-white"
                >
                  {loading ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Deleting...
                    </>
                  ) : (
                    <>
                      <Trash2 className="mr-2 h-4 w-4" />
                      Delete Account
                    </>
                  )}
                </Button>
              </div>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  )
}
