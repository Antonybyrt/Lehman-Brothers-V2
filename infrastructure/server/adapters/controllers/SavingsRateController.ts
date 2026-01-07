import { Response } from 'express';
import {
    SetSavingsRateUseCase,
    ApplyDailyInterestUseCase,
    GetCurrentRatesUseCase
} from '@lehman-brothers/application';
import { SavingsBookType } from '@lehman-brothers/domain';
import { exhaustive } from 'exhaustive';
import { AuthenticatedRequest } from '../../middleware/authMiddleware';

export class SavingsRateController {
    constructor(
        private readonly setSavingsRateUseCase: SetSavingsRateUseCase,
        private readonly applyDailyInterestUseCase: ApplyDailyInterestUseCase,
        private readonly getCurrentRatesUseCase: GetCurrentRatesUseCase
    ) { }

    public async setRate(req: AuthenticatedRequest, res: Response): Promise<void> {
        const { bookType, rate } = req.body;
        const userId = req.user?.userId;

        if (!userId) {
            res.status(401).json({
                success: false,
                error: 'User authentication required'
            });
            return;
        }

        // Validate book type
        if (!bookType || !Object.values(SavingsBookType).includes(bookType)) {
            res.status(400).json({
                success: false,
                error: `Invalid savings book type. Valid types: ${Object.values(SavingsBookType).join(', ')}`
            });
            return;
        }

        // Validate rate
        if (typeof rate !== 'number' || rate < 0 || rate > 1) {
            res.status(400).json({
                success: false,
                error: 'Rate must be a number between 0 and 1 (representing 0% to 100%)'
            });
            return;
        }

        const result = await this.setSavingsRateUseCase.execute({
            bookType: bookType as SavingsBookType,
            rate,
            updatedBy: userId,
        });

        exhaustive(String(result.success), {
            'true': () => {
                res.status(200).json({
                    success: true,
                    message: result.message,
                    rateId: result.rateId
                });
            },
            'false': () => {
                const statusCode = exhaustive(String(result.errorType), {
                    'validation': () => 400,
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

    public async applyDailyInterest(req: AuthenticatedRequest, res: Response): Promise<void> {
        const userId = req.user?.userId;

        if (!userId) {
            res.status(401).json({
                success: false,
                error: 'User authentication required'
            });
            return;
        }

        const result = await this.applyDailyInterestUseCase.execute({
            executedBy: userId,
        });

        exhaustive(String(result.success), {
            'true': () => {
                res.status(200).json({
                    success: true,
                    message: result.message,
                    processedBooks: result.processedBooks,
                    totalInterestApplied: result.totalInterestApplied
                });
            },
            'false': () => {
                const statusCode = exhaustive(String(result.errorType), {
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

    public async getRates(req: AuthenticatedRequest, res: Response): Promise<void> {
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
