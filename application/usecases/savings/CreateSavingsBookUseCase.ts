import { SavingsBook, SavingsBookType } from '@lehman-brothers/domain';
import { SavingsBookRepository } from '../../repositories/SavingsBookRepository';
import { UserRepository } from '../../repositories/UserRepository';

export interface CreateSavingsBookInput {
    userId: string;
    name: string;
    type: SavingsBookType;
    initialBalance?: number;
}

export interface CreateSavingsBookOutput {
    success: boolean;
    message?: string;
    savingsBookId?: string;
    iban?: string;
    error?: string;
    errorType?: 'validation' | 'not_found' | 'server';
}

export class CreateSavingsBookUseCase {
    constructor(
        private readonly savingsBookRepository: SavingsBookRepository,
        private readonly userRepository: UserRepository
    ) { }

    async execute(input: CreateSavingsBookInput): Promise<CreateSavingsBookOutput> {
        try {
            // Verify user exists
            const user = await this.userRepository.findById(input.userId);
            if (!user) {
                return {
                    success: false,
                    error: 'User not found',
                    errorType: 'not_found',
                };
            }

            // Validate name
            if (!input.name || input.name.trim().length === 0) {
                return {
                    success: false,
                    error: 'Savings book name is required',
                    errorType: 'validation',
                };
            }

            // Create savings book
            const result = SavingsBook.create({
                userId: input.userId,
                name: input.name.trim(),
                type: input.type,
                ...(input.initialBalance !== undefined && { initialBalance: input.initialBalance }),
            });

            if (result.isFailure()) {
                return {
                    success: false,
                    error: result.getError().message,
                    errorType: 'validation',
                };
            }

            const savingsBook = result.getValue();
            await this.savingsBookRepository.save(savingsBook);

            return {
                success: true,
                message: 'Savings book created successfully',
                savingsBookId: savingsBook.getId(),
                iban: savingsBook.getIban().getValue(),
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
