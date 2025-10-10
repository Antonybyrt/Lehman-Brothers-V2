import { Request, Response } from 'express';
import { CreateAccountUseCase, GetUserAccountsUseCase, GetAccountByIdUseCase, UpdateAccountUseCase, DeleteAccountUseCase } from '@lehman-brothers/application';
import { exhaustive } from 'exhaustive';
import { AuthenticatedRequest } from '../../middleware/authMiddleware';

export class AccountController {
  constructor(
    private readonly createAccountUseCase: CreateAccountUseCase,
    private readonly getUserAccountsUseCase: GetUserAccountsUseCase,
    private readonly getAccountByIdUseCase: GetAccountByIdUseCase,
    private readonly updateAccountUseCase: UpdateAccountUseCase,
    private readonly deleteAccountUseCase: DeleteAccountUseCase
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

  public async getAccountById(req: AuthenticatedRequest, res: Response): Promise<void> {
    const { id } = req.params;
    const userId = req.user?.userId;

    if (!userId) {
      res.status(401).json({
        success: false,
        error: 'User authentication required'
      });
      return;
    }

    const result = await this.getAccountByIdUseCase.execute({
      accountId: id!,
      userId,
    });

    exhaustive(String(result.success), {
      'true': () => {
        res.status(200).json({
          success: true,
          account: result.account
        });
      },
      'false': () => {
        const statusCode = exhaustive(String(result.errorType), {
          'validation': () => 400,
          'not_found': () => 404,
          'unauthorized': () => 403,
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

  public async updateAccount(req: AuthenticatedRequest, res: Response): Promise<void> {
    const { id } = req.params;
    const { name, balance } = req.body;
    const userId = req.user?.userId;

    if (!userId) {
      res.status(401).json({
        success: false,
        error: 'User authentication required'
      });
      return;
    }

    const result = await this.updateAccountUseCase.execute({
      accountId: id!,
      userId,
      name,
      balance,
    });

    exhaustive(String(result.success), {
      'true': () => {
        res.status(200).json({
          success: true,
          account: result.account
        });
      },
      'false': () => {
        const statusCode = exhaustive(String(result.errorType), {
          'validation': () => 400,
          'not_found': () => 404,
          'unauthorized': () => 403,
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

  public async deleteAccount(req: AuthenticatedRequest, res: Response): Promise<void> {
    const { id } = req.params;
    const userId = req.user?.userId;

    if (!userId) {
      res.status(401).json({
        success: false,
        error: 'User authentication required'
      });
      return;
    }

    const result = await this.deleteAccountUseCase.execute({
      accountId: id!,
      userId,
    });

    exhaustive(String(result.success), {
      'true': () => {
        res.status(200).json({
          success: true,
          message: result.message
        });
      },
      'false': () => {
        // Determine HTTP status code based on error type
        const statusCode = exhaustive(String(result.errorType), {
          'validation': () => 400,
          'not_found': () => 404,
          'unauthorized': () => 403,
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
