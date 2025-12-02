export class ChatNotFoundError extends Error {
  public constructor(public readonly chatId: string) {
    super(`Chat with ID '${chatId}' was not found.`);
    this.name = "ChatNotFoundError";
  }
}
