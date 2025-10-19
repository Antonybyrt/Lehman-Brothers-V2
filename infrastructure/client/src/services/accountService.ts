import axios from 'axios';

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000';

export interface Account {
  id: string;
  name: string;
  iban: string;
  balance: number;
  isSavings: boolean;
  createdAt: string;
}

export interface CreateAccountRequest {
  name: string;
  isSavings?: boolean;
  initialBalance?: number;
}

export interface CreateAccountResponse {
  success: boolean;
  accountId?: string;
  iban?: string;
  message?: string;
  error?: string;
  type?: string;
}

export interface GetAccountsResponse {
  success: boolean;
  accounts?: Account[];
  error?: string;
  type?: string;
}

export interface GetAccountByIdResponse {
  success: boolean;
  account?: Account;
  error?: string;
  type?: string;
}

export interface UpdateAccountRequest {
  name?: string;
  balance?: number;
}

export interface UpdateAccountResponse {
  success: boolean;
  account?: Account;
  error?: string;
  type?: string;
}

export interface DeleteAccountRequest {
  transferIban?: string;
}

export interface DeleteAccountResponse {
  success: boolean;
  message?: string;
  error?: string;
  type?: string;
}

class AccountService {
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

  // Create new account
  async createAccount(accountData: CreateAccountRequest): Promise<CreateAccountResponse> {
    try {
      const response = await this.api.post('/accounts', accountData);
      return response.data;
    } catch (error: unknown) {
      if (error && typeof error === 'object' && 'response' in error) {
        const axiosError = error as { response?: { data?: CreateAccountResponse } };
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

  // Get all user accounts
  async getUserAccounts(): Promise<GetAccountsResponse> {
    try {
      const response = await this.api.get('/accounts');
      return response.data;
    } catch (error: unknown) {
      if (error && typeof error === 'object' && 'response' in error) {
        const axiosError = error as { response?: { data?: GetAccountsResponse } };
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

  // Get account by ID
  async getAccountById(accountId: string): Promise<GetAccountByIdResponse> {
    try {
      const response = await this.api.get(`/accounts/${accountId}`);
      return response.data;
    } catch (error: unknown) {
      if (error && typeof error === 'object' && 'response' in error) {
        const axiosError = error as { response?: { data?: GetAccountByIdResponse } };
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

  // Update account
  async updateAccount(accountId: string, updateData: UpdateAccountRequest): Promise<UpdateAccountResponse> {
    try {
      const response = await this.api.patch(`/accounts/${accountId}`, updateData);
      return response.data;
    } catch (error: unknown) {
      if (error && typeof error === 'object' && 'response' in error) {
        const axiosError = error as { response?: { data?: UpdateAccountResponse } };
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

  // Delete account
  async deleteAccount(accountId: string, deleteData?: DeleteAccountRequest): Promise<DeleteAccountResponse> {
    try {
      const response = await this.api.delete(`/accounts/${accountId}`, {
        data: deleteData
      });
      return response.data;
    } catch (error: unknown) {
      if (error && typeof error === 'object' && 'response' in error) {
        const axiosError = error as { response?: { data?: DeleteAccountResponse } };
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
}

export const accountService = new AccountService();
