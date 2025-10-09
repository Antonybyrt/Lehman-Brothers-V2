export class UserDeactivatedError extends Error {
  public constructor(public readonly email: string) {
    super(`User account is deactivated: ${email}`);
    this.name = "UserDeactivatedError";
  }
}
