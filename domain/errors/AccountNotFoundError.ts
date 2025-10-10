export class AccountNotFoundError extends Error {
  public constructor(public readonly accountId: string) {
    super(`Account with ID '${accountId}' was not found.`);
    this.name = "AccountNotFoundError";
  }
}
