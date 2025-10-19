import { Request, Response } from 'express';
import { RegisterUserUseCase, LoginUserUseCase } from '@lehman-brothers/application';
import { exhaustive } from 'exhaustive';
import { AuthenticatedRequest } from '../../middleware/authMiddleware';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export class AuthController {
  constructor(
    private readonly registerUserUseCase: RegisterUserUseCase,
    private readonly loginUserUseCase: LoginUserUseCase
  ) { }

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

  public async getAllUsers(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      const users = await prisma.user.findMany({
        where: {
          active: true
        },
        select: {
          id: true,
          email: true,
          first_name: true,
          last_name: true,
          role: true
        }
      });

      const usersData = users.map(user => ({
        id: user.id,
        email: user.email,
        firstName: user.first_name,
        lastName: user.last_name,
        role: user.role
      }));

      res.status(200).json({
        success: true,
        users: usersData
      });
    } catch (error) {
      console.error('Error fetching users:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to fetch users'
      });
    }
  }
}
