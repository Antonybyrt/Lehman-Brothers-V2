import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import { PrismaClient } from '@prisma/client';
import { AuthController, EmailConfirmationController, AccountController } from './adapters/controllers';
import { PrismaUserRepository, PrismaEmailConfirmationRepository, PrismaAccountRepository } from './adapters/repositories';
import { JwtAuthenticationService, NodemailerEmailService } from './adapters/services';
import { RegisterUserUseCase, LoginUserUseCase, ConfirmEmailUseCase, CreateAccountUseCase, GetUserAccountsUseCase, GetAccountByIdUseCase, UpdateAccountUseCase, DeleteAccountUseCase } from '@lehman-brothers/application';
import { createAppRoutes } from './routes';

const app = express();
const port = process.env.PORT || 3000;

// Middleware
app.use(helmet());
app.use(cors());
app.use(express.json());

// Database
const prisma = new PrismaClient();

// Dependencies injection
const userRepository = new PrismaUserRepository(prisma);
const emailConfirmationRepository = new PrismaEmailConfirmationRepository(prisma);
const accountRepository = new PrismaAccountRepository(prisma);
const authenticationService = new JwtAuthenticationService(
  process.env.JWT_SECRET || 'fallback-secret',
  process.env.JWT_EXPIRES_IN || '7d'
);
const emailService = new NodemailerEmailService();

const registerUserUseCase = new RegisterUserUseCase(userRepository, emailConfirmationRepository, emailService);
const loginUserUseCase = new LoginUserUseCase(userRepository, authenticationService);
const confirmEmailUseCase = new ConfirmEmailUseCase(emailConfirmationRepository, userRepository);
const createAccountUseCase = new CreateAccountUseCase(accountRepository, userRepository);
const getUserAccountsUseCase = new GetUserAccountsUseCase(accountRepository, userRepository);
const getAccountByIdUseCase = new GetAccountByIdUseCase(accountRepository);
const updateAccountUseCase = new UpdateAccountUseCase(accountRepository);
const deleteAccountUseCase = new DeleteAccountUseCase(accountRepository);

const authController = new AuthController(registerUserUseCase, loginUserUseCase);
const emailConfirmationController = new EmailConfirmationController(confirmEmailUseCase);
const accountController = new AccountController(createAccountUseCase, getUserAccountsUseCase, getAccountByIdUseCase, updateAccountUseCase, deleteAccountUseCase);

// Routes
app.use(createAppRoutes(authController, emailConfirmationController, accountController));

// Error handling middleware
app.use((err: Error, req: express.Request, res: express.Response, next: express.NextFunction) => {
  console.error(err.stack);
  res.status(500).json({ error: 'Something went wrong!' });
});

app.listen(port, () => {
  console.log(`🚀 Lehman Brothers V2 server running on port ${port}`);
  console.log(`📊 Health check: http://localhost:${port}/health`);
  console.log(`🔐 Auth endpoints:`);
  console.log(`   POST http://localhost:${port}/auth/register`);
  console.log(`   POST http://localhost:${port}/auth/login`);
  console.log(`   GET http://localhost:${port}/auth/me (Protected)`);
  console.log(`   GET http://localhost:${port}/auth/getrole (Protected)`);
  console.log(`📧 Email confirmation:`);
  console.log(`   GET http://localhost:${port}/confirm-email/:token`);
  console.log(`   GET http://localhost:${port}/email-status (Protected)`);
  console.log(`💳 Account endpoints:`);
  console.log(`   POST http://localhost:${port}/accounts (Protected)`);
  console.log(`   GET http://localhost:${port}/accounts (Protected)`);
  console.log(`   GET http://localhost:${port}/accounts/:id (Protected)`);
  console.log(`   PATCH http://localhost:${port}/accounts/:id (Protected)`);
  console.log(`   DELETE http://localhost:${port}/accounts/:id (Protected)`);
});

process.on('SIGINT', async () => {
  console.log('🛑 Shutting down server...');
  await prisma.$disconnect();
  process.exit(0);
});

process.on('SIGTERM', async () => {
  console.log('🛑 Shutting down server...');
  await prisma.$disconnect();
  process.exit(0);
});
