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
          message: 'User registered successfully', 
          userId: result.userId 
        });
      },
      'false': () => {
        res.status(400).json({ error: result.error });
      }
    });
  }

  public async login(req: Request, res: Response): Promise<void> {
    const result = await this.loginUserUseCase.execute(req.body);
    
    exhaustive(String(result.success), {
      'true': () => {
        res.status(200).json({
          message: 'Login successful',
          token: result.token,
          user: result.user,
        });
      },
      'false': () => {
        res.status(401).json({ error: result.error });
      }
    });
  }
}
