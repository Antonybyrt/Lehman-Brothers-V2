import { Request, Response } from 'express';
import { CreateAccountUseCase, GetUserAccountsUseCase } from '@lehman-brothers/application';
import { exhaustive } from 'exhaustive';
import { AuthenticatedRequest } from '../middleware/authMiddleware';

export class AccountController {
  constructor(
    private readonly createAccountUseCase: CreateAccountUseCase,
    private readonly getUserAccountsUseCase: GetUserAccountsUseCase
  ) {}

  public async createAccount(req: AuthenticatedRequest, res: Response): Promise<void> {
    const { name, isSavings, initialBalance } = req.body;
    const userId = req.user?.userId;

    if (!userId) {
      res.status(401).json({
        success: false,
        error: 'User authentication required'
      });
      return;
    }

    const result = await this.createAccountUseCase.execute({
      userId,
      name,
      isSavings,
      initialBalance,
    });

    exhaustive(String(result.success), {
      'true': () => {
        res.status(201).json({
          success: true,
          message: result.message,
          accountId: result.accountId,
          iban: result.iban
        });
      },
      'false': () => {
        // Determine HTTP status code based on error type
        const statusCode = exhaustive(String(result.errorType), {
          'validation': () => 400,
          'not_found': () => 404,
          'server': () => 500,
          'undefined': () => 400
        });

        res.status(statusCode).json({
          success: false,
          error: result.error,
          type: result.errorType || 'unknown'
        });
      }
    });
  }

  public async getUserAccounts(req: AuthenticatedRequest, res: Response): Promise<void> {
    const userId = req.user?.userId;

    if (!userId) {
      res.status(401).json({
        success: false,
        error: 'User authentication required'
      });
      return;
    }

    const result = await this.getUserAccountsUseCase.execute({
      userId,
    });

    exhaustive(String(result.success), {
      'true': () => {
        res.status(200).json({
          success: true,
          message: result.message,
          accounts: result.accounts
        });
      },
      'false': () => {
        // Determine HTTP status code based on error type
        const statusCode = exhaustive(String(result.errorType), {
          'validation': () => 400,
          'not_found': () => 404,
          'server': () => 500,
          'undefined': () => 400
        });

        res.status(statusCode).json({
          success: false,
          error: result.error,
          type: result.errorType || 'unknown'
        });
      }
    });
  }
}
