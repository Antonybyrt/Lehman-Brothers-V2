import axios from 'axios';
import { Chat, ChatMessage } from '@/types/chat';

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000';

// Interfaces spécifiques au service (requêtes/réponses API)

export interface CreateChatRequest {
  subject: string;
  clientId?: string; // Optional: used by advisors to create chats for clients
}

export interface CreateChatResponse {
  success: boolean;
  chatId?: string;
  subject?: string;
  error?: string;
}

export interface GetChatsResponse {
  success: boolean;
  chats?: Chat[];
  error?: string;
}

export interface GetChatByIdResponse {
  success: boolean;
  chat?: Chat;
  error?: string;
}

export interface GetChatMessagesResponse {
  success: boolean;
  messages?: ChatMessage[];
  hasMore?: boolean;
  error?: string;
}

export interface GetPendingChatsCountResponse {
  success: boolean;
  count?: number;
  error?: string;
}

class ChatService {
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

  // Create a new chat
  async createChat(data: CreateChatRequest): Promise<CreateChatResponse> {
    try {
      const response = await this.api.post<CreateChatResponse>('/chats', data);
      return response.data;
    } catch (error) {
      if (axios.isAxiosError(error) && error.response) {
        return {
          success: false,
          error: error.response.data.error || 'Failed to create chat',
        };
      }
      return {
        success: false,
        error: 'Network error occurred',
      };
    }
  }

  // Get all chats for the authenticated user
  async getUserChats(): Promise<GetChatsResponse> {
    try {
      const response = await this.api.get<GetChatsResponse>('/chats');
      return response.data;
    } catch (error) {
      if (axios.isAxiosError(error) && error.response) {
        return {
          success: false,
          error: error.response.data.error || 'Failed to load chats',
        };
      }
      return {
        success: false,
        error: 'Network error occurred',
      };
    }
  }

  // Get a specific chat by ID
  async getChatById(chatId: string): Promise<GetChatByIdResponse> {
    try {
      const response = await this.api.get<GetChatByIdResponse>(`/chats/${chatId}`);
      return response.data;
    } catch (error) {
      if (axios.isAxiosError(error) && error.response) {
        return {
          success: false,
          error: error.response.data.error || 'Failed to load chat',
        };
      }
      return {
        success: false,
        error: 'Network error occurred',
      };
    }
  }

  // Get messages for a specific chat
  async getChatMessages(
    chatId: string,
    options?: { beforeId?: string; limit?: number }
  ): Promise<GetChatMessagesResponse> {
    try {
      const params = new URLSearchParams();
      if (options?.beforeId) params.append('beforeId', options.beforeId);
      if (options?.limit) params.append('limit', options.limit.toString());

      const url = `/chats/${chatId}/messages${params.toString() ? `?${params.toString()}` : ''}`;
      const response = await this.api.get<GetChatMessagesResponse>(url);
      return response.data;
    } catch (error) {
      if (axios.isAxiosError(error) && error.response) {
        return {
          success: false,
          error: error.response.data.error || 'Failed to load messages',
        };
      }
      return {
        success: false,
        error: 'Network error occurred',
      };
    }
  }

  async closeChat(chatId: string): Promise<{ success: boolean; error?: string }> {
    try {
      const response = await this.api.post<{ success: boolean; error?: string }>(
        `/chats/${chatId}/close`
      );
      return response.data;
    } catch (error) {
      if (axios.isAxiosError(error) && error.response) {
        return {
          success: false,
          error: error.response.data.error || 'Failed to close chat',
        };
      }
      return {
        success: false,
        error: 'Network error occurred',
      };
    }
  }

  async transferChat(chatId: string, newAdvisorId: string): Promise<{ success: boolean; error?: string; previousAdvisorId?: string; newAdvisorId?: string }> {
    try {
      const response = await this.api.post<{ success: boolean; error?: string; previousAdvisorId?: string; newAdvisorId?: string }>(
        `/chats/${chatId}/transfer`,
        { newAdvisorId }
      );
      return response.data;
    } catch (error) {
      if (axios.isAxiosError(error) && error.response) {
        return {
          success: false,
          error: error.response.data.error || 'Failed to transfer chat',
        };
      }
      return {
        success: false,
        error: 'Network error occurred',
      };
    }
  }

  // Get count of chats pending advisor response
  async getPendingChatsCount(): Promise<GetPendingChatsCountResponse> {
    try {
      const response = await this.api.get<GetPendingChatsCountResponse>('/chats/pending-count');
      return response.data;
    } catch (error) {
      if (axios.isAxiosError(error) && error.response) {
        return {
          success: false,
          error: error.response.data.error || 'Failed to get pending chats count',
        };
      }
      return {
        success: false,
        error: 'Network error occurred',
      };
    }
  }
}

// Export a singleton instance
export const chatService = new ChatService();
