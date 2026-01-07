import { useState, useEffect } from "react"
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { useInvestment } from "@/hooks/useInvestment"
import { useTranslations } from 'next-intl'
import { Account } from "@/services/accountService"
import { Stock } from "@/services/investmentService"
import { ChevronDown, ChevronUp, Wallet } from "lucide-react"
import { motion, AnimatePresence } from "framer-motion"

interface BuyStockDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  accounts: Account[]
  onSuccess: () => Promise<void>
}

export function BuyStockDialog({ open, onOpenChange, accounts, onSuccess }: BuyStockDialogProps) {
  const t = useTranslations('dashboard.client.investments')
  const tCommon = useTranslations('common')
  const { stocks, fetchStocks, placeOrder, loading } = useInvestment()
  const [selectedAccount, setSelectedAccount] = useState<Account | null>(null)
  const [selectedStock, setSelectedStock] = useState<Stock | null>(null)
  const [quantity, setQuantity] = useState<number>(1)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (open) {
      fetchStocks(false) // Fetch only active stocks
      setSelectedStock(null)
      setQuantity(1)
      setError(null)
      // Auto-select first active account if available
      const activeAccount = accounts.find(a => !a.isSavings) || accounts[0]
      if (activeAccount) setSelectedAccount(activeAccount)
    }
  }, [open, fetchStocks, accounts])

  const handleBuy = async () => {
    if (!selectedAccount || !selectedStock) return

    const totalCost = selectedStock.currentPrice * quantity * 100 // In cents
    const accountBalanceInCents = selectedAccount.balance * 100

    if (totalCost > accountBalanceInCents) {
      setError(t('insufficientFunds'))
      return
    }

    const result = await placeOrder(
      selectedStock.id,
      'BUY',
      quantity,
      Math.round(selectedStock.currentPrice * 100) // Limit price in cents
    )

    if (result) {
      await onSuccess()
      onOpenChange(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[600px] max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{t('buyStock')}</DialogTitle>
          <DialogDescription>
            {t('buyStockDescription')}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6 py-4">
          {/* Account Selection */}
          <div className="space-y-2">
            <Label>{t('selectAccount')}</Label>
            <div className="grid grid-cols-1 gap-2">
              {accounts.map((account) => (
                <div
                  key={account.id}
                  onClick={() => setSelectedAccount(account)}
                  className={`p-3 rounded-lg border cursor-pointer transition-all ${selectedAccount?.id === account.id
                    ? 'border-primary bg-primary/5 ring-1 ring-primary'
                    : 'border-border hover:border-primary/50'
                    }`}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-3">
                      <Wallet className={`h-5 w-5 ${selectedAccount?.id === account.id ? 'text-primary' : 'text-muted-foreground'}`} />
                      <div>
                        <p className="font-medium">{account.name}</p>
                        <p className="text-xs text-muted-foreground">{account.iban}</p>
                      </div>
                    </div>
                    <p className="font-bold">{account.balance.toLocaleString('fr-FR')} €</p>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Stock Selection */}
          <div className="space-y-2">
            <Label>{t('availableStocks')}</Label>
            <div className="space-y-2">
              {stocks.map((stock) => (
                <div
                  key={stock.id}
                  className={`border rounded-lg transition-all ${selectedStock?.id === stock.id ? 'border-primary bg-background' : 'border-border bg-background/50'
                    }`}
                >
                  <div
                    onClick={() => {
                      setSelectedStock(selectedStock?.id === stock.id ? null : stock)
                      setQuantity(1)
                      setError(null)
                    }}
                    className="p-4 flex items-center justify-between cursor-pointer"
                  >
                    <div>
                      <p className="font-semibold">{stock.symbol} - {stock.name}</p>
                      <p className="text-sm text-muted-foreground">{stock.currentPrice.toLocaleString('fr-FR')} €</p>
                    </div>
                    {selectedStock?.id === stock.id ? <ChevronUp className="h-5 w-5" /> : <ChevronDown className="h-5 w-5" />}
                  </div>

                  <AnimatePresence>
                    {selectedStock?.id === stock.id && (
                      <motion.div
                        initial={{ height: 0, opacity: 0 }}
                        animate={{ height: 'auto', opacity: 1 }}
                        exit={{ height: 0, opacity: 0 }}
                        className="overflow-hidden"
                      >
                        <div className="p-4 pt-0 border-t border-border/50 space-y-4">
                          <div className="flex items-center space-x-4">
                            <div className="flex-1">
                              <Label htmlFor={`qty-${stock.id}`}>{t('quantity')}</Label>
                              <Input
                                id={`qty-${stock.id}`}
                                type="number"
                                min="1"
                                value={quantity}
                                onChange={(e) => setQuantity(Math.max(1, parseInt(e.target.value) || 1))}
                                className="mt-1"
                              />
                            </div>
                            <div className="text-right">
                              <p className="text-sm text-muted-foreground">{t('totalCost')}</p>
                              <p className="text-xl font-bold text-primary">
                                {(stock.currentPrice * quantity).toLocaleString('fr-FR')} €
                              </p>
                            </div>
                          </div>

                          {error && (
                            <p className="text-sm text-destructive">{error}</p>
                          )}

                          <Button
                            className="w-full"
                            disabled={!selectedAccount || loading}
                            onClick={handleBuy}
                          >
                            {loading ? tCommon('processing') : t('confirmBuy')}
                          </Button>
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
              ))}
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}
