export class UserNotFoundError extends Error {
  public constructor(public readonly email: string) {
    super(`User not found with email: ${email}`);
    this.name = "UserNotFoundError";
  }
}
