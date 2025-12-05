import { Response } from 'express';
import {
  CreateChatUseCase,
  GetMessagesBeforeUseCase,
  CloseChatUseCase,
  TransferChatUseCase,
  GetPendingChatsUseCase,
  GetUserChatsUseCase,
  GetChatByIdUseCase
} from '@lehman-brothers/application';
import { exhaustive } from 'exhaustive';
import { AuthenticatedRequest } from '../../middleware/authMiddleware';
import {
  ChatRepository,
  ChatViewRepository
} from '@lehman-brothers/application';
import { WsServerService } from '../services/WsServerService';
import { UserRole } from '@lehman-brothers/domain/values/UserRole';

export class ChatRestController {
  constructor(
    private readonly createChatUseCase: CreateChatUseCase,
    private readonly getMessagesBeforeUseCase: GetMessagesBeforeUseCase,
    private readonly closeChatUseCase: CloseChatUseCase,
    private readonly transferChatUseCase: TransferChatUseCase,
    private readonly getPendingChatsUseCase: GetPendingChatsUseCase,
    private readonly getUserChatsUseCase: GetUserChatsUseCase,
    private readonly getChatByIdUseCase: GetChatByIdUseCase,
    private readonly chatRepository: ChatRepository,
    private readonly chatViewRepository: ChatViewRepository,
    private readonly wsServerService: WsServerService
  ) { }

  /**
   * POST /chats
   * Create a new chat
   */
  public async createChat(req: AuthenticatedRequest, res: Response): Promise<void> {
    const { subject, clientId: requestedClientId } = req.body;
    const userId = req.user?.userId;
    const userRole = req.user?.role;
    const { priority } = req.body;

    if (!userId) {
      res.status(401).json({
        success: false,
        error: 'User authentication required'
      });
      return;
    }

    // Determine the actual client ID:
    // - If user is ADVISOR and provides clientId, use it
    // - Otherwise, use the authenticated user's ID
    let actualClientId = userId;
    if (userRole === UserRole.ADVISOR && requestedClientId) {
      actualClientId = requestedClientId;
    }

    const result = await this.createChatUseCase.execute({
      clientId: actualClientId,
      subject,
      priority,
      ...(userRole ? { creatorRole: userRole, creatorId: userId } : {}),
    });

    exhaustive(String(result.success), {
      'true': async () => {
        res.status(201).json({
          success: true,
          chatId: result.chatId,
          subject: result.subject
        });
      },
      'false': () => {
        const statusCode = exhaustive(String(result.errorType), {
          'validation': () => 400,
          'not_found': () => 404,
          'server': () => 500,
          'undefined': () => 400
        });

        res.status(statusCode).json({
          success: false,
          error: result.error,
          errorType: result.errorType
        });
      }
    });
  }

  /**
   * GET /chats
   * Get all chats for the authenticated user
   */
  public async getUserChats(req: AuthenticatedRequest, res: Response): Promise<void> {
    const userId = req.user?.userId;
    const userRole = req.user?.role;

    if (!userId || !userRole) {
      res.status(401).json({
        success: false,
        error: 'User authentication required'
      });
      return;
    }

    const result = await this.getUserChatsUseCase.execute({
      userId,
      userRole
    });

    if (result.success) {
      res.status(200).json({
        success: true,
        chats: result.chats
      });
    } else {
      res.status(500).json({
        success: false,
        error: result.error
      });
    }
  }

  /**
   * GET /chats/pending
   * Get chats pending advisor response
   */
  public async getPendingChats(req: AuthenticatedRequest, res: Response): Promise<void> {
    const userId = req.user?.userId;
    const userRole = req.user?.role;

    if (!userId || !userRole) {
      res.status(401).json({
        success: false,
        error: 'User authentication required'
      });
      return;
    }

    const result = await this.getPendingChatsUseCase.execute({
      userId,
      userRole
    });

    exhaustive(String(result.success), {
      'true': () => {
        res.status(200).json({
          success: true,
          chats: result.chats
        });
      },
      'false': () => {
        const statusCode = exhaustive(String(result.errorType), {
          'validation': () => 400,
          'server': () => 500,
        });

        res.status(statusCode).json({
          success: false,
          error: result.error
        });
      }
    });
  }

  /**
   * GET /chats/:id
   * Get a specific chat by ID
   */
  public async getChatById(req: AuthenticatedRequest, res: Response): Promise<void> {
    const { id } = req.params;
    const userId = req.user?.userId;
    const userRole = req.user?.role;

    if (!userId || !userRole) {
      res.status(401).json({
        success: false,
        error: 'User authentication required'
      });
      return;
    }

    if (!id) {
      res.status(400).json({
        success: false,
        error: 'Chat ID is required'
      });
      return;
    }

    const result = await this.getChatByIdUseCase.execute({
      chatId: id,
      userId,
      userRole
    });

    exhaustive(String(result.success), {
      'true': () => {
        res.status(200).json({
          success: true,
          chat: result.chat
        });
      },
      'false': () => {
        const statusCode = exhaustive(String(result.errorType), {
          'validation': () => 400,
          'not_found': () => 404,
          'unauthorized': () => 403,
          'server': () => 500,
          'undefined': () => 500
        });

        res.status(statusCode).json({
          success: false,
          error: result.error
        });
      }
    });
  }

