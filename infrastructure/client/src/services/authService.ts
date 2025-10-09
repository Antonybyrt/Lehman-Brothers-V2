import axios from 'axios';

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000';

export interface LoginRequest {
  email: string;
  password: string;
}

export interface LoginResponse {
  success: boolean;
  token?: string;
  user?: {
    id: string;
    email: string;
    firstName: string;
    lastName: string;
    role: string;
  };
  error?: string;
}

export interface RegisterRequest {
  firstName: string;
  lastName: string;
  email: string;
  password: string;
  role?: string;
}

export interface RegisterResponse {
  success: boolean;
  userId?: string;
  message?: string;
  error?: string;
  type?: string;
}

class AuthService {
  private api = axios.create({
    baseURL: API_BASE_URL,
    headers: {
      'Content-Type': 'application/json',
    },
  });

  async login(credentials: LoginRequest): Promise<LoginResponse> {
    try {
      const response = await this.api.post('/auth/login', credentials);
      return response.data;
    } catch (error: any) {
      if (error.response?.data) {
        return error.response.data;
      }
      return {
        success: false,
        error: 'Network error occurred'
      };
    }
  }

  async register(userData: RegisterRequest): Promise<RegisterResponse> {
    try {
      // Automatically set role to CLIENT if not provided
      const dataWithRole = {
        ...userData,
        role: userData.role || 'CLIENT'
      };
      
      const response = await this.api.post('/auth/register', dataWithRole);
      return response.data;
    } catch (error: any) {
      if (error.response?.data) {
        return {
          success: false,
          error: error.response.data.error,
          type: error.response.data.type || 'unknown'
        };
      }
      return {
        success: false,
        error: 'Network error occurred',
        type: 'network'
      };
    }
  }

  async confirmEmail(token: string): Promise<{ success: boolean; error?: string }> {
    try {
      const response = await this.api.get(`/confirm-email/${encodeURIComponent(token)}`);
      return response.data;
    } catch (error: any) {
      if (error.response?.data) {
        return error.response.data;
      }
      return {
        success: false,
        error: 'Network error occurred'
      };
    }
  }

  setAuthToken(token: string): void {
    this.api.defaults.headers.common['Authorization'] = `Bearer ${token}`;
    localStorage.setItem('auth_token', token);
  }

  removeAuthToken(): void {
    delete this.api.defaults.headers.common['Authorization'];
    localStorage.removeItem('auth_token');
  }

  getStoredToken(): string | null {
    if (typeof window !== 'undefined') {
      return localStorage.getItem('auth_token');
    }
    return null;
  }

  async getRole(): Promise<{ success: boolean; role?: string; userId?: string; error?: string }> {
    try {
      const response = await this.api.get('/auth/getrole');
      return response.data;
    } catch (error: any) {
      if (error.response?.data) {
        return error.response.data;
      }
      return {
        success: false,
        error: 'Network error occurred'
      };
    }
  }
}

export const authService = new AuthService();
