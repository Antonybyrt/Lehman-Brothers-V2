export class UserAlreadyExistsError extends Error {
  public constructor(public readonly email: string) {
    super(`User already exists with email: ${email}`);
    this.name = "UserAlreadyExistsError";
  }
}
