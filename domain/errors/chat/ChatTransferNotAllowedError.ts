export class ChatTransferNotAllowedError extends Error {
  public constructor(public readonly chatId: string, public readonly reason: string) {
    super(`Cannot transfer chat '${chatId}': ${reason}`);
    this.name = "ChatTransferNotAllowedError";
  }
}
