import { EmailConfirmation } from '@lehman-brothers/domain';

export interface EmailConfirmationRepository {
  save(emailConfirmation: EmailConfirmation): Promise<void>;
  findByToken(token: string): Promise<EmailConfirmation | null>;
  findByUserId(userId: string): Promise<EmailConfirmation | null>;
  delete(id: string): Promise<void>;
}
