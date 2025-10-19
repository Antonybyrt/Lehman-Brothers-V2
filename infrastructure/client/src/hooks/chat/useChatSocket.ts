import { useEffect, useRef, useState, useCallback } from 'react';

/**
 * Types pour le protocole WebSocket du chat
 */
export type WsEventType = 'join' | 'typing' | 'message:new' | 'message:read' | 'error' | 'pong';

export interface WsMessage<T = unknown> {
  type: WsEventType;
  chatId?: string;
  payload?: T;
}

export interface ErrorPayload {
  message: string;
  code?: string;
}

export interface MessageCreatedPayload {
  messageId: string;
  chatId: string;
  authorId: string;
  authorName: string;
  content: string;
  attachmentUrl: string | null;
  sentAt: string;
  isFirstAdvisorResponse?: boolean;
}

export interface UserTypingPayload {
  userId: string;
  userName: string;
  isTyping: boolean;
}

export interface MessageReadBroadcastPayload {
  messageIds: string[];
  userId: string;
  readAt: string;
}

export interface JoinedChatPayload {
  chatId: string;
  userId: string;
  success: boolean;
}

/**
 * Options pour le hook useChatSocket
 */
interface UseChatSocketOptions {
  chatId: string;
  token: string;
  onMessage?: (message: MessageCreatedPayload) => void;
  onTyping?: (typing: UserTypingPayload) => void;
  onMessageRead?: (read: MessageReadBroadcastPayload) => void;
  onError?: (error: string) => void;
  autoReconnect?: boolean;
  reconnectDelay?: number;
}

/**
 * État de connexion WebSocket
 */
export type ConnectionStatus = 'connecting' | 'connected' | 'disconnected' | 'error';

/**
 * Hook React pour gérer la connexion WebSocket du chat
 * 
 * Fonctionnalités:
 * - Connexion automatique au chat
 * - Gestion de la reconnexion automatique
 * - Envoi et réception de messages
 * - Gestion du statut de saisie
 * - Marquage des messages comme lus
 * 
 * @example
 * ```tsx
 * const { 
 *   status, 
 *   sendMessage, 
 *   setTyping, 
 *   markAsRead 
 * } = useChatSocket({
 *   chatId: 'chat-123',
 *   token: 'jwt-token',
 *   onMessage: (msg) => console.log('New message:', msg),
 *   onTyping: (typing) => console.log('User typing:', typing),
 * });
 * ```
 */
