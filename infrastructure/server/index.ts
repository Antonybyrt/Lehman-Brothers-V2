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
  TransactionController,
  ChatController,
  ChatRestController,
  SavingsBookController,
  SavingsRateController
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
  PrismaUserViewRepository,
  PrismaStockRepository,
  PrismaOrderRepository,
  PrismaPortfolioRepository,
  PrismaTradeRepository,
  PrismaSavingsBookRepository,
  PrismaSavingsRateRepository,
  PrismaDailyInterestRepository
} from './adapters/repositories';
import {
  JwtAuthenticationService,
  NodemailerEmailService,
  WsServerService,
  WsChatNotificationService,
  WsSavingsNotificationService
} from './adapters/services';
import {
  RegisterUserUseCase,
  LoginUserUseCase,
  ConfirmEmailUseCase,
  CreateAccountUseCase,
  GetUserAccountsUseCase,
  GetAllAccountsUseCase,
  GetAccountByIdUseCase,
  UpdateAccountUseCase,
  DeleteAccountUseCase,
  TransferAccountUseCase,
  CreateChatUseCase,
  SendMessageUseCase,
  GetMessagesBeforeUseCase,
  MarkAsReadUseCase,
  TransferChatUseCase,
  SetTypingStatusUseCase,
  CloseChatUseCase,
  GetPendingChatsUseCase,
  GetUserChatsUseCase,
  CreateStockUseCase,
  ListStocksUseCase,
  UpdateStockStatusUseCase,
  PlaceOrderUseCase,
  CancelOrderUseCase,
  GetUserPortfolioUseCase,
  GetUserOrdersUseCase,
  GetStockOrdersUseCase,
  MatchOrdersUseCase,
  GetStockTradesUseCase,
  GetChatByIdUseCase,
  CreateSavingsBookUseCase,
  GetUserSavingsBooksUseCase,
  SetSavingsRateUseCase,
  GetCurrentRatesUseCase,
  ApplyDailyInterestUseCase,
  DepositToSavingsBookUseCase,
  WithdrawFromSavingsBookUseCase,
  GetUserTransactionsUseCase
} from '@lehman-brothers/application';
import { createAppRoutes } from './routes';
import { InterestScheduler } from './scheduler';
import { InvestmentController } from './adapters/controllers/InvestmentController';

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
const stockRepository = new PrismaStockRepository(prisma);
const orderRepository = new PrismaOrderRepository(prisma);
const portfolioRepository = new PrismaPortfolioRepository(prisma);
const tradeRepository = new PrismaTradeRepository(prisma);
const savingsBookRepository = new PrismaSavingsBookRepository(prisma);
const savingsRateRepository = new PrismaSavingsRateRepository(prisma);
const dailyInterestRepository = new PrismaDailyInterestRepository(prisma);

const authenticationService = new JwtAuthenticationService(
  process.env.JWT_SECRET || 'fallback-secret',
  process.env.JWT_EXPIRES_IN || '7d'
);
const emailService = new NodemailerEmailService();

// WebSocket Service
const wsService = new WsServerService(httpServer, authenticationService, userViewRepository);

// Notification Service
const notificationService = new WsChatNotificationService(wsService);
const savingsNotificationService = new WsSavingsNotificationService(wsService, savingsBookRepository);

// Auth use cases
const registerUserUseCase = new RegisterUserUseCase(userRepository, emailConfirmationRepository, emailService);
const loginUserUseCase = new LoginUserUseCase(userRepository, authenticationService);
const confirmEmailUseCase = new ConfirmEmailUseCase(emailConfirmationRepository, userRepository);

// Account use cases
const createAccountUseCase = new CreateAccountUseCase(accountRepository, userRepository);
const getUserAccountsUseCase = new GetUserAccountsUseCase(accountRepository, userRepository);
const getAllAccountsUseCase = new GetAllAccountsUseCase(accountRepository, userRepository);
const getAccountByIdUseCase = new GetAccountByIdUseCase(accountRepository);
const updateAccountUseCase = new UpdateAccountUseCase(accountRepository);
const deleteAccountUseCase = new DeleteAccountUseCase(accountRepository, transactionRepository);
const transferAccountUseCase = new TransferAccountUseCase(accountRepository, transactionRepository);

// ... (existing imports)

