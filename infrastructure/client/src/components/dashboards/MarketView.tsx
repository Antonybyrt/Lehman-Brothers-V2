import React, { useState, useEffect, useMemo } from 'react';
import { useInvestment } from '../../hooks/useInvestment';
import { Order, Stock, Portfolio } from '../../services/investmentService';
import { Account } from '../../services/accountService';
import { useTranslations } from 'next-intl';
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Wallet, TrendingUp, History, AlertCircle } from 'lucide-react';

interface MarketViewProps {
  stocks: Stock[];
  orders: Order[];
  accounts: Account[];
  portfolio: Portfolio | null;
  onRefresh: () => Promise<void>;
}

export const MarketView: React.FC<MarketViewProps> = ({ stocks, orders, accounts, portfolio, onRefresh }) => {
  const t = useTranslations();
  const { stockOrders, fetchStockOrders, fetchStockTrades, cancelOrder, placeOrder, loading } = useInvestment();

  // State
  const [selectedStockId, setSelectedStockId] = useState<string>('');
  const [quantity, setQuantity] = useState<number>(1);
  const [selectedAccountId, setSelectedAccountId] = useState<string>('');
  const [listFilter, setListFilter] = useState<'MARKET' | 'MY_ORDERS'>('MARKET');
  const [trades, setTrades] = useState<any[]>([]);

  // Derived State
  const activeStocks = useMemo(() => stocks.filter(s => s.active), [stocks]);
  const selectedStock = useMemo(() => stocks.find(s => s.id === selectedStockId), [stocks, selectedStockId]);
  const selectedAccount = useMemo(() => accounts.find(a => a.id === selectedAccountId), [accounts, selectedAccountId]);

  const userHolding = useMemo(() => {
    if (!portfolio || !selectedStockId) return 0;
    const holding = portfolio.holdings.find(h => h.stockId === selectedStockId);
    return holding ? holding.quantity : 0;
  }, [portfolio, selectedStockId]);

  // Effects
  useEffect(() => {
    if (activeStocks.length > 0 && !selectedStockId) {
      setSelectedStockId(activeStocks[0].id);
    }
  }, [activeStocks, selectedStockId]);

  useEffect(() => {
    if (accounts.length > 0 && !selectedAccountId) {
      setSelectedAccountId(accounts[0].id);
    }
  }, [accounts, selectedAccountId]);

  useEffect(() => {
    if (selectedStockId) {
      fetchStockOrders(selectedStockId);
      fetchStockTrades(selectedStockId).then(setTrades);
    }
  }, [selectedStockId, fetchStockOrders, fetchStockTrades]);

  // Handlers
  const handleStockSelect = (stockId: string) => {
    setSelectedStockId(stockId);
    setQuantity(1);
  };

  const handleTrade = async (type: 'BUY' | 'SELL') => {
    if (!selectedStock || !selectedAccountId) return;

    const success = await placeOrder(
      selectedStock.id,
      type,
      quantity,
      Math.round(selectedStock.currentPrice * 100),
      selectedAccountId
    );

    if (success) {
      setQuantity(1);
      await onRefresh();
      fetchStockOrders(selectedStock.id);
      fetchStockTrades(selectedStock.id).then(setTrades);
    }
  };

  const handleCancelOrder = async (orderId: string) => {
    if (window.confirm(t('common.confirm'))) {
      const success = await cancelOrder(orderId);
      if (success) {
        await onRefresh();
        if (selectedStockId) fetchStockOrders(selectedStockId);
      }
    }
  };

  // Validation
  const canBuy = useMemo(() => {
    if (!selectedStock || !selectedAccount) return false;
    const cost = (selectedStock.currentPrice * quantity);
    return selectedAccount.balance >= cost;
  }, [selectedStock, selectedAccount, quantity]);

  const canSell = useMemo(() => {
    return userHolding >= quantity;
  }, [userHolding, quantity]);

  // Filtering Orders
  const displayedOrders = useMemo(() => {
    let filtered = stockOrders;

    // Sort by date desc
    filtered = [...filtered].sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());

    if (listFilter === 'MARKET') {
      // Show all pending orders (Order Book)
      return filtered.filter(o => o.status === 'PENDING');
    } else {
      // MY_ORDERS: Show only my pending orders
      const myOrderIds = new Set(orders.map(o => o.id));
      return filtered.filter(o => myOrderIds.has(o.id) && o.status === 'PENDING');
    }
  }, [stockOrders, listFilter, orders]);

  if (!selectedStock) return null;

  return (
    <div className="flex h-[700px] gap-6">
      {/* Left Sidebar: Active Stocks */}
      <div className="w-1/4 border-r border-white/10 pr-6 overflow-y-auto">
        <h3 className="text-lg font-medium text-white mb-4">{t('dashboard.client.market.activeStocks')}</h3>
        <div className="space-y-2">
          {activeStocks.map((stock) => (
            <div
              key={stock.id}
              onClick={() => handleStockSelect(stock.id)}
              className={`p-4 rounded-xl border cursor-pointer transition-all ${selectedStockId === stock.id
                ? 'bg-white/10 border-white/20'
                : 'bg-white/5 border-white/10 hover:bg-white/10'
                }`}
            >
              <div className="flex justify-between items-center">
                <span className="font-bold text-white">{stock.symbol}</span>
                <span className="text-white/70">
                  {(stock.currentPrice).toLocaleString('fr-FR', { style: 'currency', currency: 'EUR' })}
                </span>
              </div>
              <div className="text-sm text-white/50 mt-1">{stock.name}</div>
            </div>
          ))}
        </div>
      </div>

      {/* Right Main Area */}
      <div className="flex-1 flex flex-col gap-6 overflow-y-auto">
        {/* Stock Info Header */}
        <div className="flex justify-between items-start">
          <div>
            <h2 className="text-3xl font-bold text-white">{selectedStock.name}</h2>
            <p className="text-xl text-white/70">{selectedStock.symbol}</p>
          </div>
          <div className="text-right">
            <p className="text-3xl font-bold text-white">
              {(selectedStock.currentPrice).toLocaleString('fr-FR', { style: 'currency', currency: 'EUR' })}
            </p>
            <p className="text-sm text-green-400 flex items-center justify-end gap-1">
              <TrendingUp className="h-4 w-4" />
              {t('dashboard.client.market.currentPrice')}
            </p>
          </div>
        </div>

        {/* Trading Interface */}
        <Card className="bg-white/5 border-white/10">
          <CardHeader>
            <CardTitle className="text-white">{t('dashboard.client.market.trading')}</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label className="text-white">{t('dashboard.client.accounts.title')}</Label>
                <select
                  value={selectedAccountId}
                  onChange={(e) => setSelectedAccountId(e.target.value)}
                  className="flex h-10 w-full rounded-md border border-white/10 bg-black/20 px-3 py-2 text-sm text-white placeholder:text-white/50 focus:outline-none focus:ring-2 focus:ring-white/20"
                >
                  {accounts.map((account) => (
                    <option key={account.id} value={account.id} className="bg-gray-900">
                      {account.name} ({(account.balance).toLocaleString('fr-FR')} €)
                    </option>
                  ))}
                </select>
                {selectedAccount && (
                  <p className="text-xs text-white/50">
                    {t('dashboard.client.market.available')}: {selectedAccount.balance.toLocaleString('fr-FR')} €
                  </p>
                )}
              </div>
              <div className="space-y-2">
                <Label className="text-white">{t('dashboard.client.investments.quantity')}</Label>
                <Input
                  type="number"
                  min="1"
                  value={quantity}
                  onChange={(e) => setQuantity(Math.max(1, parseInt(e.target.value) || 0))}
                  className="bg-black/20 border-white/10 text-white"
                />
                <p className="text-xs text-white/50">
                  {t('dashboard.client.market.holding')}: {userHolding}
                </p>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4 pt-2">
              <Button
                onClick={() => handleTrade('BUY')}
                disabled={!canBuy || loading}
                className="w-full bg-green-500 hover:bg-green-600 text-white disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {t('dashboard.client.investments.buy')}
                <span className="ml-2 text-xs opacity-80">
                  ({(selectedStock.currentPrice * quantity).toLocaleString('fr-FR', { style: 'currency', currency: 'EUR' })})
                </span>
              </Button>
              <Button
                onClick={() => handleTrade('SELL')}
                disabled={!canSell || loading}
                className="w-full bg-red-500 hover:bg-red-600 text-white disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {t('dashboard.client.investments.sell')}
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Tabs: Order Book & Trades */}
        <div className="flex-1">
          <Tabs defaultValue="orderBook" className="w-full">
            <TabsList className="grid w-full grid-cols-2 bg-white/5">
              <TabsTrigger value="orderBook">{t('dashboard.client.market.orderBook')}</TabsTrigger>
              <TabsTrigger value="trades">{t('dashboard.client.market.filterHistory')}</TabsTrigger>
            </TabsList>

            <TabsContent value="orderBook">
              <div className="flex justify-end mb-4">
                <div className="flex bg-white/5 rounded-lg p-1">
                  <button
                    onClick={() => setListFilter('MARKET')}
                    className={`px-3 py-1 rounded-md text-xs font-medium transition-all ${listFilter === 'MARKET' ? 'bg-white/20 text-white' : 'text-white/50 hover:text-white'
                      }`}
                  >
                    {t('dashboard.client.market.filterMarket')}
                  </button>
                  <button
                    onClick={() => setListFilter('MY_ORDERS')}
                    className={`px-3 py-1 rounded-md text-xs font-medium transition-all ${listFilter === 'MY_ORDERS' ? 'bg-white/20 text-white' : 'text-white/50 hover:text-white'
                      }`}
                  >
                    {t('dashboard.client.market.filterMyOrders')}
                  </button>
                </div>
              </div>

              <div className="bg-white/5 rounded-xl border border-white/10 overflow-hidden">
                <table className="w-full text-left">
                  <thead>
                    <tr className="border-b border-white/10 bg-white/5">
                      <th className="p-4 text-xs font-medium text-white/50 uppercase">{t('dashboard.client.investments.type')}</th>
                      <th className="p-4 text-xs font-medium text-white/50 uppercase">{t('dashboard.client.investments.quantity')}</th>
                      <th className="p-4 text-xs font-medium text-white/50 uppercase">{t('dashboard.client.investments.price')}</th>
                      <th className="p-4 text-xs font-medium text-white/50 uppercase">{t('dashboard.client.investments.date')}</th>
                      <th className="p-4 text-xs font-medium text-white/50 uppercase">{t('common.actions')}</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-white/5">
                    {displayedOrders.length === 0 ? (
                      <tr>
                        <td colSpan={5} className="p-8 text-center text-white/50">
                          {t('dashboard.client.investments.noOrders')}
                        </td>
                      </tr>
                    ) : (
                      displayedOrders.map((order) => {
                        const isMyOrder = orders.some(o => o.id === order.id);
                        return (
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
                              {isMyOrder && order.status === 'PENDING' && (
                                <Button
                                  size="sm"
                                  variant="destructive"
                                  className="h-8 px-3"
                                  onClick={() => handleCancelOrder(order.id)}
                                >
                                  {t('common.cancel')}
                                </Button>
                              )}
                            </td>
                          </tr>
                        );
                      })
                    )}
                  </tbody>
                </table>
              </div>
            </TabsContent>

            <TabsContent value="trades">
              <div className="bg-white/5 rounded-xl border border-white/10 overflow-hidden mt-4">
                <table className="w-full text-left">
                  <thead>
                    <tr className="border-b border-white/10 bg-white/5">
                      <th className="p-4 text-xs font-medium text-white/50 uppercase">{t('dashboard.client.investments.type')}</th>
                      <th className="p-4 text-xs font-medium text-white/50 uppercase">{t('dashboard.client.investments.price')}</th>
                      <th className="p-4 text-xs font-medium text-white/50 uppercase">{t('dashboard.client.investments.quantity')}</th>
                      <th className="p-4 text-xs font-medium text-white/50 uppercase">{t('dashboard.client.investments.date')}</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-white/5">
                    {trades.length === 0 ? (
                      <tr>
                        <td colSpan={4} className="p-8 text-center text-white/50">
                          {t('common.noData')}
                        </td>
                      </tr>
                    ) : (
                      trades.map((trade) => (
                        <tr key={trade.id} className="hover:bg-white/5 transition-colors">
                          <td className="p-4">
                            <span className={`text-xs font-bold px-2 py-1 rounded-full ${trade.aggressorSide === 'BUY' ? 'bg-green-500/20 text-green-400' : 'bg-red-500/20 text-red-400'
                              }`}>
                              {trade.aggressorSide}
                            </span>
                          </td>
                          <td className="p-4 text-white">
                            {(trade.executionPrice / 100).toLocaleString('fr-FR', { style: 'currency', currency: 'EUR' })}
                          </td>
                          <td className="p-4 text-white">{trade.quantity}</td>
                          <td className="p-4 text-white/50 text-sm">
                            {new Date(trade.timestamp).toLocaleString()}
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </TabsContent>
          </Tabs>
        </div>
      </div>
    </div>
  );
};