  /**
   * GET /chats/:id/messages
   * Get messages for a specific chat
   */
  public async getChatMessages(req: AuthenticatedRequest, res: Response): Promise<void> {
    const { id: chatId } = req.params;
    const { beforeId, limit } = req.query;
    const userId = req.user?.userId;
    const userRole = req.user?.role;

    if (!userId || !userRole) {
      res.status(401).json({
        success: false,
        error: 'User authentication required'
      });
      return;
    }

    if (!chatId) {
      res.status(400).json({
        success: false,
        error: 'Chat ID is required'
      });
      return;
    }

    // Get messages
    const executeParams: any = {
      chatId,
      userId,
      userRole,
    };

    if (beforeId) {
      executeParams.beforeId = String(beforeId);
    }

    if (limit) {
      executeParams.limit = parseInt(String(limit));
    }

    const result = await this.getMessagesBeforeUseCase.execute(executeParams);

    if (!result.success) {
      const statusCode = exhaustive(String(result.errorType), {
        'validation': () => 400,
        'not_found': () => 404,
        'unauthorized': () => 403,
        'server': () => 500,
        'undefined': () => 400
      });

      res.status(statusCode).json({
        success: false,
        error: result.error
      });
      return;
    }

    res.status(200).json({
      success: true,
      messages: result.messages,
      hasMore: result.hasMore
    });
  }

  /**
   * POST /chats/:id/close
   * Close a chat (advisor only)
   */
  public async closeChat(req: AuthenticatedRequest, res: Response): Promise<void> {
    const { id: chatId } = req.params;
    const userId = req.user?.userId;
    const userRole = req.user?.role;

    if (!userId || !userRole) {
      res.status(401).json({
        success: false,
        error: 'User authentication required'
      });
      return;
    }

    if (!chatId) {
      res.status(400).json({
        success: false,
        error: 'Chat ID is required'
      });
      return;
    }

    const result = await this.closeChatUseCase.execute({
      chatId,
      userId,
      userRole,
    });

    exhaustive(String(result.success), {
      'true': async () => {
        if (result.notifications) {
          const chatPayload = {
            chatId,
            status: 'CLOSED',
          };

          if (result.notifications.notifyClient) {
            this.wsServerService.broadcastToUser(result.notifications.clientId, {
              type: 'chat:updated',
              payload: chatPayload
            });
          }

          if (result.notifications.notifyAdvisor && result.notifications.advisorId) {
            this.wsServerService.broadcastToUser(result.notifications.advisorId, {
              type: 'chat:updated',
              payload: chatPayload
            });
          }
        }

        res.status(200).json({
          success: true,
          message: 'Chat closed successfully'
        });
      },
      'false': () => {
        const statusCode = exhaustive(String(result.errorType), {
          'validation': () => 400,
          'not_found': () => 404,
          'unauthorized': () => 403,
          'business': () => 400,
          'server': () => 500,
        });

        res.status(statusCode).json({
          success: false,
          error: result.error
        });
      }
    });
  }

  /**
   * POST /chats/:id/transfer
   * Transfer a chat to another advisor
   */
  public async transferChat(req: AuthenticatedRequest, res: Response): Promise<void> {
    const { id: chatId } = req.params;
    const { newAdvisorId } = req.body;
    const userId = req.user?.userId;
    const userRole = req.user?.role;

    if (!userId || !userRole) {
      res.status(401).json({
        success: false,
        error: 'User authentication required'
      });
      return;
    }

    if (!chatId) {
      res.status(400).json({
        success: false,
        error: 'Chat ID is required'
      });
      return;
    }

    if (!newAdvisorId) {
      res.status(400).json({
        success: false,
        error: 'New advisor ID is required'
      });
      return;
    }

    const result = await this.transferChatUseCase.execute({
      chatId,
      newAdvisorId,
      requestingUserId: userId,
      requestingUserRole: userRole,
    });

    exhaustive(String(result.success), {
      'true': async () => {
        const chatView = await this.chatViewRepository.findByIdWithNames(chatId);

        if (chatView) {
          const chatPayload = {
            chatId: chatView.id,
            subject: chatView.subject,
            clientId: chatView.clientId,
            clientName: chatView.clientName,
            advisorId: chatView.advisorId,
            advisorName: chatView.advisorName,
            status: chatView.status,
            priority: chatView.priority,
            createdAt: chatView.createdAt.toISOString(),
          };

          if (result.notifications) {
            if (result.notifications.notifyClient) {
              this.wsServerService.broadcastToUser(result.notifications.clientId, {
                type: 'chat:updated',
                payload: chatPayload
              });
            }

            if (result.notifications.notifyPreviousAdvisor && result.notifications.previousAdvisorId) {
              this.wsServerService.broadcastToUser(result.notifications.previousAdvisorId, {
                type: 'chat:updated',
                payload: chatPayload
              });
            }

            if (result.notifications.notifyNewAdvisor) {
              this.wsServerService.broadcastToUser(result.notifications.newAdvisorId, {
                type: 'chat:updated',
                payload: chatPayload
              });
            }
          }
        }

        res.status(200).json({
          success: true,
          chatId: result.chatId,
          previousAdvisorId: result.previousAdvisorId,
          newAdvisorId: result.newAdvisorId
        });
      },
      'false': () => {
        const statusCode = exhaustive(String(result.errorType), {
          'validation': () => 400,
          'not_found': () => 404,
          'unauthorized': () => 403,
          'server': () => 500,
        });

        res.status(statusCode).json({
          success: false,
          error: result.error
        });
      }
    });
  }
}
