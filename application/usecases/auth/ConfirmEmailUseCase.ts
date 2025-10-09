import { EmailConfirmation, User } from '@lehman-brothers/domain';
import { EmailConfirmationRepository } from '../../repositories';
import { UserRepository } from '../../repositories';
import { InvalidCredentialsError, UserNotFoundError } from '@lehman-brothers/domain';

export interface ConfirmEmailResponse {
  readonly success: boolean;
  readonly error?: string;
}

export class ConfirmEmailUseCase {
  constructor(
    private readonly emailConfirmationRepository: EmailConfirmationRepository,
    private readonly userRepository: UserRepository
  ) {}

  public async execute(token: string): Promise<ConfirmEmailResponse> {
    try {
      const emailConfirmation = await this.emailConfirmationRepository.findByToken(token);
      
      if (!emailConfirmation) {
        throw new InvalidCredentialsError();
      }

      if (emailConfirmation.isExpired()) {
        return { success: false, error: 'Confirmation token has expired' };
      }

      const user = await this.userRepository.findById(emailConfirmation.getUserId());
      if (!user) {
        throw new UserNotFoundError(emailConfirmation.getUserId());
      }

      if (user.isEmailConfirmed()) {
        return { success: false, error: 'Email already confirmed' };
      }

      const confirmedUser = user.confirmEmail();
      await this.userRepository.save(confirmedUser);
      await this.emailConfirmationRepository.delete(emailConfirmation.getId());

      return { success: true };
    } catch (error) {
      if (error instanceof InvalidCredentialsError || error instanceof UserNotFoundError) {
        return { success: false, error: error.message };
      }
      return { 
        success: false, 
        error: error instanceof Error ? error.message : 'Unknown error occurred' 
      };
    }
  }
}