// Services
const matchOrdersUseCase = new MatchOrdersUseCase(orderRepository, portfolioRepository, accountRepository, stockRepository, tradeRepository, userRepository);

// Investment use cases
const placeOrderUseCase = new PlaceOrderUseCase(orderRepository, stockRepository, portfolioRepository, accountRepository, matchOrdersUseCase);
const createStockUseCase = new CreateStockUseCase(stockRepository, portfolioRepository, userRepository, placeOrderUseCase);
const listStocksUseCase = new ListStocksUseCase(stockRepository, userRepository);
const updateStockStatusUseCase = new UpdateStockStatusUseCase(stockRepository, userRepository);
const cancelOrderUseCase = new CancelOrderUseCase(orderRepository, portfolioRepository, accountRepository);
const getUserPortfolioUseCase = new GetUserPortfolioUseCase(portfolioRepository);

// Transaction use cases
const getUserTransactionsUseCase = new GetUserTransactionsUseCase(transactionRepository, accountRepository);

// Chat use cases
const createChatUseCase = new CreateChatUseCase(chatRepository, userRepository, chatViewRepository, notificationService);
const sendMessageUseCase = new SendMessageUseCase(chatRepository, messageRepository, userRepository, userViewRepository, notificationService);
const getMessagesBeforeUseCase = new GetMessagesBeforeUseCase(messageRepository, chatRepository, messageReadRepository, userRepository);
const markAsReadUseCase = new MarkAsReadUseCase(messageReadRepository, messageRepository, chatRepository);
const transferChatUseCase = new TransferChatUseCase(chatRepository, userRepository);
const setTypingStatusUseCase = new SetTypingStatusUseCase(chatRepository);
const closeChatUseCase = new CloseChatUseCase(chatRepository);
const getPendingChatsUseCase = new GetPendingChatsUseCase(chatRepository, messageRepository, chatViewRepository);
const getUserChatsUseCase = new GetUserChatsUseCase(chatRepository, userViewRepository, messageRepository);
const getChatByIdUseCase = new GetChatByIdUseCase(chatRepository);

const getUserOrdersUseCase = new GetUserOrdersUseCase(orderRepository);
const getStockOrdersUseCase = new GetStockOrdersUseCase(orderRepository);
const getStockTradesUseCase = new GetStockTradesUseCase(tradeRepository);

// Savings use cases
const createSavingsBookUseCase = new CreateSavingsBookUseCase(savingsBookRepository, userRepository);
const getUserSavingsBooksUseCase = new GetUserSavingsBooksUseCase(savingsBookRepository);
const setSavingsRateUseCase = new SetSavingsRateUseCase(savingsRateRepository, savingsBookRepository, userRepository, savingsNotificationService);
const getCurrentRatesUseCase = new GetCurrentRatesUseCase(savingsRateRepository);
const applyDailyInterestUseCase = new ApplyDailyInterestUseCase(savingsBookRepository, savingsRateRepository, dailyInterestRepository, userRepository);
const depositToSavingsBookUseCase = new DepositToSavingsBookUseCase(savingsBookRepository, accountRepository);
const withdrawFromSavingsBookUseCase = new WithdrawFromSavingsBookUseCase(savingsBookRepository, accountRepository);

