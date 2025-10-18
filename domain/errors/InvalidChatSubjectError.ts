export class InvalidChatSubjectError extends Error {
  public constructor(public readonly subject: string) {
    super(`Invalid chat subject: ${subject}`);
    this.name = "InvalidChatSubjectError";
  }
}
