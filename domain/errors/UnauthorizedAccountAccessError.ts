export class UnauthorizedAccountAccessError extends Error {
  public constructor(public readonly accountId: string, public readonly userId: string) {
    super(`User '${userId}' is not authorized to access account '${accountId}'.`);
    this.name = "UnauthorizedAccountAccessError";
  }
}
