import { Email, Password, UserRoleValue, Result } from '../values';

export interface UserProps {
  readonly id: string;
  readonly firstName: string;
  readonly lastName: string;
  readonly email: Email;
  readonly password: Password;
  readonly role: UserRoleValue;
  readonly active: boolean;
  readonly createdAt: Date;
}

export class User {
  private constructor(private readonly props: UserProps) {}

  public static async create(props: {
    firstName: string;
    lastName: string;
    email: string;
    password: string;
    role: string;
  }): Promise<Result<User, Error>> {
    try {
      const email = Email.create(props.email);
      const password = await Password.create(props.password);
      const role = UserRoleValue.create(props.role);

      const user = new User({
        id: crypto.randomUUID(),
        firstName: props.firstName.trim(),
        lastName: props.lastName.trim(),
        email,
        password,
        role,
        active: true,
        createdAt: new Date(),
      });

      return Result.success(user);
    } catch (error) {
      return Result.failure(error as Error);
    }
  }

  public static fromPersistence(props: UserProps): User {
    return new User(props);
  }

  // Getters
  public getId(): string {
    return this.props.id;
  }

  public getFirstName(): string {
    return this.props.firstName;
  }

  public getLastName(): string {
    return this.props.lastName;
  }

  public getFullName(): string {
    return `${this.props.firstName} ${this.props.lastName}`;
  }

  public getEmail(): Email {
    return this.props.email;
  }

  public getRole(): UserRoleValue {
    return this.props.role;
  }

  public isActive(): boolean {
    return this.props.active;
  }

  public getCreatedAt(): Date {
    return this.props.createdAt;
  }

  // Business methods
  public async verifyPassword(password: string): Promise<boolean> {
    return await this.props.password.verify(password);
  }

  public deactivate(): User {
    return new User({
      ...this.props,
      active: false,
    });
  }

  public activate(): User {
    return new User({
      ...this.props,
      active: true,
    });
  }

  public canAccessClientFeatures(): boolean {
    return this.props.role.isClient();
  }

  public canAccessDirectorFeatures(): boolean {
    return this.props.role.isDirector();
  }

  public canAccessAdvisorFeatures(): boolean {
    return this.props.role.isAdvisor();
  }

  public toPersistence(): UserProps {
    return { ...this.props };
  }

  public equals(other: User): boolean {
    return this.props.id === other.props.id;
  }

  public toString(): string {
    return `User(${this.props.id}, ${this.props.email.getValue()}, ${this.props.role.getValue()})`;
  }
}
