import { exhaustive } from 'exhaustive';

export enum UserRole {
  CLIENT = 'CLIENT',
  DIRECTOR = 'DIRECTOR',
  ADVISOR = 'ADVISOR'
}

export class UserRoleValue {
  private readonly value: UserRole;

  private constructor(role: UserRole) {
    this.value = role;
  }

  public static create(role: string): UserRoleValue {
    const validRoles = Object.values(UserRole);
    
    if (!validRoles.includes(role as UserRole)) {
      throw new Error(`Invalid user role: ${role}. Valid roles are: ${validRoles.join(', ')}`);
    }
    
    return new UserRoleValue(role as UserRole);
  }

  public getValue(): UserRole {
    return this.value;
  }

  public isClient(): boolean {
    return this.value === UserRole.CLIENT;
  }

  public isDirector(): boolean {
    return this.value === UserRole.DIRECTOR;
  }

  public isAdvisor(): boolean {
    return this.value === UserRole.ADVISOR;
  }

  public toString(): string {
    return this.value;
  }

  public equals(other: UserRoleValue): boolean {
    return this.value === other.value;
  }
}
