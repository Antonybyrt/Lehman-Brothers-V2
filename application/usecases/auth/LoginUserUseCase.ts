import { User, Result } from '@lehman-brothers/domain';
import { UserRepository } from '../../repositories';
import { AuthenticationService } from '../../services';
import { exhaustive } from 'exhaustive';
import { UserNotFoundError, UserDeactivatedError, InvalidCredentialsError, ValidationError } from '@lehman-brothers/domain';

export interface LoginUserRequest {
  readonly email: string;
  readonly password: string;
}

export interface LoginUserResponse {
  readonly success: boolean;
  readonly token?: string;
  readonly user?: {
    readonly id: string;
    readonly firstName: string;
    readonly lastName: string;
    readonly role: string;
  };
  readonly error?: string;
}

export class LoginUserUseCase {
  constructor(
    private readonly userRepository: UserRepository,
    private readonly authenticationService: AuthenticationService
  ) {}

  public async execute(request: LoginUserRequest): Promise<LoginUserResponse> {
    // Early return pattern - validate required fields
    if (!this.isValidRequest(request)) {
      return { success: false, error: 'Email and password are required' };
    }

    try {
      const user = await this.userRepository.findByEmail(request.email);

      if (!user) {
        throw new UserNotFoundError(request.email);
      }

      if (!user.isActive()) {
        throw new UserDeactivatedError(request.email);
      }

      if (!(await user.verifyPassword(request.password))) {
        throw new InvalidCredentialsError();
      }

      const token = this.authenticationService.generateToken(
        user.getId(),
        user.getRole().getValue()
      );

      return {
        success: true,
        token,
        user: {
          id: user.getId(),
          firstName: user.getFirstName(),
          lastName: user.getLastName(),
          role: user.getRole().getValue(),
        },
      };
    } catch (error) {
      if (error instanceof UserNotFoundError || 
          error instanceof UserDeactivatedError || 
          error instanceof InvalidCredentialsError ||
          error instanceof ValidationError) {
        return { success: false, error: error.message };
      }
      return { 
        success: false, 
        error: error instanceof Error ? error.message : 'Unknown error occurred' 
      };
    }
  }

  private isValidRequest(request: LoginUserRequest): boolean {
    const hasEmptyFields = !request.email || !request.password;
    return exhaustive(String(hasEmptyFields), {
      'true': () => false,
      'false': () => true
    });
  }
}
