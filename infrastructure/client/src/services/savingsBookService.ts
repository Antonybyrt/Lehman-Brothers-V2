import axios from 'axios';

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000';

export type SavingsBookType = 'LIVRET_A' | 'LDD';

export interface SavingsBook {
    id: string;
    iban: string;
    name: string;
    balance: number;
    type: SavingsBookType;
    typeDisplayName: string;
    createdAt: string;
}

export interface SavingsRate {
    bookType: SavingsBookType;
    rate: number;
    ratePercent: string;
    effectiveDate: string;
    dailyRate: number;
}

export interface UpdateRateRequest {
    bookType: SavingsBookType;
    rate: number;
}

export interface UpdateRateResponse {
    success: boolean;
    message?: string;
    error?: string;
    rateId?: string;
}
export interface CreateSavingsBookRequest {
    name: string;
    type: SavingsBookType;
}

export interface CreateSavingsBookResponse {
    success: boolean;
    savingsBookId?: string;
    iban?: string;
    message?: string;
    error?: string;
    type?: string;
}

export interface GetSavingsBooksResponse {
    success: boolean;
    savingsBooks?: SavingsBook[];
    message?: string;
    error?: string;
    type?: string;
}

export interface GetRatesResponse {
    success: boolean;
    rates?: SavingsRate[];
    error?: string;
}

export interface DepositRequest {
    sourceAccountId: string;
    amount: number;
}

export interface WithdrawRequest {
    targetAccountId: string;
    amount: number;
}

export interface TransactionResponse {
    success: boolean;
    message?: string;
    newBalance?: number;
    error?: string;
    type?: string;
}

class SavingsBookService {
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

    // Create new savings book
    async createSavingsBook(data: CreateSavingsBookRequest): Promise<CreateSavingsBookResponse> {
        try {
            const response = await this.api.post('/savings-books', data);
            return response.data;
        } catch (error: unknown) {
            if (error && typeof error === 'object' && 'response' in error) {
                const axiosError = error as { response?: { data?: CreateSavingsBookResponse } };
                if (axiosError.response?.data) {
                    return axiosError.response.data;
                }
            }
            return {
                success: false,
                error: 'Network error occurred',
                type: 'network'
            };
        }
    }

    // Get all user savings books
    async getUserSavingsBooks(): Promise<GetSavingsBooksResponse> {
        try {
            const response = await this.api.get('/savings-books');
            return response.data;
        } catch (error: unknown) {
            if (error && typeof error === 'object' && 'response' in error) {
                const axiosError = error as { response?: { data?: GetSavingsBooksResponse } };
                if (axiosError.response?.data) {
                    return axiosError.response.data;
                }
            }
            return {
                success: false,
                error: 'Network error occurred',
                type: 'network'
            };
        }
    }

    // Get current rates
    async getCurrentRates(): Promise<GetRatesResponse> {
        try {
            const response = await this.api.get('/savings-rates');
            return response.data;
        } catch (error: unknown) {
            if (error && typeof error === 'object' && 'response' in error) {
                const axiosError = error as { response?: { data?: GetRatesResponse } };
                if (axiosError.response?.data) {
                    return axiosError.response.data;
                }
            }
            return {
                success: false,
                error: 'Network error occurred'
            };
        }
    }

    // Deposit to savings book
    async deposit(savingsBookId: string, data: DepositRequest): Promise<TransactionResponse> {
        try {
            const response = await this.api.post(`/savings-books/${savingsBookId}/deposit`, data);
            return response.data;
        } catch (error: unknown) {
            if (error && typeof error === 'object' && 'response' in error) {
                const axiosError = error as { response?: { data?: TransactionResponse } };
                if (axiosError.response?.data) {
                    return axiosError.response.data;
                }
            }
            return {
                success: false,
                error: 'Network error occurred',
                type: 'network'
            };
        }
    }

    // Withdraw from savings book
    async withdraw(savingsBookId: string, data: WithdrawRequest): Promise<TransactionResponse> {
        try {
            const response = await this.api.post(`/savings-books/${savingsBookId}/withdraw`, data);
            return response.data;
        } catch (error: unknown) {
            if (error && typeof error === 'object' && 'response' in error) {
                const axiosError = error as { response?: { data?: TransactionResponse } };
                if (axiosError.response?.data) {
                    return axiosError.response.data;
                }
            }
            return {
                success: false,
                error: 'Network error occurred',
                type: 'network'
            };
        }
    }

    // Set savings rate (Director only)
    async updateRate(data: UpdateRateRequest): Promise<UpdateRateResponse> {
        try {
            const response = await this.api.post('/savings-rates', data);
            return response.data;
        } catch (error: unknown) {
            if (error && typeof error === 'object' && 'response' in error) {
                const axiosError = error as { response?: { data?: UpdateRateResponse } };
                if (axiosError.response?.data) {
                    return axiosError.response.data;
                }
            }
            return {
                success: false,
                error: 'Network error occurred'
            };
        }
    }
}

export const savingsBookService = new SavingsBookService();
