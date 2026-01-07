import { SavingsBookType, DailyInterest } from '@lehman-brothers/domain';
import { SavingsBookRepository } from '../../repositories/SavingsBookRepository';
import { SavingsRateRepository } from '../../repositories/SavingsRateRepository';
import { DailyInterestRepository } from '../../repositories/DailyInterestRepository';
import { UserRepository } from '../../repositories/UserRepository';

export interface ApplyDailyInterestInput {
    executedBy: string; // Director user ID or system
}

export interface ApplyDailyInterestOutput {
    success: boolean;
    message?: string;
    processedBooks?: number;
    totalInterestApplied?: number;
    error?: string;
    errorType?: 'unauthorized' | 'server';
}

export class ApplyDailyInterestUseCase {
    constructor(
        private readonly savingsBookRepository: SavingsBookRepository,
        private readonly savingsRateRepository: SavingsRateRepository,
        private readonly dailyInterestRepository: DailyInterestRepository,
        private readonly userRepository: UserRepository
    ) { }

    async execute(input: ApplyDailyInterestInput): Promise<ApplyDailyInterestOutput> {
        try {
            // Verify the user is a director (unless system call)
            if (input.executedBy !== 'SYSTEM') {
                const user = await this.userRepository.findById(input.executedBy);
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
                        error: 'Only directors can apply daily interest',
                        errorType: 'unauthorized',
                    };
                }
            }

            // Get all savings books with positive balance
            const savingsBooks = await this.savingsBookRepository.findAllWithPositiveBalance();

            if (savingsBooks.length === 0) {
                return {
                    success: true,
                    message: 'No savings books with positive balance found',
                    processedBooks: 0,
                    totalInterestApplied: 0,
                };
            }

            // Get current rates for each book type
            const rates = await this.savingsRateRepository.getAllCurrentRates();
            const rateMap = new Map(rates.map((r) => [r.bookType, r.rate / 365])); // Convert to daily rate

            let totalInterest = 0;
            const interestRecords: DailyInterest[] = [];

            for (const book of savingsBooks) {
                const dailyRate = rateMap.get(book.getType().getValue() as SavingsBookType);

                if (dailyRate === undefined || dailyRate <= 0) {
                    continue; // Skip if no rate defined for this type
                }

                const result = book.applyInterest(dailyRate);

                if (result.isSuccess()) {
                    const { book: updatedBook, interestAmount } = result.getValue();

                    if (interestAmount > 0) {
                        await this.savingsBookRepository.save(updatedBook);
                        totalInterest += interestAmount;

                        // Create interest record
                        const interestResult = DailyInterest.create({
                            savingsBookId: book.getId(),
                            amount: interestAmount,
                            rate: dailyRate,
                        });

                        if (interestResult.isSuccess()) {
                            interestRecords.push(interestResult.getValue());
                        }
                    }
                }
            }

            // Save all interest records
            if (interestRecords.length > 0) {
                await this.dailyInterestRepository.saveMany(interestRecords);
            }

            return {
                success: true,
                message: `Daily interest applied successfully`,
                processedBooks: interestRecords.length,
                totalInterestApplied: Math.round(totalInterest * 10000) / 10000,
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
