import { InvalidIbanError } from '../errors';

export class Iban {
  private readonly value: string;

  private constructor(iban: string) {
    this.value = iban;
  }

  public static create(iban: string): Iban {
    if (!this.isValid(iban)) {
      throw new InvalidIbanError(iban);
    }
    return new Iban(iban.toUpperCase().replace(/\s/g, ''));
  }

  public static generate(): Iban {
    const countryCode = 'FR';
    const bankCode = this.generateRandomString(5, '0123456789');
    const branchCode = this.generateRandomString(5, '0123456789');
    const accountNumber = this.generateRandomString(11, '0123456789');
    const nationalCheckDigit = this.generateRandomString(2, '0123456789');
    
    const bban = bankCode + branchCode + accountNumber + nationalCheckDigit;
    const checkDigits = this.calculateCheckDigits(countryCode, bban);
    
    const iban = countryCode + checkDigits + bban;
    return new Iban(iban);
  }

  private static generateRandomString(length: number, chars: string): string {
    let result = '';
    for (let i = 0; i < length; i++) {
      result += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return result;
  }

  private static calculateCheckDigits(countryCode: string, bban: string): string {
    // Algorithme de calcul des chiffres de contrôle IBAN
    const rearranged = bban + countryCode + '00';
    const numericString = this.convertToNumeric(rearranged);
    
    // Calcul du modulo 97
    let remainder = 0;
    for (let i = 0; i < numericString.length; i++) {
      remainder = (remainder * 10 + parseInt(numericString[i]!)) % 97;
    }
    
    const checkDigits = (98 - remainder).toString().padStart(2, '0');
    return checkDigits;
  }

  private static convertToNumeric(str: string): string {
    let result = '';
    for (let i = 0; i < str.length; i++) {
      const char = str[i];
      if (char && char >= '0' && char <= '9') {
        result += char;
      } else if (char && char >= 'A' && char <= 'Z') {
        result += (char.charCodeAt(0) - 55).toString();
      }
    }
    return result;
  }

  private static isValid(iban: string): boolean {
    const ibanRegex = /^[A-Z]{2}[0-9]{2}[A-Z0-9]{4,30}$/;
    
    if (!ibanRegex.test(iban)) {
      return false;
    }

    const countryCode = iban.substring(0, 2);
    const checkDigits = iban.substring(2, 4);
    const bban = iban.substring(4);
    
    const rearranged = bban + countryCode + checkDigits;
    const numericString = this.convertToNumeric(rearranged);
    
    let remainder = 0;
    for (let i = 0; i < numericString.length; i++) {
      remainder = (remainder * 10 + parseInt(numericString[i]!)) % 97;
    }
    
    return remainder === 1;
  }

  public getValue(): string {
    return this.value;
  }

  public getFormattedValue(): string {
    return this.value.replace(/(.{4})/g, '$1 ').trim();
  }

  public equals(other: Iban): boolean {
    return this.value === other.value;
  }
}
