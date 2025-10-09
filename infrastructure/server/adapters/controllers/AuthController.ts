import { Request, Response } from 'express';
import { RegisterUserUseCase, LoginUserUseCase } from '@lehman-brothers/application';
import { exhaustive } from 'exhaustive';

export class AuthController {
  constructor(
    private readonly registerUserUseCase: RegisterUserUseCase,
    private readonly loginUserUseCase: LoginUserUseCase
  ) {}

  public async register(req: Request, res: Response): Promise<void> {
    const result = await this.registerUserUseCase.execute(req.body);
    
    exhaustive(String(result.success), {
      'true': () => {
        res.status(201).json({ 
          success: true,
          message: 'User registered successfully', 
          userId: result.userId 
        });
      },
      'false': () => {
        // Determine HTTP status code based on error type
        const statusCode = exhaustive(String(result.errorType), {
          'conflict': () => 409,
          'validation': () => 400,
          'server': () => 500,
          'undefined': () => 400
        });
        
        res.status(statusCode).json({ 
          success: false,
          error: result.error,
          type: result.errorType || 'unknown'
        });
      }
    });
  }

  public async login(req: Request, res: Response): Promise<void> {
    const result = await this.loginUserUseCase.execute(req.body);
    
    exhaustive(String(result.success), {
      'true': () => {
        res.status(200).json({
          success: true,
          message: 'Login successful',
          token: result.token,
          user: result.user,
        });
      },
      'false': () => {
        res.status(401).json({ success: false, error: result.error });
      }
    });
  }
}
