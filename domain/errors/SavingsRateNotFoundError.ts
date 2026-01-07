import { SavingsBookType } from '../values/SavingsBookType';

export class SavingsRateNotFoundError extends Error {
    constructor(type?: SavingsBookType) {
        const message = type
            ? `No savings rate found for ${type}`
            : 'No savings rate found';
        super(message);
        this.name = 'SavingsRateNotFoundError';
    }
}