export const useChatSocket = (options: UseChatSocketOptions) => {
  const {
    chatId,
    token,
    onMessage,
    onTyping,
    onMessageRead,
    onError,
    autoReconnect = true,
    reconnectDelay = 3000,
  } = options;

  const [status, setStatus] = useState<ConnectionStatus>('connecting');
  const wsRef = useRef<WebSocket | null>(null);
  const reconnectTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const reconnectAttemptsRef = useRef(0);
  const isMountedRef = useRef(true);
  const maxReconnectAttempts = 5;

  /**
   * Établit la connexion WebSocket
   */
  const connect = useCallback(() => {
    // Don't connect if component is unmounted
    if (!isMountedRef.current) {
      return;
    }

    try {
      const wsUrl = `${process.env.NEXT_PUBLIC_WS_URL || 'ws://localhost:3000'}?token=${token}`;
      const ws = new WebSocket(wsUrl);

      // Store the WebSocket reference immediately to prevent race conditions
      wsRef.current = ws;

      ws.onopen = () => {
        if (!isMountedRef.current) {
          ws.close();
          return;
        }
        console.log('[WS] Connected');
        setStatus('connected');
        reconnectAttemptsRef.current = 0;

        // Rejoindre le chat
        ws.send(
          JSON.stringify({
            type: 'join',
            chatId,
            payload: { chatId },
          })
        );
      };

      ws.onmessage = (event) => {
        try {
          const message: WsMessage = JSON.parse(event.data);

          switch (message.type) {
            case 'message:new':
              onMessage?.(message.payload as MessageCreatedPayload);
              break;

            case 'typing':
              onTyping?.(message.payload as UserTypingPayload);
              break;

            case 'message:read':
              onMessageRead?.(message.payload as MessageReadBroadcastPayload);
              break;

            case 'error':
              console.error('[WS] Server error:', message.payload);
              const errorPayload = message.payload as ErrorPayload;
              onError?.(errorPayload?.message || 'Unknown error');
              break;

            case 'join':
              console.log('[WS] Joined chat:', message.payload);
              break;

            default:
              console.log('[WS] Unknown message type:', message.type);
          }
        } catch (error) {
          console.error('[WS] Error parsing message:', error);
        }
      };

      ws.onerror = (error) => {
        console.error('[WS] Connection error:', error);
        setStatus('error');
        onError?.('Connection error');
      };

      ws.onclose = () => {
        if (!isMountedRef.current) {
          return;
        }

        console.log('[WS] Connection closed');
        setStatus('disconnected');

        // Tentative de reconnexion
        if (autoReconnect && reconnectAttemptsRef.current < maxReconnectAttempts && isMountedRef.current) {
          reconnectAttemptsRef.current += 1;
          console.log(
            `[WS] Reconnecting in ${reconnectDelay}ms (attempt ${reconnectAttemptsRef.current}/${maxReconnectAttempts})`
          );

          reconnectTimeoutRef.current = setTimeout(() => {
            if (isMountedRef.current) {
              setStatus('connecting');
              connect();
            }
          }, reconnectDelay);
        }
      };

      // wsRef.current is already set at the top of the try block
    } catch (error) {
      console.error('[WS] Error creating connection:', error);
      setStatus('error');
      onError?.('Failed to create connection');
    }
  }, [chatId, token, autoReconnect, reconnectDelay, onMessage, onTyping, onMessageRead, onError]);

  /**
   * Envoie un nouveau message
   */
  const sendMessage = useCallback(
    (content: string, attachmentUrl?: string) => {
      if (!wsRef.current || wsRef.current.readyState !== WebSocket.OPEN) {
        console.error('[WS] Cannot send message: not connected');
        return;
      }

      wsRef.current.send(
        JSON.stringify({
          type: 'message:new',
          chatId,
          payload: {
            content,
            attachmentUrl,
          },
        })
      );
    },
    [chatId]
  );

  /**
   * Définit le statut de saisie
   */
  const setTyping = useCallback(
    (isTyping: boolean) => {
      if (!wsRef.current || wsRef.current.readyState !== WebSocket.OPEN) {
        return;
      }

      wsRef.current.send(
        JSON.stringify({
          type: 'typing',
          chatId,
          payload: {
            isTyping,
          },
        })
      );
    },
    [chatId]
  );

  /**
   * Marque des messages comme lus
   */
  const markAsRead = useCallback(
    (messageIds: string[]) => {
      if (!wsRef.current || wsRef.current.readyState !== WebSocket.OPEN) {
        return;
      }

      wsRef.current.send(
        JSON.stringify({
          type: 'message:read',
          chatId,
          payload: {
            messageIds,
          },
        })
      );
    },
    [chatId]
  );

  /**
   * Déconnecte manuellement
   */
  const disconnect = useCallback(() => {
    if (reconnectTimeoutRef.current) {
      clearTimeout(reconnectTimeoutRef.current);
    }

    if (wsRef.current) {
      wsRef.current.close();
      wsRef.current = null;
    }

    setStatus('disconnected');
  }, []);

  /**
   * Établit la connexion au montage du composant et se reconnecte quand le chatId change
   */
  useEffect(() => {
    // Mark component as mounted
    isMountedRef.current = true;

    // Si pas de chatId, ne pas se connecter
    if (!chatId) {
      return;
    }

    // Fermer la connexion existante si elle existe
    if (wsRef.current) {
      wsRef.current.close();
      wsRef.current = null;
    }

    // Établir une nouvelle connexion
    connect();

    return () => {
      // Mark component as unmounted
      isMountedRef.current = false;

      // Cleanup: fermer la connexion lors du démontage
      if (reconnectTimeoutRef.current) {
        clearTimeout(reconnectTimeoutRef.current);
        reconnectTimeoutRef.current = null;
      }

      if (wsRef.current && wsRef.current.readyState !== WebSocket.CLOSED) {
        wsRef.current.close();
      }
      wsRef.current = null;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [chatId]); // Se reconnecter quand le chatId change

  return {
    status,
    sendMessage,
    setTyping,
    markAsRead,
    disconnect,
    reconnect: connect,
  };
};
