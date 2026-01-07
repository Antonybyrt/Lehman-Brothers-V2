export class InvalidChatPriorityError extends Error {
  public constructor(msg: string) {
    super(`This priority level is invalid: ${msg}`);
    this.name = "InvalidChatPriorityError";
  }
}
