import { User, Result } from '@lehman-brothers/domain';
import { UserRepository } from '../../repositories';
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
  readonly error?: string;
}

export class RegisterUserUseCase {
  constructor(private readonly userRepository: UserRepository) {}

  public async execute(request: RegisterUserRequest): Promise<RegisterUserResponse> {
    // Early return pattern - validate required fields
    if (!this.isValidRequest(request)) {
      return { success: false, error: 'All fields are required' };
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
        return { success: true, userId: user.getId() };
      } else {
        const error = userResult.getError();
        return { success: false, error: error.message };
      }
    } catch (error) {
      if (error instanceof UserAlreadyExistsError || error instanceof ValidationError) {
        return { success: false, error: error.message };
      }
      return { 
        success: false, 
        error: error instanceof Error ? error.message : 'Unknown error occurred' 
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
