import { Request, Response } from 'express';
import { ConfirmEmailUseCase } from '@lehman-brothers/application';
import { exhaustive } from 'exhaustive';

export class EmailConfirmationController {
  constructor(private readonly confirmEmailUseCase: ConfirmEmailUseCase) {}

  public async confirmEmail(req: Request, res: Response): Promise<void> {
    const { token } = req.params;
    
    if (!token) {
      res.status(400).json({ error: 'Token is required' });
      return;
    }

    const result = await this.confirmEmailUseCase.execute(token);
    
    exhaustive(String(result.success), {
      'true': () => {
        res.status(200).json({ 
          message: 'Email confirmed successfully' 
        });
      },
      'false': () => {
        res.status(400).json({ error: result.error });
      }
    });
  }
}
