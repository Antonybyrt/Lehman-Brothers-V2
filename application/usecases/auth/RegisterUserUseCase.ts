import { User, Result, EmailConfirmation } from '@lehman-brothers/domain';
import { UserRepository } from '../../repositories';
import { EmailConfirmationRepository } from '../../repositories';
import { EmailService } from '../../services';
import { exhaustive } from 'exhaustive';
import { UserAlreadyExistsError, ValidationError } from '@lehman-brothers/domain';

export interface RegisterUserRequest {
  readonly firstName: string;
  readonly lastName: string;
  readonly email: string;
  readonly password: string;
  readonly role: string;
}

export interface RegisterUserResponse {
  readonly success: boolean;
  readonly userId?: string;
  readonly message?: string;
  readonly error?: string;
  readonly errorType?: 'validation' | 'conflict' | 'server';
}

export class RegisterUserUseCase {
  constructor(
    private readonly userRepository: UserRepository,
    private readonly emailConfirmationRepository: EmailConfirmationRepository,
    private readonly emailService: EmailService
  ) {}

  public async execute(request: RegisterUserRequest): Promise<RegisterUserResponse> {
    // Early return pattern - validate required fields
    if (!this.isValidRequest(request)) {
      return { success: false, error: 'All fields are required', errorType: 'validation' };
    }

    try {
      // Check if user already exists
      const existingUser = await this.userRepository.findByEmail(request.email);
      if (existingUser) {
        throw new UserAlreadyExistsError(request.email);
      }

      // Create new user
      const userResult = await User.create({
        firstName: request.firstName,
        lastName: request.lastName,
        email: request.email,
        password: request.password,
        role: request.role,
      });

      if (userResult.isSuccess()) {
        const user = userResult.getValue();
        await this.userRepository.save(user);

        // Create email confirmation
        const emailConfirmation = EmailConfirmation.create(user.getId());
        await this.emailConfirmationRepository.save(emailConfirmation);

        // Send confirmation email
        await this.emailService.sendConfirmationEmail(
          user.getEmail().getValue(),
          emailConfirmation.getToken()
        );

        return { 
          success: true, 
          userId: user.getId(),
          message: 'User registered successfully. Please check your email to confirm your account.'
        };
      } else {
        const error = userResult.getError();
        return { success: false, error: error.message, errorType: 'validation' };
      }
    } catch (error) {
      if (error instanceof UserAlreadyExistsError) {
        return { success: false, error: error.message, errorType: 'conflict' };
      }
      if (error instanceof ValidationError) {
        return { success: false, error: error.message, errorType: 'validation' };
      }
      return { 
        success: false, 
        error: error instanceof Error ? error.message : 'Unknown error occurred',
        errorType: 'server'
      };
    }
  }

  private isValidRequest(request: RegisterUserRequest): boolean {
    const hasEmptyFields = !request.firstName || !request.lastName || !request.email || !request.password;
    return exhaustive(String(hasEmptyFields), {
      'true': () => false,
      'false': () => true
    });
  }
}
