import { Router } from 'express';
import { AuthController } from '../adapters/controllers';
import { authMiddleware, AuthenticatedRequest } from '../middleware/authMiddleware';

export const createAuthRoutes = (authController: AuthController): Router => {
  const router = Router();

  // Authentication routes (public)
  router.post('/auth/register', (req, res) => authController.register(req, res));
  router.post('/auth/login', (req, res) => authController.login(req, res));

  // Protected routes (require authentication)
  router.get('/auth/me', authMiddleware, (req: AuthenticatedRequest, res) => {
    res.status(200).json({
      success: true,
      user: {
        userId: req.user?.userId,
        role: req.user?.role
      }
    });
  });

  return router;
};
