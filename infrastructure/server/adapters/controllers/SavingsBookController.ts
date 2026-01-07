import { Response } from 'express';
import {
    CreateSavingsBookUseCase,
    GetUserSavingsBooksUseCase,
    DepositToSavingsBookUseCase,
    WithdrawFromSavingsBookUseCase,
    GetCurrentRatesUseCase
} from '@lehman-brothers/application';
import { SavingsBookType } from '@lehman-brothers/domain';
import { exhaustive } from 'exhaustive';
import { AuthenticatedRequest } from '../../middleware/authMiddleware';

export class SavingsBookController {
    constructor(
        private readonly createSavingsBookUseCase: CreateSavingsBookUseCase,
        private readonly getUserSavingsBooksUseCase: GetUserSavingsBooksUseCase,
        private readonly depositToSavingsBookUseCase: DepositToSavingsBookUseCase,
        private readonly withdrawFromSavingsBookUseCase: WithdrawFromSavingsBookUseCase,
        private readonly getCurrentRatesUseCase: GetCurrentRatesUseCase
    ) { }

    public async createSavingsBook(req: AuthenticatedRequest, res: Response): Promise<void> {
        const { name, type } = req.body;
        const userId = req.user?.userId;

        if (!userId) {
            res.status(401).json({
                success: false,
                error: 'User authentication required'
            });
            return;
        }

        // Validate type
        if (!type || !Object.values(SavingsBookType).includes(type)) {
            res.status(400).json({
                success: false,
                error: `Invalid savings book type. Valid types: ${Object.values(SavingsBookType).join(', ')}`
            });
            return;
        }

        const result = await this.createSavingsBookUseCase.execute({
            userId,
            name,
            type: type as SavingsBookType,
        });

        exhaustive(String(result.success), {
            'true': () => {
                res.status(201).json({
                    success: true,
                    message: result.message,
                    savingsBookId: result.savingsBookId,
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

    public async getUserSavingsBooks(req: AuthenticatedRequest, res: Response): Promise<void> {
        const userId = req.user?.userId;

        if (!userId) {
            res.status(401).json({
                success: false,
                error: 'User authentication required'
            });
            return;
        }

        const result = await this.getUserSavingsBooksUseCase.execute({ userId });

        exhaustive(String(result.success), {
            'true': () => {
                res.status(200).json({
                    success: true,
                    message: result.message,
                    savingsBooks: result.savingsBooks
                });
            },
            'false': () => {
                res.status(500).json({
                    success: false,
                    error: result.error
                });
            }
        });
    }

    public async deposit(req: AuthenticatedRequest, res: Response): Promise<void> {
        const { id } = req.params;
        const { sourceAccountId, amount } = req.body;
        const userId = req.user?.userId;

        if (!userId) {
            res.status(401).json({
                success: false,
                error: 'User authentication required'
            });
            return;
        }

        const result = await this.depositToSavingsBookUseCase.execute({
            userId,
            savingsBookId: id!,
            sourceAccountId,
            amount: Number(amount),
        });

        exhaustive(String(result.success), {
            'true': () => {
                res.status(200).json({
                    success: true,
                    message: result.message,
                    newBalance: result.newBalance
                });
            },
            'false': () => {
                const statusCode = exhaustive(String(result.errorType), {
                    'validation': () => 400,
                    'not_found': () => 404,
                    'unauthorized': () => 403,
                    'insufficient_funds': () => 400,
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

    public async withdraw(req: AuthenticatedRequest, res: Response): Promise<void> {
        const { id } = req.params;
        const { targetAccountId, amount } = req.body;
        const userId = req.user?.userId;

        if (!userId) {
            res.status(401).json({
                success: false,
                error: 'User authentication required'
            });
            return;
        }

        const result = await this.withdrawFromSavingsBookUseCase.execute({
            userId,
            savingsBookId: id!,
            targetAccountId,
            amount: Number(amount),
        });

        exhaustive(String(result.success), {
            'true': () => {
                res.status(200).json({
                    success: true,
                    message: result.message,
                    newBalance: result.newBalance
                });
            },
            'false': () => {
                const statusCode = exhaustive(String(result.errorType), {
                    'validation': () => 400,
                    'not_found': () => 404,
                    'unauthorized': () => 403,
                    'insufficient_funds': () => 400,
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

    public async getCurrentRates(req: AuthenticatedRequest, res: Response): Promise<void> {
        const result = await this.getCurrentRatesUseCase.execute();

        exhaustive(String(result.success), {
            'true': () => {
                res.status(200).json({
                    success: true,
                    rates: result.rates
                });
            },
            'false': () => {
                res.status(500).json({
                    success: false,
                    error: result.error
                });
            }
        });
    }
}
