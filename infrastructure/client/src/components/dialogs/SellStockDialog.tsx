import { useState } from "react"
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { useInvestment } from "@/hooks/useInvestment"
import { useTranslations } from 'next-intl'
import { Stock } from "@/services/investmentService"

interface SellStockDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  stock: Stock | null
  maxQuantity: number
  onSuccess: () => Promise<void>
}

export function SellStockDialog({ open, onOpenChange, stock, maxQuantity, onSuccess }: SellStockDialogProps) {
  const t = useTranslations('dashboard.client.investments')
  const tCommon = useTranslations('common')
  const { placeOrder, loading } = useInvestment()
  const [quantity, setQuantity] = useState<number>(1)
  const [error, setError] = useState<string | null>(null)

  const handleSell = async () => {
    if (!stock) return

    if (quantity > maxQuantity) {
      setError(t('insufficientShares'))
      return
    }

    const result = await placeOrder(
      stock.id,
      'SELL',
      quantity,
      Math.round(stock.currentPrice * 100) // Limit price in cents
    )

    if (result) {
      await onSuccess()
      onOpenChange(false)
      setQuantity(1)
    }
  }

  if (!stock) return null

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>{t('sellStock')} - {stock.symbol}</DialogTitle>
          <DialogDescription>
            {t('sellStockDescription')}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          <div className="space-y-2">
            <Label>{t('quantity')}</Label>
            <Input
              type="number"
              min="1"
              max={maxQuantity}
              value={quantity}
              onChange={(e) => setQuantity(Math.min(maxQuantity, Math.max(1, parseInt(e.target.value) || 1)))}
            />
            <p className="text-xs text-muted-foreground">
              {t('availableShares')}: {maxQuantity}
            </p>
          </div>

          <div className="flex justify-between items-center p-3 bg-muted rounded-lg">
            <span className="text-sm font-medium">{t('estimatedValue')}</span>
            <span className="text-lg font-bold">{(stock.currentPrice * quantity).toLocaleString('fr-FR')} €</span>
          </div>

          {error && (
            <p className="text-sm text-destructive">{error}</p>
          )}
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            {tCommon('cancel')}
          </Button>
          <Button onClick={handleSell} disabled={loading} variant="destructive">
            {loading ? tCommon('processing') : t('confirmSell')}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
