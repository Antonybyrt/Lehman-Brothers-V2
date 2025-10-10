import { Account } from '../../domain/entities/Account';

export interface AccountRepository {
  save(account: Account): Promise<void>;
  findById(id: string): Promise<Account | null>;
  findByIban(iban: string): Promise<Account | null>;
  findByUserId(userId: string): Promise<Account[]>;
  delete(id: string): Promise<void>;
  existsByIban(iban: string): Promise<boolean>;
}
