export class InvalidEmailError extends Error {
  public constructor(public readonly email: string) {
    super(`Invalid email format: ${email}`);
    this.name = "InvalidEmailError";
  }
}
