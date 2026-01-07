export class SameAccountTransferError extends Error {
  public constructor(public readonly accountId: string) {
    super(`Cannot transfer to the same account '${accountId}'.`);
    this.name = "SameAccountTransferError";
  }
}
