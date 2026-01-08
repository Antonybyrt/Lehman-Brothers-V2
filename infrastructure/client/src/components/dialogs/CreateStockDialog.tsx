import { useState } from "react"
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { useInvestment } from "@/hooks/useInvestment"
import { useTranslations } from 'next-intl'

interface CreateStockDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  onSuccess?: () => void
}

export function CreateStockDialog({ open, onOpenChange, onSuccess }: CreateStockDialogProps) {
  const t = useTranslations('dashboard.director.management')
  const tCommon = useTranslations('common')
  const { createStock, loading } = useInvestment()

  const [formData, setFormData] = useState({
    symbol: '',
    name: '',
    isin: '',
    price: '',
    quantity: ''
  })

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    const priceInCents = Math.round(parseFloat(formData.price) * 100)
    const quantity = parseInt(formData.quantity)

    const result = await createStock(
      formData.symbol,
      formData.name,
      formData.isin,
      priceInCents,
      quantity
    )

    if (result) {
      onOpenChange(false)
      setFormData({ symbol: '', name: '', isin: '', price: '', quantity: '' })
      if (onSuccess) {
        onSuccess()
      }
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>{t('addStock')}</DialogTitle>
          <DialogDescription>
            {t('createStockDescription')}
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="symbol">{t('symbol')}</Label>
              <Input
                id="symbol"
                placeholder="AAPL"
                value={formData.symbol}
                onChange={(e) => setFormData({ ...formData, symbol: e.target.value.toUpperCase() })}
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="isin">{t('isin')}</Label>
              <Input
                id="isin"
                placeholder="US0378331005"
                value={formData.isin}
                onChange={(e) => setFormData({ ...formData, isin: e.target.value })}
                required
              />
            </div>
          </div>
          <div className="space-y-2">
            <Label htmlFor="name">{t('companyName')}</Label>
            <Input
              id="name"
              placeholder="Apple Inc."
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              required
            />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="price">{t('initialPrice')} (€)</Label>
              <Input
                id="price"
                type="number"
                step="0.01"
                min="0"
                placeholder="150.00"
                value={formData.price}
                onChange={(e) => setFormData({ ...formData, price: e.target.value })}
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="quantity">{t('initialQuantity')}</Label>
              <Input
                id="quantity"
                type="number"
                min="1"
                placeholder="1000"
                value={formData.quantity}
                onChange={(e) => setFormData({ ...formData, quantity: e.target.value })}
                required
              />
            </div>
          </div>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              {tCommon('cancel')}
            </Button>
            <Button type="submit" disabled={loading}>
              {loading ? tCommon('processing') : t('createStock')}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
