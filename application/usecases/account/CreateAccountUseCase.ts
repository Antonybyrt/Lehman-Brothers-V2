import { Account } from '@lehman-brothers/domain';
import { AccountRepository, UserRepository } from '../../repositories';
import { exhaustive } from 'exhaustive';
import { 
  UserNotFoundError, 
  ValidationError, 
  InvalidAccountNameError,
  IbanAlreadyExistsError,
  InvalidInitialBalanceError
} from '@lehman-brothers/domain';

export interface CreateAccountRequest {
  readonly userId: string;
  readonly name: string;
  readonly isSavings?: boolean;
  readonly initialBalance?: number;
}

export interface CreateAccountResponse {
  readonly success: boolean;
  readonly accountId?: string;
  readonly iban?: string;
  readonly message?: string;
  readonly error?: string;
  readonly errorType?: 'validation' | 'not_found' | 'server';
}

export class CreateAccountUseCase {
  constructor(
    private readonly accountRepository: AccountRepository,
    private readonly userRepository: UserRepository
  ) {}

  public async execute(request: CreateAccountRequest): Promise<CreateAccountResponse> {
    // Early return pattern - validate required fields
    if (!this.isValidRequest(request)) {
      return { 
        success: false, 
        error: 'User ID and account name are required', 
        errorType: 'validation' 
      };
    }

    // Validate account name
    if (!request.name || request.name.trim().length === 0) {
      const error = new InvalidAccountNameError(request.name);
      return { 
        success: false, 
        error: error.message, 
        errorType: 'validation' 
      };
    }

    // Validate initial balance
    if (request.initialBalance !== undefined && request.initialBalance < 0) {
      const error = new InvalidInitialBalanceError(request.initialBalance);
      return { 
        success: false, 
        error: error.message, 
        errorType: 'validation' 
      };
    }

    try {
      // Check if user exists
      const user = await this.userRepository.findById(request.userId);
      if (!user) {
        throw new UserNotFoundError(request.userId);
      }

      // Check if user is active
      if (!user.isActive()) {
        throw new ValidationError('user', 'User account is deactivated');
      }

      // Create new account with unique IBAN
      let accountResult: any;
      let attempts = 0;
      const maxAttempts = 10;

      do {
        accountResult = Account.create({
          userId: request.userId,
          name: request.name,
          isSavings: request.isSavings || false,
          initialBalance: request.initialBalance || 0,
        });

        if (accountResult.isSuccess()) {
          const account = accountResult.getValue();
          
          // Check if IBAN already exists
          const existingAccount = await this.accountRepository.findByIban(account.getIban().getValue());
          if (!existingAccount) {
            // Save the account
            await this.accountRepository.save(account);
            
            return {
              success: true,
              accountId: account.getId(),
              iban: account.getIban().getFormattedValue(),
              message: 'Account created successfully'
            };
          } else {
            // IBAN collision - this should be very rare
            throw new IbanAlreadyExistsError(account.getIban().getValue());
          }
        }

        attempts++;
      } while (attempts < maxAttempts && accountResult.isFailure());

      if (attempts >= maxAttempts) {
        throw new Error('Failed to generate unique IBAN after multiple attempts');
      }

      return {
        success: false,
        error: accountResult.getError().message,
        errorType: 'server'
      };

    } catch (error) {
      if (error instanceof UserNotFoundError) {
        return { 
          success: false, 
          error: error.message, 
          errorType: 'not_found' 
        };
      }
      if (error instanceof ValidationError) {
        return { 
          success: false, 
          error: error.message, 
          errorType: 'validation' 
        };
      }
      if (error instanceof InvalidAccountNameError) {
        return { 
          success: false, 
          error: error.message, 
          errorType: 'validation' 
        };
      }
      if (error instanceof InvalidInitialBalanceError) {
        return { 
          success: false, 
          error: error.message, 
          errorType: 'validation' 
        };
      }
      if (error instanceof IbanAlreadyExistsError) {
        return { 
          success: false, 
          error: error.message, 
          errorType: 'server' 
        };
      }
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error occurred',
        errorType: 'server'
      };
    }
  }

  private isValidRequest(request: CreateAccountRequest): boolean {
    const hasRequiredFields = request.userId && request.name;
    const isValidName = request.name && request.name.trim().length > 0;
    const isValidBalance = request.initialBalance === undefined || request.initialBalance >= 0;

    return exhaustive(String(hasRequiredFields && isValidName && isValidBalance), {
      'true': () => true,
      'false': () => false
    });
  }
}
