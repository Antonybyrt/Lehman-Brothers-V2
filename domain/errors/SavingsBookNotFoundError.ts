export class SavingsBookNotFoundError extends Error {
    constructor(id: string) {
        super(`Savings book with ID ${id} not found`);
        this.name = 'SavingsBookNotFoundError';
    }
}
