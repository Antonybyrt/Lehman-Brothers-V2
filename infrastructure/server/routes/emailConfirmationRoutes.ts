import { Router } from 'express';
import { EmailConfirmationController } from '../adapters/controllers';
import { authMiddleware, AuthenticatedRequest } from '../middleware/authMiddleware';

export function createEmailConfirmationRoutes(controller: EmailConfirmationController): Router {
  const router = Router();
  
  // Public route (no authentication required)
  router.get('/confirm-email/:token', controller.confirmEmail.bind(controller));
  
  // Protected route example (requires authentication)
  router.get('/email-status', authMiddleware, (req: AuthenticatedRequest, res) => {
    res.status(200).json({
      success: true,
      message: 'Email status checked successfully',
      user: {
        userId: req.user?.userId,
        role: req.user?.role
      }
    });
  });
  
  return router;
}
