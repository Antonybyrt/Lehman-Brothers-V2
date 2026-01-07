import React, { useState, useEffect } from 'react';
import { useInvestment } from '../../hooks/useInvestment';
import { Order, Stock } from '../../services/investmentService';
import { Account } from '../../services/accountService';
import { useTranslations } from 'next-intl';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";

interface ClientOrdersViewProps {
  stocks: Stock[];
  orders: Order[];
  accounts: Account[];
  onRefresh: () => Promise<void>;
}

export const ClientOrdersView: React.FC<ClientOrdersViewProps> = ({ stocks, orders, accounts, onRefresh }) => {
  const t = useTranslations();
  const { stockOrders, fetchStockOrders, cancelOrder, placeOrder, loading } = useInvestment();
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);
  const [filterType, setFilterType] = useState<'ALL' | 'BUY' | 'SELL'>('ALL');

  // Buy Dialog State
  const [isBuyDialogOpen, setIsBuyDialogOpen] = useState(false);
  const [orderToBuy, setOrderToBuy] = useState<Order | null>(null);
  const [buyQuantity, setBuyQuantity] = useState<number>(1);
  const [selectedAccountId, setSelectedAccountId] = useState<string>('');

  useEffect(() => {
    if (selectedOrder) {
      fetchStockOrders(selectedOrder.stockId);
    }
  }, [selectedOrder, fetchStockOrders]);

  const handleOrderClick = (order: Order) => {
    setSelectedOrder(order);
  };

  const handleCancelOrder = async (orderId: string) => {
    if (window.confirm(t('common.confirm'))) {
      const success = await cancelOrder(orderId);
      if (success) {
        await onRefresh();
        if (selectedOrder?.id === orderId) {
          setSelectedOrder(null);
        }
      }
    }
  };

  const handleBuyClick = (order: Order) => {
    setOrderToBuy(order);
    setBuyQuantity(order.quantity);
    if (accounts.length > 0) {
      setSelectedAccountId(accounts[0].id);
    }
    setIsBuyDialogOpen(true);
  };

  const handleConfirmBuy = async () => {
    if (!orderToBuy || !selectedAccountId) return;

    const result = await placeOrder(
      orderToBuy.stockId,
      'BUY',
      buyQuantity,
      orderToBuy.limitPrice,
      selectedAccountId
    );

    if (result) {
      setIsBuyDialogOpen(false);
      setOrderToBuy(null);
      await onRefresh();
      if (selectedOrder) {
        fetchStockOrders(selectedOrder.stockId);
      }
    }
  };

  const getStockName = (stockId: string) => {
    const stock = stocks.find(s => s.id === stockId);
    return stock ? stock.name : stockId;
  };

  const getStockSymbol = (stockId: string) => {
    const stock = stocks.find(s => s.id === stockId);
    return stock ? stock.symbol : stockId;
  };

  const filteredOrders = orders
    .filter(order => order.status === 'PENDING')
    .filter(order => filterType === 'ALL' || order.type === filterType);

  return (
    <div className="flex h-[600px] gap-6">
      {/* Sidebar: User Orders */}
      <div className="w-1/3 border-r border-white/10 pr-6 overflow-y-auto">
        <div className="flex justify-between items-center mb-4">
          <h3 className="text-lg font-medium text-white">{t('dashboard.client.investments.myOrders')}</h3>
        </div>

        {/* Filters */}
        <div className="flex gap-2 mb-4">
          <button
            onClick={() => setFilterType('ALL')}
            className={`px-3 py-1 rounded-full text-xs font-medium transition-colors ${filterType === 'ALL' ? 'bg-white text-black' : 'bg-white/10 text-white hover:bg-white/20'
              }`}
          >
            {t('common.all')}
          </button>
          <button
            onClick={() => setFilterType('BUY')}
            className={`px-3 py-1 rounded-full text-xs font-medium transition-colors ${filterType === 'BUY' ? 'bg-green-500 text-white' : 'bg-white/10 text-white hover:bg-white/20'
              }`}
          >
            {t('dashboard.client.investments.buy')}
          </button>
          <button
            onClick={() => setFilterType('SELL')}
            className={`px-3 py-1 rounded-full text-xs font-medium transition-colors ${filterType === 'SELL' ? 'bg-red-500 text-white' : 'bg-white/10 text-white hover:bg-white/20'
              }`}
          >
            {t('dashboard.client.investments.sell')}
          </button>
        </div>

        {filteredOrders.length === 0 ? (
          <p className="text-white/50 text-sm">{t('dashboard.client.investments.noOrders')}</p>
        ) : (
          <div className="space-y-3">
            {filteredOrders.map((order) => (
              <div
                key={order.id}
                onClick={() => handleOrderClick(order)}
                className={`p-4 rounded-xl border cursor-pointer transition-all ${selectedOrder?.id === order.id
                  ? 'bg-white/10 border-white/20'
                  : 'bg-white/5 border-white/10 hover:bg-white/10'
                  }`}
              >
                <div className="flex justify-between items-start mb-2">
                  <div>
                    <span className={`text-xs font-bold px-2 py-1 rounded-full ${order.type === 'BUY' ? 'bg-green-500/20 text-green-400' : 'bg-red-500/20 text-red-400'
                      }`}>
                      {order.type}
                    </span>
                    <h4 className="text-white font-medium mt-2">{getStockSymbol(order.stockId)}</h4>
                  </div>
                  <span className="text-xs text-white/50">
                    {new Date(order.createdAt).toLocaleDateString()}
                  </span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-white/70">{t('dashboard.client.investments.quantity')}: {order.quantity}</span>
                  <span className="text-white/70">
                    {(order.limitPrice / 100).toLocaleString('fr-FR', { style: 'currency', currency: 'EUR' })}
                  </span>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Main Area: Order Details & Market */}
      <div className="flex-1 overflow-y-auto">
        {selectedOrder ? (
          <div className="space-y-6">
            <div className="bg-white/5 rounded-2xl p-6 border border-white/10">
              <div className="flex justify-between items-center mb-6">
                <div>
                  <h3 className="text-xl font-bold text-white mb-1">
                    {getStockName(selectedOrder.stockId)}
                  </h3>
                  <p className="text-white/50 text-sm">ID: {selectedOrder.id}</p>
                </div>
                <button
                  onClick={() => handleCancelOrder(selectedOrder.id)}
                  className="px-4 py-2 bg-red-500/10 text-red-400 rounded-lg hover:bg-red-500/20 transition-colors text-sm font-medium"
                >
                  {t('common.cancel')}
                </button>
              </div>

              <div className="grid grid-cols-3 gap-4 mb-6">
                <div className="p-4 bg-white/5 rounded-xl">
                  <p className="text-white/50 text-xs mb-1">{t('dashboard.client.investments.type')}</p>
                  <p className={`font-medium ${selectedOrder.type === 'BUY' ? 'text-green-400' : 'text-red-400'}`}>
                    {selectedOrder.type}
                  </p>
                </div>
                <div className="p-4 bg-white/5 rounded-xl">
                  <p className="text-white/50 text-xs mb-1">{t('dashboard.client.investments.quantity')}</p>
                  <p className="text-white font-medium">{selectedOrder.quantity}</p>
                </div>
                <div className="p-4 bg-white/5 rounded-xl">
                  <p className="text-white/50 text-xs mb-1">{t('dashboard.client.investments.price')}</p>
                  <p className="text-white font-medium">
                    {(selectedOrder.limitPrice / 100).toLocaleString('fr-FR', { style: 'currency', currency: 'EUR' })}
                  </p>
                </div>
              </div>
            </div>

            <div>
              <h4 className="text-lg font-medium text-white mb-4">{t('dashboard.client.investments.marketOrders')}</h4>
              <div className="bg-white/5 rounded-2xl border border-white/10 overflow-hidden">
                <table className="w-full text-left">
                  <thead>
                    <tr className="border-b border-white/10">
                      <th className="p-4 text-xs font-medium text-white/50 uppercase">{t('dashboard.client.investments.type')}</th>
                      <th className="p-4 text-xs font-medium text-white/50 uppercase">{t('dashboard.client.investments.quantity')}</th>
                      <th className="p-4 text-xs font-medium text-white/50 uppercase">{t('dashboard.client.investments.price')}</th>
                      <th className="p-4 text-xs font-medium text-white/50 uppercase">{t('dashboard.client.investments.date')}</th>
                      <th className="p-4 text-xs font-medium text-white/50 uppercase">{t('common.actions')}</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-white/5">
                    {stockOrders.length === 0 ? (
                      <tr>
                        <td colSpan={5} className="p-8 text-center text-white/50">
                          {t('dashboard.client.investments.noMarketOrders')}
                        </td>
                      </tr>
                    ) : (
                      stockOrders
                        .filter(o => o.id !== selectedOrder.id) // Exclude current order
                        .map((order) => (
                          <tr key={order.id} className="hover:bg-white/5 transition-colors">
                            <td className="p-4">
                              <span className={`text-xs font-bold px-2 py-1 rounded-full ${order.type === 'BUY' ? 'bg-green-500/20 text-green-400' : 'bg-red-500/20 text-red-400'
                                }`}>
                                {order.type}
                              </span>
                            </td>
                            <td className="p-4 text-white">{order.quantity}</td>
                            <td className="p-4 text-white">
                              {(order.limitPrice / 100).toLocaleString('fr-FR', { style: 'currency', currency: 'EUR' })}
                            </td>
                            <td className="p-4 text-white/50 text-sm">
                              {new Date(order.createdAt).toLocaleDateString()}
                            </td>
                            <td className="p-4">
                              {order.type === 'SELL' && (
                                <Button
                                  size="sm"
                                  className="bg-green-500 hover:bg-green-600 text-white"
                                  onClick={() => handleBuyClick(order)}
                                >
                                  {t('dashboard.client.investments.buy')}
                                </Button>
                              )}
                            </td>
                          </tr>
                        ))
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        ) : (
          <div className="h-full flex flex-col items-center justify-center text-white/30">
            <p>{t('dashboard.client.investments.selectOrder')}</p>
          </div>
        )}
      </div>

      <Dialog open={isBuyDialogOpen} onOpenChange={setIsBuyDialogOpen}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>{t('dashboard.client.investments.buyStock')}</DialogTitle>
            <DialogDescription>
              {t('dashboard.client.investments.buyStockDescription')}
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="account" className="text-right">
                {t('dashboard.client.accounts.title')}
              </Label>
              <select
                id="account"
                value={selectedAccountId}
                onChange={(e) => setSelectedAccountId(e.target.value)}
                className="col-span-3 flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
              >
                <option value="" disabled>{t('dashboard.client.investments.selectAccount')}</option>
                {accounts.map((account) => (
                  <option key={account.id} value={account.id}>
                    {account.name} ({account.balance.toLocaleString('fr-FR')} €)
                  </option>
                ))}
              </select>
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="quantity" className="text-right">
                {t('dashboard.client.investments.quantity')}
              </Label>
              <Input
                id="quantity"
                type="number"
                value={buyQuantity}
                onChange={(e) => setBuyQuantity(parseInt(e.target.value))}
                className="col-span-3"
                min={1}
                max={orderToBuy?.quantity}
              />
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label className="text-right">
                {t('dashboard.client.investments.totalCost')}
              </Label>
              <div className="col-span-3 font-bold">
                {orderToBuy && ((orderToBuy.limitPrice * buyQuantity) / 100).toLocaleString('fr-FR', { style: 'currency', currency: 'EUR' })}
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button type="submit" onClick={handleConfirmBuy} disabled={loading}>
              {loading ? t('common.processing') : t('dashboard.client.investments.confirmBuy')}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};
