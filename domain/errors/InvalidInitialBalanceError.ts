export class InvalidInitialBalanceError extends Error {
  public constructor(public readonly balance: number) {
    super(`The initial balance '${balance}' is not valid. Initial balance cannot be negative.`);
    this.name = "InvalidInitialBalanceError";
  }
}
