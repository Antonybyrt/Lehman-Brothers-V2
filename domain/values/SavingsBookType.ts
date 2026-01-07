export enum SavingsBookType {
    LIVRET_A = 'LIVRET_A',
    LDD = 'LDD'
}

export class SavingsBookTypeValue {
    private readonly value: SavingsBookType;

    private constructor(value: SavingsBookType) {
        this.value = value;
    }

    public static create(type: string): SavingsBookTypeValue {
        const validTypes = Object.values(SavingsBookType);
        if (!validTypes.includes(type as SavingsBookType)) {
            throw new Error(`Invalid savings book type: ${type}. Valid types are: ${validTypes.join(', ')}`);
        }
        return new SavingsBookTypeValue(type as SavingsBookType);
    }

    public static fromEnum(type: SavingsBookType): SavingsBookTypeValue {
        return new SavingsBookTypeValue(type);
    }

    public getValue(): SavingsBookType {
        return this.value;
    }

    public isLivretA(): boolean {
        return this.value === SavingsBookType.LIVRET_A;
    }

    public isLDD(): boolean {
        return this.value === SavingsBookType.LDD;
    }

    public equals(other: SavingsBookTypeValue): boolean {
        return this.value === other.value;
    }

    public toString(): string {
        return this.value;
    }

    public getDisplayName(): string {
        switch (this.value) {
            case SavingsBookType.LIVRET_A:
                return 'Livret A';
            case SavingsBookType.LDD:
                return 'Livret Développement Durable';
        }
    }
}
