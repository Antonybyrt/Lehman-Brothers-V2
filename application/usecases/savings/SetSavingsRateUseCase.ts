import { SavingsBookType } from '@lehman-brothers/domain';
import { SavingsRateRepository, SavingsRate } from '../../repositories/SavingsRateRepository';
import { SavingsBookRepository } from '../../repositories/SavingsBookRepository';
import { UserRepository } from '../../repositories/UserRepository';
import { SavingsNotificationService, SavingsRateChangedPayload } from '../../services/SavingsNotificationService';

export interface SetSavingsRateInput {
    bookType: SavingsBookType;
    rate: number; // Annual rate as decimal (e.g., 0.03 for 3%)
    updatedBy: string; // Director user ID
}

export interface SetSavingsRateOutput {
    success: boolean;
    message?: string;
    rateId?: string;
    error?: string;
    errorType?: 'validation' | 'unauthorized' | 'server';
}

export class SetSavingsRateUseCase {
    constructor(
        private readonly savingsRateRepository: SavingsRateRepository,
        private readonly savingsBookRepository: SavingsBookRepository,
        private readonly userRepository: UserRepository,
        private readonly notificationService: SavingsNotificationService
    ) { }

    async execute(input: SetSavingsRateInput): Promise<SetSavingsRateOutput> {
        try {
            // Verify the user is a director
            const user = await this.userRepository.findById(input.updatedBy);
            if (!user) {
                return {
                    success: false,
                    error: 'User not found',
                    errorType: 'unauthorized',
                };
            }

            if (!user.canAccessDirectorFeatures()) {
                return {
                    success: false,
                    error: 'Only directors can set savings rates',
                    errorType: 'unauthorized',
                };
            }

            // Validate rate
            if (input.rate < 0 || input.rate > 1) {
                return {
                    success: false,
                    error: 'Rate must be between 0 and 1 (0% to 100%)',
                    errorType: 'validation',
                };
            }

            // Get current rate for comparison
            const currentRate = await this.savingsRateRepository.getCurrentRate(input.bookType);
            const oldRate = currentRate?.rate ?? 0;

            // Create new rate
            const newRate: SavingsRate = {
                id: crypto.randomUUID(),
                rate: input.rate,
                bookType: input.bookType,
                effectiveDate: new Date(),
                updatedBy: input.updatedBy,
                createdAt: new Date(),
            };

            await this.savingsRateRepository.save(newRate);

            // Notify all holders of this savings book type
            const payload: SavingsRateChangedPayload = {
                bookType: input.bookType,
                oldRate,
                newRate: input.rate,
                effectiveDate: newRate.effectiveDate.toISOString(),
            };

            await this.notificationService.notifySavingsBookHolders(input.bookType, payload);

            return {
                success: true,
                message: `Savings rate for ${input.bookType} updated to ${(input.rate * 100).toFixed(2)}%`,
                rateId: newRate.id,
            };
        } catch (error) {
            return {
                success: false,
                error: (error as Error).message,
                errorType: 'server',
            };
        }
    }
}
