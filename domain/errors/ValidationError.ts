export class ValidationError extends Error {
  public constructor(public readonly field: string, public readonly errorMessage: string) {
    super(`Validation error for field '${field}': ${errorMessage}`);
    this.name = "ValidationError";
  }
}
