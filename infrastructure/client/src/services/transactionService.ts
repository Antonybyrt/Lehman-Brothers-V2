import axios from 'axios';
import { handleHttpError } from '@/utils/errorHandler';

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000';

export interface Transaction {
    id: string;
    sourceAccountId?: string;
    sourceAccountName?: string;
    targetAccountId?: string;
    targetAccountName?: string;
    targetIban?: string;
    amount: number;
    description?: string;
    type: 'TRANSFER' | 'DEPOSIT' | 'WITHDRAWAL' | 'INTEREST';
    createdAt: string;
}

export interface GetTransactionsResponse {
    success: boolean;
    transactions?: Transaction[];
    error?: string;
    type?: string;
}

class TransactionService {
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

    // Get user transactions
    async getUserTransactions(limit?: number): Promise<GetTransactionsResponse> {
        try {
            const params = limit ? { limit } : {};
            const response = await this.api.get('/transactions', { params });
            return response.data;
        } catch (error: unknown) {
            // Handle 404/500 errors with redirect
            const httpError = handleHttpError(error, true);

            if (error && typeof error === 'object' && 'response' in error) {
                const axiosError = error as { response?: { data?: GetTransactionsResponse; status?: number } };
                if (axiosError.response?.data) {
                    const status = axiosError.response.status;
                    if (status !== 404 && status !== 500) {
                        return axiosError.response.data;
                    }
                }
            }

            return {
                success: false,
                error: httpError.error,
                type: httpError.errorType || 'network'
            };
        }
    }
}

export const transactionService = new TransactionService();
