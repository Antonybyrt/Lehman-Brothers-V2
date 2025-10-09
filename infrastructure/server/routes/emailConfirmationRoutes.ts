import { Router } from 'express';
import { EmailConfirmationController } from '../adapters/controllers';

export function createEmailConfirmationRoutes(controller: EmailConfirmationController): Router {
  const router = Router();
  
  router.get('/confirm-email/:token', controller.confirmEmail.bind(controller));
  
  return router;
}
