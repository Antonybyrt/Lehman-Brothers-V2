export interface AuthenticationService {
  generateToken(userId: string, role: string): string;
  verifyToken(token: string): { userId: string; role: string } | null;
}
