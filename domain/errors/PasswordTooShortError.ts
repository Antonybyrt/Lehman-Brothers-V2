export class PasswordTooShortError extends Error {
  public constructor(public readonly length: number, public readonly minimumLength: number = 8) {
    super(`Password must be at least ${minimumLength} characters long. Received: ${length}`);
    this.name = "PasswordTooShortError";
  }
}
