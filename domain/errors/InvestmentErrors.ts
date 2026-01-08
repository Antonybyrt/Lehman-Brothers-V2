export class StockNotActiveError extends Error {
  constructor(stockId: string) {
    super(`Stock ${stockId} is not active`);
    this.name = 'StockNotActiveError';
  }
}

export class InsufficientSharesError extends Error {
  constructor(stockId: string, required: number, available: number) {
    super(`Insufficient shares for stock ${stockId}. Required: ${required}, Available: ${available}`);
    this.name = 'InsufficientSharesError';
  }
}

export class InvalidOrderError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'InvalidOrderError';
  }
}
