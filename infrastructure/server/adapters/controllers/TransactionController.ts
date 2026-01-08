import { Response } from 'express';
import { GetUserTransactionsUseCase } from '@lehman-brothers/application';
import { exhaustive } from 'exhaustive';
import { AuthenticatedRequest } from '../../middleware/authMiddleware';

export class TransactionController {
    constructor(
        private readonly getUserTransactionsUseCase: GetUserTransactionsUseCase
    ) { }

    public async getUserTransactions(req: AuthenticatedRequest, res: Response): Promise<void> {
        const userId = req.user?.userId;
        const limit = req.query.limit ? parseInt(req.query.limit as string, 10) : undefined;

        if (!userId) {
            res.status(401).json({
                success: false,
                error: 'User authentication required'
            });
            return;
        }

        const result = await this.getUserTransactionsUseCase.execute({
            userId,
            ...(limit !== undefined && { limit })
        });

        exhaustive(String(result.success), {
            'true': () => {
                res.status(200).json({
                    success: true,
                    transactions: result.transactions
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
}
