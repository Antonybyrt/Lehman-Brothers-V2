import { Server as HttpServer } from 'http';
import WebSocket, { WebSocketServer } from 'ws';
import { IncomingMessage } from 'http';
import { AuthenticationService, UserViewRepository } from '@lehman-brothers/application';
import {
  WsMessage,
  WsUserContext,
  ClientMessage,
  ServerMessage,
  ErrorPayload,
} from '../../ws/types';

// Interface pour une connexion WebSocket enrichie avec le contexte utilisateur
interface AuthenticatedWebSocket extends WebSocket {
  userId?: string;
  userName?: string;
  userRole?: string;
  isAlive?: boolean;
}

/**
 * Service WebSocket pour le chat temps réel
 * 
 * Responsabilités:
 * - Gérer les connexions WebSocket
 * - Authentifier les clients via JWT
 * - Maintenir des rooms par chatId
 * - Gérer le ping/pong pour keep-alive
 * - Router les messages vers le controller approprié
 */
export class WsServerService {
  private wss: WebSocketServer;
  // Map<chatId, Set<WebSocket>> - Gestion des rooms
  private rooms: Map<string, Set<AuthenticatedWebSocket>>;
  // Intervalle pour le ping/pong
  private pingInterval: NodeJS.Timeout | null = null;

  constructor(
    private readonly httpServer: HttpServer,
    private readonly authService: AuthenticationService,
    private readonly userViewRepository: UserViewRepository
  ) {
    this.rooms = new Map();
    this.wss = new WebSocketServer({ noServer: true });
    this.setupWebSocketServer();
  }

  // Configure le serveur WebSocket
  private setupWebSocketServer(): void {
    // Gérer les upgrades HTTP vers WebSocket
    this.httpServer.on('upgrade', async (request: IncomingMessage, socket, head) => {
      // Vérifier l'authentification avant d'accepter la connexion
      const userContext = await this.authenticateUser(request);

      if (!userContext) {
        socket.write('HTTP/1.1 401 Unauthorized\r\n\r\n');
        socket.destroy();
        return;
      }

      // Accepter la connexion WebSocket
      this.wss.handleUpgrade(request, socket as any, head, (ws: AuthenticatedWebSocket) => {
        // Attacher le contexte utilisateur
        ws.userId = userContext.userId;
        ws.userName = userContext.userName;
        ws.userRole = userContext.userRole;
        ws.isAlive = true;

        this.wss.emit('connection', ws, request);
      });
    });

    // Démarrer le ping/pong keep-alive
    this.startPingPong();
  }

  // Authentifie un utilisateur à partir d'un token dans l'URL ou les headers
  private async authenticateUser(request: IncomingMessage): Promise<WsUserContext | null> {
    try {
      const url = new URL(request.url || '', `http://${request.headers.host}`);
      const token = url.searchParams.get('token');

      if (!token) {
        return null;
      }

      const decoded = this.authService.verifyToken(token);
      if (!decoded) {
        return null;
      }

      // Récupérer le nom de l'utilisateur depuis la base de données
      const userView = await this.userViewRepository.findByIdAsView(decoded.userId);
      let userName = decoded.userId; // Fallback sur l'ID si on ne trouve pas l'utilisateur

      if (userView) {
        // Utiliser le nom complet formaté
        userName = userView.fullName || userView.email;
      }

      return {
        userId: decoded.userId,
        userName,
        userRole: decoded.role,
      };
    } catch (error) {
      return null;
    }
  }

  // Configure les handlers pour une connexion WebSocket
  onConnection(
    handler: (
      ws: AuthenticatedWebSocket,
      message: ClientMessage,
      userContext: WsUserContext
    ) => Promise<void>
  ): void {
    this.wss.on('connection', (ws: AuthenticatedWebSocket) => {
      // Handler pour les messages
      ws.on('message', async (data: Buffer) => {
        try {
          const message = JSON.parse(data.toString()) as ClientMessage;

          // Créer le contexte utilisateur
          const userContext: WsUserContext = {
            userId: ws.userId!,
            userName: ws.userName!,
            userRole: ws.userRole!,
          };

          // Router vers le handler
          await handler(ws, message, userContext);
        } catch (error) {
          this.sendError(ws, 'Invalid message format');
        }
      });

      // Handler pour pong (keep-alive)
      ws.on('pong', () => {
        ws.isAlive = true;
      });

      // Handler pour déconnexion
      ws.on('close', () => {
        this.removeFromAllRooms(ws);
      });

      // Handler pour erreurs
      ws.on('error', () => {
        // Silent error handling
      });
    });
  }

