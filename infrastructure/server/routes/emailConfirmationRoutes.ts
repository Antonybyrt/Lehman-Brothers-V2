import { Router } from 'express';
import { EmailConfirmationController } from '../adapters/controllers';
import { authMiddleware, AuthenticatedRequest } from '../middleware/authMiddleware';

export function createEmailConfirmationRoutes(controller: EmailConfirmationController): Router {
  const router = Router();
  
  // Public route (no authentication required)
  router.get('/confirm-email/:token', controller.confirmEmail.bind(controller));
  
  return router;
}
