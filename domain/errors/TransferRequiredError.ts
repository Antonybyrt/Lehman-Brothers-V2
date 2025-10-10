export class TransferRequiredError extends Error {
  public constructor(public readonly accountId: string) {
    super(`Account '${accountId}' cannot be deleted. A transfer IBAN must be provided to transfer the remaining balance.`);
    this.name = "TransferRequiredError";
  }
}