  // Ajoute un client à une room (chat)
  joinRoom(chatId: string, ws: AuthenticatedWebSocket): void {
    if (!this.rooms.has(chatId)) {
      this.rooms.set(chatId, new Set());
    }
    this.rooms.get(chatId)!.add(ws);
  }

  // Retire un client d'une room
  leaveRoom(chatId: string, ws: AuthenticatedWebSocket): void {
    const room = this.rooms.get(chatId);
    if (room) {
      room.delete(ws);
      if (room.size === 0) {
        this.rooms.delete(chatId);
      }
    }
  }

  // Retire un client de toutes les rooms
  private removeFromAllRooms(ws: AuthenticatedWebSocket): void {
    this.rooms.forEach((room, chatId) => {
      if (room.has(ws)) {
        this.leaveRoom(chatId, ws);
      }
    });
  }

  // Broadcast un message à tous les clients d'une room sauf l'émetteur
  broadcastToRoom(
    chatId: string,
    message: ServerMessage,
    excludeWs?: AuthenticatedWebSocket
  ): void {
    const room = this.rooms.get(chatId);
    if (!room) {
      return;
    }

    const messageStr = JSON.stringify(message);

    room.forEach((client) => {
      if (client !== excludeWs && client.readyState === WebSocket.OPEN) {
        client.send(messageStr);
      }
    });
  }

  // Envoie un message à tous les clients d'une room (y compris l'émetteur)
  sendToRoom(chatId: string, message: ServerMessage): void {
    const room = this.rooms.get(chatId);
    if (!room) {
      return;
    }

    const messageStr = JSON.stringify(message);

    room.forEach((client) => {
      if (client.readyState === WebSocket.OPEN) {
        client.send(messageStr);
      }
    });
  }

  // Envoie un message à un client spécifique
  sendToClient(ws: AuthenticatedWebSocket, message: ServerMessage): void {
    if (ws.readyState === WebSocket.OPEN) {
      ws.send(JSON.stringify(message));
    }
  }

  // Broadcast un message à tous les utilisateurs avec un rôle spécifique
  broadcastToRole(role: string, message: ServerMessage): void {
    const messageStr = JSON.stringify(message);

    this.wss.clients.forEach((client) => {
      const authClient = client as AuthenticatedWebSocket;
      if (authClient.userRole === role && authClient.readyState === WebSocket.OPEN) {
        authClient.send(messageStr);
      }
    });
  }

  // Broadcast un message à un utilisateur spécifique par son userId
  broadcastToUser(userId: string, message: ServerMessage): void {
    const messageStr = JSON.stringify(message);

    this.wss.clients.forEach((client) => {
      const authClient = client as AuthenticatedWebSocket;
      if (authClient.userId === userId && authClient.readyState === WebSocket.OPEN) {
        authClient.send(messageStr);
      }
    });
  }

  // Envoie une erreur à un client
  sendError(ws: AuthenticatedWebSocket, errorMessage: string, code?: string): void {
    this.sendToClient(ws, {
      type: 'error',
      payload: {
        message: errorMessage,
      } as ErrorPayload,
    });
  }

  // Démarre le mécanisme de ping/pong pour détecter les connexions mortes
  private startPingPong(): void {
    this.pingInterval = setInterval(() => {
      this.wss.clients.forEach((ws: AuthenticatedWebSocket) => {
        if (!ws.isAlive) {
          return ws.terminate();
        }

        ws.isAlive = false;
        ws.ping();
      });
    }, 60000); // Ping toutes les 60 secondes (augmenté pour éviter les faux positifs)
  }

  // Arrête le serveur WebSocket proprement
  close(): void {
    if (this.pingInterval) {
      clearInterval(this.pingInterval);
    }

    this.wss.clients.forEach((ws: WebSocket) => {
      ws.close();
    });

    this.wss.close();
  }

  // Retourne le nombre de clients connectés à une room
  getRoomSize(chatId: string): number {
    return this.rooms.get(chatId)?.size || 0;
  }

  // Retourne la liste des chatIds actifs
  getActiveRooms(): string[] {
    return Array.from(this.rooms.keys());
  }
}
