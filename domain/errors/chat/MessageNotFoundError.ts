export class MessageNotFoundError extends Error {
  public constructor(public readonly messageId: string) {
    super(`Message with ID '${messageId}' was not found.`);
    this.name = "MessageNotFoundError";
  }
}
