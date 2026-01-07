export class InvalidTransferAmountError extends Error {
  public constructor(public readonly amount: number) {
    super(`Invalid transfer amount: ${amount}. Amount must be a positive number.`);
    this.name = "InvalidTransferAmountError";
  }
}
