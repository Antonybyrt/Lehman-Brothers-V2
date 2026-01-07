import { SavingsBookRepository } from '../../repositories/SavingsBookRepository';

export interface GetUserSavingsBooksInput {
    userId: string;
}

export interface SavingsBookDTO {
    id: string;
    iban: string;
    name: string;
    balance: number;
    type: string;
    typeDisplayName: string;
    createdAt: string;
}

export interface GetUserSavingsBooksOutput {
    success: boolean;
    message?: string;
    savingsBooks?: SavingsBookDTO[];
    error?: string;
    errorType?: 'validation' | 'not_found' | 'server';
}

export class GetUserSavingsBooksUseCase {
    constructor(private readonly savingsBookRepository: SavingsBookRepository) { }

    async execute(input: GetUserSavingsBooksInput): Promise<GetUserSavingsBooksOutput> {
        try {
            const savingsBooks = await this.savingsBookRepository.findByUserId(input.userId);

            return {
                success: true,
                message: 'Savings books retrieved successfully',
                savingsBooks: savingsBooks.map((book) => ({
                    id: book.getId(),
                    iban: book.getIban().getValue(),
                    name: book.getName(),
                    balance: book.getBalance(),
                    type: book.getType().getValue(),
                    typeDisplayName: book.getType().getDisplayName(),
                    createdAt: book.getCreatedAt().toISOString(),
                })),
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
