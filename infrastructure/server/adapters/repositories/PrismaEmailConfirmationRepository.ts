import { EmailConfirmation } from '@lehman-brothers/domain';
import { EmailConfirmationRepository } from '@lehman-brothers/application';
import { PrismaClient } from '@prisma/client';

export class PrismaEmailConfirmationRepository implements EmailConfirmationRepository {
  constructor(private readonly prisma: PrismaClient) {}

  async save(emailConfirmation: EmailConfirmation): Promise<void> {
    const data = emailConfirmation.toPersistence();
    
    await this.prisma.emailConfirmation.create({
      data: {
        id: data.id,
        user_id: data.user_id,
        token: data.token,
        expires_at: data.expires_at,
        confirmed: data.confirmed,
        created_at: data.created_at,
      },
    });
  }

  async findByToken(token: string): Promise<EmailConfirmation | null> {
    const data = await this.prisma.emailConfirmation.findUnique({
      where: { token },
    });

    if (!data) {
      return null;
    }

    return EmailConfirmation.fromPersistence({
      id: data.id,
      userId: data.user_id,
      token: data.token,
      expiresAt: data.expires_at,
      confirmed: data.confirmed,
      createdAt: data.created_at,
    });
  }

  async findByUserId(userId: string): Promise<EmailConfirmation | null> {
    const data = await this.prisma.emailConfirmation.findFirst({
      where: { user_id: userId },
      orderBy: { created_at: 'desc' },
    });

    if (!data) {
      return null;
    }

    return EmailConfirmation.fromPersistence({
      id: data.id,
      userId: data.user_id,
      token: data.token,
      expiresAt: data.expires_at,
      confirmed: data.confirmed,
      createdAt: data.created_at,
    });
  }

  async delete(id: string): Promise<void> {
    await this.prisma.emailConfirmation.delete({
      where: { id },
    });
  }
}
