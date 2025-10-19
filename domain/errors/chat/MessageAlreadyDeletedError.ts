export class MessageAlreadyDeletedError extends Error {
  public constructor(public readonly messageId: string) {
    super(`Message '${messageId}' is already deleted.`);
    this.name = "MessageAlreadyDeletedError";
  }
}
