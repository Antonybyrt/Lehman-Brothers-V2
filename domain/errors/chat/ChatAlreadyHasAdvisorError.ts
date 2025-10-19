export class ChatAlreadyHasAdvisorError extends Error {
  public constructor(public readonly chatId: string) {
    super(`Chat '${chatId}' already has an assigned advisor.`);
    this.name = "ChatAlreadyHasAdvisorError";
  }
}
