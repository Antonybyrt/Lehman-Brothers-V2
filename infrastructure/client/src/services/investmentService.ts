import axios from 'axios';
import { handleHttpError } from '@/utils/errorHandler';

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000';

export interface Stock {
  id: string;
  symbol: string;
  name: string;
  currentPrice: number;
  active: boolean;
}

export interface Order {
  id: string;
  stockId: string;
  type: 'BUY' | 'SELL';
  quantity: number;
  limitPrice: number;
  status: 'PENDING' | 'EXECUTED' | 'CANCELLED';
  createdAt: string;
}

export interface Trade {
  id: string;
  buyOrderId: string;
  sellOrderId: string;
  executionPrice: number;
  quantity: number;
  aggressorSide: 'BUY' | 'SELL';
  timestamp: string;
}

export interface PortfolioItem {
  stockId: string;
  quantity: number;
}

export interface Portfolio {
  userId: string;
  holdings: PortfolioItem[];
}

export interface CreateStockRequest {
  symbol: string;
  name: string;
  isin: string;
  initialPriceInCents: number;
  initialQuantity: number;
}

export interface PlaceOrderRequest {
  accountId?: string;
  stockId: string;
  type: 'BUY' | 'SELL';
  quantity: number;
  limitPriceInCents: number;
}

export interface GenericResponse<T = any> {
  success: boolean;
  data?: T;
  error?: string;
  type?: string;
}

class InvestmentService {
  private api = axios.create({
    baseURL: API_BASE_URL,
    headers: {
      'Content-Type': 'application/json',
    },
  });

  setAuthToken(token: string): void {
    this.api.defaults.headers.common['Authorization'] = `Bearer ${token}`;
  }

  removeAuthToken(): void {
    delete this.api.defaults.headers.common['Authorization'];
  }

  async listStocks(includeInactive: boolean = false): Promise<GenericResponse<Stock[]>> {
    try {
      const response = await this.api.get('/investment/stocks', {
        params: { includeInactive }
      });
      return { success: true, data: response.data };
    } catch (error: unknown) {
      const httpError = handleHttpError(error, true);
      return { success: false, error: httpError.error, type: httpError.errorType };
    }
  }

  async createStock(data: CreateStockRequest): Promise<GenericResponse<Stock>> {
    try {
      const response = await this.api.post('/investment/stocks', data);
      return { success: true, data: response.data };
    } catch (error: unknown) {
      const httpError = handleHttpError(error, true);
      return { success: false, error: httpError.error, type: httpError.errorType };
    }
  }

  async updateStockStatus(id: string, isActive: boolean): Promise<GenericResponse<void>> {
    try {
      await this.api.patch(`/investment/stocks/${id}/status`, { isActive });
      return { success: true };
    } catch (error: unknown) {
      const httpError = handleHttpError(error, true);
      return { success: false, error: httpError.error, type: httpError.errorType };
    }
  }

  async placeOrder(data: PlaceOrderRequest): Promise<GenericResponse<Order>> {
    try {
      const response = await this.api.post('/investment/orders', data);
      return { success: true, data: response.data };
    } catch (error: unknown) {
      const httpError = handleHttpError(error, true);
      return { success: false, error: httpError.error, type: httpError.errorType };
    }
  }

  async cancelOrder(id: string): Promise<GenericResponse<void>> {
    try {
      await this.api.post(`/investment/orders/${id}/cancel`);
      return { success: true };
    } catch (error: unknown) {
      const httpError = handleHttpError(error, true);
      return { success: false, error: httpError.error, type: httpError.errorType };
    }
  }

  async getPortfolio(): Promise<GenericResponse<Portfolio>> {
    try {
      const response = await this.api.get('/investment/portfolio');
      return { success: true, data: response.data };
    } catch (error: unknown) {
      const httpError = handleHttpError(error, true);
      return { success: false, error: httpError.error, type: httpError.errorType };
    }
  }

  async getUserOrders(): Promise<GenericResponse<Order[]>> {
    try {
      const response = await this.api.get('/investment/orders');
      return { success: true, data: response.data };
    } catch (error: unknown) {
      const httpError = handleHttpError(error, true);
      return { success: false, error: httpError.error, type: httpError.errorType };
    }
  }

  async getStockOrders(stockId: string): Promise<GenericResponse<Order[]>> {
    try {
      const response = await this.api.get(`/investment/stocks/${stockId}/orders`);
      return { success: true, data: response.data };
    } catch (error: unknown) {
      const httpError = handleHttpError(error, true);
      return { success: false, error: httpError.error, type: httpError.errorType };
    }
  }

  async getStockTrades(stockId: string): Promise<GenericResponse<Trade[]>> {
    try {
      const response = await this.api.get(`/investment/stocks/${stockId}/trades`);
      return { success: true, data: response.data };
    } catch (error: unknown) {
      const httpError = handleHttpError(error, true);
      return { success: false, error: httpError.error, type: httpError.errorType };
    }
  }
}

export const investmentService = new InvestmentService();
