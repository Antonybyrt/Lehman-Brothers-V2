export class InsufficientFundsError extends Error {
  public constructor(
    public readonly accountId: string,
    public readonly availableBalance: number,
    public readonly requestedAmount: number
  ) {
    super(`Insufficient funds in account '${accountId}'. Available: ${availableBalance}€, Requested: ${requestedAmount}€`);
    this.name = "InsufficientFundsError";
  }
}
