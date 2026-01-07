import { useState, useCallback } from 'react';
import { investmentService, Stock, Portfolio, Order } from '../services/investmentService';
import { useAuth } from './useAuth';

export const useInvestment = () => {
  const { token } = useAuth();
  const [stocks, setStocks] = useState<Stock[]>([]);
  const [portfolio, setPortfolio] = useState<Portfolio | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [orders, setOrders] = useState<Order[]>([]);
  const [stockOrders, setStockOrders] = useState<Order[]>([]);

  const fetchStocks = useCallback(async (includeInactive = false) => {
    if (!token) return;
    setLoading(true);
    investmentService.setAuthToken(token);
    const response = await investmentService.listStocks(includeInactive);
    if (response.success && response.data) {
      setStocks(response.data);
    } else {
      setError(response.error || 'Failed to fetch stocks');
    }
    setLoading(false);
  }, [token]);

  const fetchPortfolio = useCallback(async () => {
    if (!token) return;
    setLoading(true);
    investmentService.setAuthToken(token);
    const response = await investmentService.getPortfolio();
    if (response.success && response.data) {
      setPortfolio(response.data);
    } else {
      setError(response.error || 'Failed to fetch portfolio');
    }
    setLoading(false);
  }, [token]);

  const fetchUserOrders = useCallback(async () => {
    if (!token) return;
    setLoading(true);
    investmentService.setAuthToken(token);
    const response = await investmentService.getUserOrders();
    if (response.success && response.data) {
      setOrders(response.data);
    } else {
      setError(response.error || 'Failed to fetch user orders');
    }
    setLoading(false);
  }, [token]);

  const fetchStockOrders = useCallback(async (stockId: string) => {
    if (!token) return;
    setLoading(true);
    investmentService.setAuthToken(token);
    const response = await investmentService.getStockOrders(stockId);
    if (response.success && response.data) {
      setStockOrders(response.data);
    } else {
      setError(response.error || 'Failed to fetch stock orders');
    }
    setLoading(false);
  }, [token]);

  const fetchStockTrades = useCallback(async (stockId: string) => {
    if (!token) return [];
    investmentService.setAuthToken(token);
    const response = await investmentService.getStockTrades(stockId);
    if (response.success && response.data) {
      return response.data;
    } else {
      console.error(response.error || 'Failed to fetch stock trades');
      return [];
    }
  }, [token]);

  const placeOrder = async (stockId: string, type: 'BUY' | 'SELL', quantity: number, limitPriceInCents: number, accountId?: string) => {
    if (!token) return;
    setLoading(true);
    investmentService.setAuthToken(token);
    const response = await investmentService.placeOrder({ stockId, type, quantity, limitPriceInCents, accountId });
    setLoading(false);
    if (response.success) {
      await fetchPortfolio(); // Refresh portfolio after order
      await fetchUserOrders(); // Refresh orders
      return response.data;
    } else {
      setError(response.error || 'Failed to place order');
      return null;
    }
  };

  const cancelOrder = async (id: string) => {
    if (!token) return;
    setLoading(true);
    investmentService.setAuthToken(token);
    const response = await investmentService.cancelOrder(id);
    setLoading(false);
    if (response.success) {
      await fetchUserOrders(); // Refresh orders
      return true;
    } else {
      setError(response.error || 'Failed to cancel order');
      return false;
    }
  };

  const createStock = async (symbol: string, name: string, isin: string, initialPriceInCents: number, initialQuantity: number) => {
    if (!token) return;
    setLoading(true);
    investmentService.setAuthToken(token);
    const response = await investmentService.createStock({ symbol, name, isin, initialPriceInCents, initialQuantity });
    setLoading(false);
    if (response.success) {
      await fetchStocks(true); // Refresh list including inactive
      return response.data;
    } else {
      setError(response.error || 'Failed to create stock');
      return null;
    }
  };

  const updateStockStatus = async (id: string, isActive: boolean) => {
    if (!token) return;
    setLoading(true);
    investmentService.setAuthToken(token);
    const response = await investmentService.updateStockStatus(id, isActive);
    setLoading(false);
    if (response.success) {
      await fetchStocks(true); // Refresh list
      return true;
    } else {
      setError(response.error || 'Failed to update stock status');
      return false;
    }
  };

  return {
    stocks,
    portfolio,
    orders,
    stockOrders,
    loading,
    error,
    fetchStocks,
    fetchPortfolio,
    fetchUserOrders,
    fetchStockOrders,
    placeOrder,
    cancelOrder,
    createStock,
    updateStockStatus,
    fetchStockTrades
  };
};