// HTTP Controllers
const authController = new AuthController(registerUserUseCase, loginUserUseCase);
const emailConfirmationController = new EmailConfirmationController(confirmEmailUseCase);
const accountController = new AccountController(createAccountUseCase, getUserAccountsUseCase, getAccountByIdUseCase, updateAccountUseCase, deleteAccountUseCase, transferAccountUseCase, getAllAccountsUseCase);
const transactionController = new TransactionController(getUserTransactionsUseCase);
const chatRestController = new ChatRestController(
  createChatUseCase,
  getMessagesBeforeUseCase,
  closeChatUseCase,
  transferChatUseCase,
  getPendingChatsUseCase,
  getUserChatsUseCase,
  getChatByIdUseCase,
  chatRepository,
  chatViewRepository,
  wsService
);
const investmentController = new InvestmentController(
  createStockUseCase,
  listStocksUseCase,
  updateStockStatusUseCase,
  placeOrderUseCase,
  cancelOrderUseCase,
  getUserPortfolioUseCase,
  getUserOrdersUseCase,
  getStockOrdersUseCase,
  getStockTradesUseCase
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

// Savings Controllers
const savingsBookController = new SavingsBookController(
  createSavingsBookUseCase,
  getUserSavingsBooksUseCase,
  depositToSavingsBookUseCase,
  withdrawFromSavingsBookUseCase,
  getCurrentRatesUseCase
);
const savingsRateController = new SavingsRateController(
  setSavingsRateUseCase,
  applyDailyInterestUseCase,
  getCurrentRatesUseCase
);

// Routes
app.use(createAppRoutes(authController, emailConfirmationController, accountController, transactionController, chatRestController, investmentController, savingsBookController, savingsRateController));

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
  console.log(`   POST http://localhost:${port}/accounts/:id/transfer (Protected)`);
  console.log(`   DELETE http://localhost:${port}/accounts/:id (Protected)`);
  console.log(`📜 Transaction endpoints:`);
  console.log(`   GET http://localhost:${port}/transactions (Protected)`);
  console.log(`💰 Savings endpoints:`);
  console.log(`   POST http://localhost:${port}/savings-books (Protected)`);
  console.log(`   GET http://localhost:${port}/savings-books (Protected)`);
  console.log(`   POST http://localhost:${port}/savings-books/:id/deposit (Protected)`);
  console.log(`   POST http://localhost:${port}/savings-books/:id/withdraw (Protected)`);
  console.log(`   GET http://localhost:${port}/savings-rates (Protected)`);
  console.log(`   POST http://localhost:${port}/savings-rates (Protected - Director)`);
  console.log(`💰 Investment endpoints:`);
  console.log(`   GET http://localhost:${port}/stocks (Protected)`);
  console.log(`   GET http://localhost:${port}/stocks/:id (Protected)`);
  console.log(`   POST http://localhost:${port}/stocks (Protected - Director)`);
  console.log(`   PATCH http://localhost:${port}/stocks/:id (Protected - Director)`);
  console.log(`   DELETE http://localhost:${port}/stocks/:id (Protected - Director)`);
  console.log(`   GET http://localhost:${port}/orders (Protected)`);
  console.log(`   GET http://localhost:${port}/orders/:id (Protected)`);
  console.log(`   POST http://localhost:${port}/orders (Protected - Director)`);
  console.log(`   PATCH http://localhost:${port}/orders/:id (Protected - Director)`);
  console.log(`   DELETE http://localhost:${port}/orders/:id (Protected - Director)`);
  console.log(`   GET http://localhost:${port}/trades (Protected)`);
  console.log(`   GET http://localhost:${port}/trades/:id (Protected)`);
  console.log(`   POST http://localhost:${port}/trades (Protected - Director)`);
  console.log(`   PATCH http://localhost:${port}/trades/:id (Protected - Director)`);
  console.log(`   DELETE http://localhost:${port}/trades/:id (Protected - Director)`);
  console.log(`💬 Chat REST endpoints:`);
  console.log(`   POST http://localhost:${port}/chats (Protected)`);
  console.log(`   GET http://localhost:${port}/chats (Protected)`);
  console.log(`   GET http://localhost:${port}/chats/:id (Protected)`);
  console.log(`   GET http://localhost:${port}/chats/:id/messages (Protected)`);
  console.log(`   GET http://localhost:${port}/chats/pending (Protected - Advisor)`);
  console.log(`   POST http://localhost:${port}/chats/:id/close (Protected - Advisor)`);
  console.log(`   POST http://localhost:${port}/chats/:id/transfer (Protected - Advisor)`);
  console.log(`🔌 WebSocket chat:`);
  console.log(`   ws://localhost:${port}`);
  console.log(`   Client → Server: message:new, message:read, typing, join`);
  console.log(`   Server → Client: message:created, chat:created, chat:updated, chat:closed`);
});

// Start automated daily interest scheduler
const interestScheduler = new InterestScheduler(applyDailyInterestUseCase);
interestScheduler.start();

process.on('SIGINT', async () => {
  console.log('🛑 Shutting down server...');
  interestScheduler.stop();
  wsService.close();
  await prisma.$disconnect();
  process.exit(0);
});

process.on('SIGTERM', async () => {
  console.log('🛑 Shutting down server...');
  interestScheduler.stop();
  wsService.close();
  await prisma.$disconnect();
  process.exit(0);
});
