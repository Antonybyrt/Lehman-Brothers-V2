export class InvalidIbanError extends Error {
  public constructor(public readonly iban: string) {
    super(`The IBAN '${iban}' is not valid.`);
    this.name = "InvalidIbanError";
  }
}
