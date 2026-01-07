import { SavingsBookType } from '../values/SavingsBookType';

export class InvalidSavingsBookTypeError extends Error {
    constructor(type: string) {
        const validTypes = Object.values(SavingsBookType).join(', ');
        super(`Invalid savings book type: ${type}. Valid types are: ${validTypes}`);
        this.name = 'InvalidSavingsBookTypeError';
    }
}
