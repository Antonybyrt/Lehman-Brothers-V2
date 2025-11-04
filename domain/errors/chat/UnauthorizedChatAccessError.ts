export class UnauthorizedChatAccessError extends Error {
  public constructor(public readonly userId: string, public readonly chatId: string) {
    super(`User '${userId}' is not authorized to access chat '${chatId}'.`);
    this.name = "UnauthorizedChatAccessError";
  }
}
