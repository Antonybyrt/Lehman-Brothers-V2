export class IbanAlreadyExistsError extends Error {
  public constructor(public readonly iban: string) {
    super(`The IBAN '${iban}' already exists in the system.`);
    this.name = "IbanAlreadyExistsError";
  }
}
