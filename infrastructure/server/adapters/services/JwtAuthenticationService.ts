import { AuthenticationService } from '@lehman-brothers/application';
import jwt from 'jsonwebtoken';

export class JwtAuthenticationService implements AuthenticationService {
  constructor(
    private readonly secret: string,
    private readonly expiresIn: string = '7d'
  ) {}

  generateToken(userId: string, role: string): string {
    return jwt.sign(
      { userId, role },
      this.secret,
      { expiresIn: this.expiresIn }
    );
  }

  verifyToken(token: string): { userId: string; role: string } | null {
    try {
      const decoded = jwt.verify(token, this.secret) as any;
      return {
        userId: decoded.userId,
        role: decoded.role,
      };
    } catch (error) {
      return null;
    }
  }
}
