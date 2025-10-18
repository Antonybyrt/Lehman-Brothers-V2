import { Router } from 'express';
import { ChatRestController } from '../adapters/controllers';
import { authMiddleware, AuthenticatedRequest } from '../middleware/authMiddleware';

export const createChatRoutes = (chatRestController: ChatRestController): Router => {
  const router = Router();

  // Protected routes (require authentication)

  /**
   * POST /chats
   * Create a new chat
   */
  router.post('/chats', authMiddleware, (req: AuthenticatedRequest, res) =>
    chatRestController.createChat(req, res)
  );

  /**
   * GET /chats
   * Get all chats for the authenticated user
   */
  router.get('/chats', authMiddleware, (req: AuthenticatedRequest, res) =>
    chatRestController.getUserChats(req, res)
  );

  /**
   * GET /chats/:id
   * Get a specific chat by ID
   */
  router.get('/chats/:id', authMiddleware, (req: AuthenticatedRequest, res) =>
    chatRestController.getChatById(req, res)
  );

  /**
   * GET /chats/:id/messages
   * Get messages for a specific chat
   */
  router.get('/chats/:id/messages', authMiddleware, (req: AuthenticatedRequest, res) =>
    chatRestController.getChatMessages(req, res)
  );

  /**
   * POST /chats/:id/close
   * Close a chat (advisor only)
   */
  router.post('/chats/:id/close', authMiddleware, (req: AuthenticatedRequest, res) =>
    chatRestController.closeChat(req, res)
  );

  /**
   * POST /chats/:id/transfer
   * Transfer a chat to another advisor
   */
  router.post('/chats/:id/transfer', authMiddleware, (req: AuthenticatedRequest, res) =>
    chatRestController.transferChat(req, res)
  );

  return router;
};
