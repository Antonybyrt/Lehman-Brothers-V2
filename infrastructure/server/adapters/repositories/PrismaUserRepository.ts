import { User } from '@lehman-brothers/domain';
import { UserRepository } from '@lehman-brothers/application';
import { PrismaClient } from '@prisma/client';
import { Email, Password, UserRoleValue } from '@lehman-brothers/domain';

export class PrismaUserRepository implements UserRepository {
  constructor(private readonly prisma: PrismaClient) {}

  async save(user: User): Promise<void> {
    const userData = user.toPersistence();
    
    await this.prisma.user.create({
      data: {
        id: userData.id,
        first_name: userData.firstName,
        last_name: userData.lastName,
        email: userData.email.getValue(),
        password: userData.password.getHashedValue(),
        role: userData.role.getValue(),
        active: userData.active,
        created_at: userData.createdAt,
      },
    });
  }

  async findByEmail(email: string): Promise<User | null> {
    const userData = await this.prisma.user.findUnique({
      where: { email },
    });

    if (!userData) {
      return null;
    }

    return User.fromPersistence({
      id: userData.id,
      firstName: userData.first_name,
      lastName: userData.last_name,
      email: Email.create(userData.email),
      password: Password.fromHash(userData.password),
      role: UserRoleValue.create(userData.role),
      active: userData.active,
      createdAt: userData.created_at,
    });
  }

  async findById(id: string): Promise<User | null> {
    const userData = await this.prisma.user.findUnique({
      where: { id },
    });

    if (!userData) {
      return null;
    }

    return User.fromPersistence({
      id: userData.id,
      firstName: userData.first_name,
      lastName: userData.last_name,
      email: Email.create(userData.email),
      password: Password.fromHash(userData.password),
      role: UserRoleValue.create(userData.role),
      active: userData.active,
      createdAt: userData.created_at,
    });
  }

  async existsByEmail(email: string): Promise<boolean> {
    const count = await this.prisma.user.count({
      where: { email },
    });
    return count > 0;
  }
}
