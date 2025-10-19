import 'dotenv/config';
import express from 'express';
import { createServer } from 'http';
import cors from 'cors';
import helmet from 'helmet';
import { PrismaClient } from '@prisma/client';
import {
  AuthController,
  EmailConfirmationController,
  AccountController,
  ChatController,
  ChatRestController
} from './adapters/controllers';
import {
  PrismaUserRepository,
  PrismaEmailConfirmationRepository,
  PrismaAccountRepository,
  PrismaTransactionRepository,
  PrismaChatRepository,
  PrismaMessageRepository,
  PrismaMessageReadRepository,
  PrismaChatViewRepository,
  PrismaUserViewRepository
} from './adapters/repositories';
import {
  JwtAuthenticationService,
  NodemailerEmailService,
  WsServerService,
  WsChatNotificationService
} from './adapters/services';
import {
  RegisterUserUseCase,
  LoginUserUseCase,
  ConfirmEmailUseCase,
  CreateAccountUseCase,
  GetUserAccountsUseCase,
  GetAccountByIdUseCase,
  UpdateAccountUseCase,
  DeleteAccountUseCase,
  CreateChatUseCase,
  SendMessageUseCase,
  GetMessagesBeforeUseCase,
  MarkAsReadUseCase,
  TransferChatUseCase,
  SetTypingStatusUseCase,
  CloseChatUseCase
} from '@lehman-brothers/application';
import { createAppRoutes } from './routes';

const app = express();
const httpServer = createServer(app);
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
const transactionRepository = new PrismaTransactionRepository(prisma);
const chatRepository = new PrismaChatRepository(prisma);
const messageRepository = new PrismaMessageRepository(prisma);
const messageReadRepository = new PrismaMessageReadRepository(prisma);
const chatViewRepository = new PrismaChatViewRepository(prisma);
const userViewRepository = new PrismaUserViewRepository(prisma);

const authenticationService = new JwtAuthenticationService(
  process.env.JWT_SECRET || 'fallback-secret',
  process.env.JWT_EXPIRES_IN || '7d'
);
const emailService = new NodemailerEmailService();

// WebSocket Service (instantiated before notification service)
const wsService = new WsServerService(httpServer, authenticationService, userViewRepository);

// Notification Service (wraps WsService with abstraction)
const notificationService = new WsChatNotificationService(wsService);

// Auth use cases
const registerUserUseCase = new RegisterUserUseCase(userRepository, emailConfirmationRepository, emailService);
const loginUserUseCase = new LoginUserUseCase(userRepository, authenticationService);
const confirmEmailUseCase = new ConfirmEmailUseCase(emailConfirmationRepository, userRepository);

// Account use cases
const createAccountUseCase = new CreateAccountUseCase(accountRepository, userRepository);
const getUserAccountsUseCase = new GetUserAccountsUseCase(accountRepository, userRepository);
const getAccountByIdUseCase = new GetAccountByIdUseCase(accountRepository);
const updateAccountUseCase = new UpdateAccountUseCase(accountRepository);
const deleteAccountUseCase = new DeleteAccountUseCase(accountRepository, transactionRepository);

// Chat use cases (now use ChatNotificationService abstraction)
const createChatUseCase = new CreateChatUseCase(chatRepository, userRepository, chatViewRepository, notificationService);
const sendMessageUseCase = new SendMessageUseCase(chatRepository, messageRepository, userRepository, userViewRepository, notificationService);
const getMessagesBeforeUseCase = new GetMessagesBeforeUseCase(messageRepository, chatRepository, messageReadRepository, userRepository);
const markAsReadUseCase = new MarkAsReadUseCase(messageReadRepository, messageRepository, chatRepository);
const transferChatUseCase = new TransferChatUseCase(chatRepository, userRepository);
const setTypingStatusUseCase = new SetTypingStatusUseCase(chatRepository);
const closeChatUseCase = new CloseChatUseCase(chatRepository);

// HTTP Controllers
const authController = new AuthController(registerUserUseCase, loginUserUseCase);
const emailConfirmationController = new EmailConfirmationController(confirmEmailUseCase);
const accountController = new AccountController(createAccountUseCase, getUserAccountsUseCase, getAccountByIdUseCase, updateAccountUseCase, deleteAccountUseCase);
const chatRestController = new ChatRestController(
  createChatUseCase,
  getMessagesBeforeUseCase,
  closeChatUseCase,
  transferChatUseCase,
  chatRepository,
  userRepository,
  chatViewRepository,
  userViewRepository,
  wsService
);

// WebSocket Controller
const chatController = new ChatController(
  wsService,
  sendMessageUseCase,
  getMessagesBeforeUseCase,
  markAsReadUseCase,
  setTypingStatusUseCase,
  userRepository,
  chatRepository,
  userViewRepository
);

// Routes
app.use(createAppRoutes(authController, emailConfirmationController, accountController, chatRestController));

// Error handling middleware
app.use((err: Error, req: express.Request, res: express.Response, next: express.NextFunction) => {
  console.error(err.stack);
  res.status(500).json({ error: 'Something went wrong!' });
});

httpServer.listen(port, () => {
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
  console.log(`💬 Chat REST endpoints:`);
  console.log(`   POST http://localhost:${port}/chats (Protected)`);
  console.log(`   GET http://localhost:${port}/chats (Protected)`);
  console.log(`   GET http://localhost:${port}/chats/:id (Protected)`);
  console.log(`   GET http://localhost:${port}/chats/:id/messages (Protected)`);
  console.log(`   POST http://localhost:${port}/chats/:id/close (Protected - Advisor)`);
  console.log(`   POST http://localhost:${port}/chats/:id/transfer (Protected - Advisor)`);
  console.log(`🔌 WebSocket chat:`);
  console.log(`   ws://localhost:${port}?token=<JWT>`);
  console.log(`   Events: message:new, message:read, typing, chat:created, chat:updated`);
});

process.on('SIGINT', async () => {
  console.log('🛑 Shutting down server...');
  wsService.close();
  await prisma.$disconnect();
  process.exit(0);
});

process.on('SIGTERM', async () => {
  console.log('🛑 Shutting down server...');
  wsService.close();
  await prisma.$disconnect();
  process.exit(0);
});
