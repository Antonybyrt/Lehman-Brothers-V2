export class ChatAlreadyClosedError extends Error {
  public constructor(public readonly chatId: string) {
    super(`Chat '${chatId}' is already closed.`);
    this.name = "ChatAlreadyClosedError";
  }
}
