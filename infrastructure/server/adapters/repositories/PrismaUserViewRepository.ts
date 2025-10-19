import { PrismaClient } from '@prisma/client';
import { UserViewRepository, UserView } from '@lehman-brothers/application';

/**
 * Implémentation Prisma pour obtenir des vues formatées d'utilisateurs
 * Évite d'exposer les méthodes du domaine (getFullName, getValue, etc.)
 */
export class PrismaUserViewRepository implements UserViewRepository {
  constructor(private readonly prisma: PrismaClient) { }

  /**
   * Récupère un utilisateur avec les données formatées pour la vue
   */
  async findByIdAsView(userId: string): Promise<UserView | null> {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        first_name: true,
        last_name: true,
        email: true,
        role: true,
      },
    });

    if (!user) {
      return null;
    }

    return {
      id: user.id,
      firstName: user.first_name,
      lastName: user.last_name,
      fullName: `${user.first_name} ${user.last_name}`.trim(),
      email: user.email,
      role: user.role,
    };
  }

  /**
   * Récupère le nom complet d'un utilisateur
   */
  async getFullNameById(userId: string): Promise<string | null> {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      select: {
        first_name: true,
        last_name: true,
      },
    });

    if (!user) {
      return null;
    }

    return `${user.first_name} ${user.last_name}`.trim();
  }

  /**
   * Récupère plusieurs utilisateurs avec leurs données formatées
   */
  async findManyAsView(userIds: string[]): Promise<UserView[]> {
    const users = await this.prisma.user.findMany({
      where: {
        id: {
          in: userIds,
        },
      },
      select: {
        id: true,
        first_name: true,
        last_name: true,
        email: true,
        role: true,
      },
    });

    return users.map(user => ({
      id: user.id,
      firstName: user.first_name,
      lastName: user.last_name,
      fullName: `${user.first_name} ${user.last_name}`.trim(),
      email: user.email,
      role: user.role,
    }));
  }
}
