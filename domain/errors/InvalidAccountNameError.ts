export class InvalidAccountNameError extends Error {
  public constructor(public readonly accountName: string) {
    super(`The account name '${accountName}' is not valid. Account name cannot be empty.`);
    this.name = "InvalidAccountNameError";
  }
}
