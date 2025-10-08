import { exhaustive } from 'exhaustive';
import bcrypt from 'bcryptjs';

export class Password {
  private readonly hashedValue: string;

  private constructor(hashedValue: string) {
    this.hashedValue = hashedValue;
  }

  public static async create(plainPassword: string): Promise<Password> {
    if (!this.isValid(plainPassword)) {
      throw new Error('Password must be at least 8 characters long');
    }
    const hashedValue = await this.hashPassword(plainPassword);
    return new Password(hashedValue);
  }

  public static fromHash(hashedValue: string): Password {
    return new Password(hashedValue);
  }

  private static isValid(password: string): boolean {
    return password.length >= 8;
  }

  private static async hashPassword(password: string): Promise<string> {
    const saltRounds = 12;
    return await bcrypt.hash(password, saltRounds);
  }

  public getHashedValue(): string {
    return this.hashedValue;
  }

  public async verify(plainPassword: string): Promise<boolean> {
    return await bcrypt.compare(plainPassword, this.hashedValue);
  }

  public toString(): string {
    return '[Password]';
  }
}
