export class InvalidMessageContentError extends Error {
  public constructor() {
    super('Message content cannot be empty');
    this.name = "InvalidMessageContentError";
  }
}
