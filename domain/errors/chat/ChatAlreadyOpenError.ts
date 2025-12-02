export class ChatAlreadyOpenError extends Error {
  public constructor(public readonly chatId: string) {
    super(`Chat '${chatId}' is already open.`);
    this.name = "ChatAlreadyOpenError";
  }
}
