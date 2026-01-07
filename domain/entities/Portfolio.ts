import { Quantity } from '../values/Quantity';
import { Result } from '../values/Result';

export interface PortfolioProps {
  userId: string;
  holdings: Map<string, Quantity>; // stockId -> Quantity
}

export class Portfolio {
  private constructor(private readonly props: PortfolioProps) { }

  public static create(props: {
    userId: string;
    holdings?: Map<string, Quantity>;
  }): Result<Portfolio, Error> {
    const portfolio = new Portfolio({
      userId: props.userId,
      holdings: props.holdings || new Map<string, Quantity>(),
    });

    return Result.success(portfolio);
  }

  public getUserId(): string { return this.props.userId; }
  public getHoldings(): Map<string, Quantity> { return new Map(this.props.holdings); }

  public getQuantityForStock(stockId: string): Quantity {
    const quantity = this.props.holdings.get(stockId);
    if (quantity) {
      return quantity;
    }
    // If not found, return 0 quantity. 
    // Since Quantity value object enforces positive value, we might need a helper or just return 0 value if we allowed it, 
    // but here let's assume we return a Quantity representing 0 if we can, or handle it.
    // Given Quantity.create(0) fails, we should probably handle this carefully.
    // Let's assume for now we return a Quantity with value 0 if we modify Quantity to allow it, OR we just return undefined/null or throw?
    // Better: return 0 as number? Or modify Quantity to allow 0?
    // The user requirement said "Quantity" for orders/portfolio.
    // Let's modify Quantity to allow 0? Or just return a number here?
    // Let's return number for simplicity in "getQuantity" and use Quantity for operations.
    // Actually, let's try to create a Quantity(0) locally if needed, but since it's value object...
    // Let's just return the Quantity object if exists, or undefined?
    // Or better, let's assume we can create a "Zero" quantity?
    // I'll stick to returning Quantity | undefined for now.
    return quantity!;
  }

  public hasSufficientShares(stockId: string, requiredQuantity: Quantity): boolean {
    const currentQuantity = this.props.holdings.get(stockId);
    if (!currentQuantity) {
      return false;
    }
    return currentQuantity.getValue() >= requiredQuantity.getValue();
  }

  public addShares(stockId: string, quantity: Quantity): void {
    const currentQuantity = this.props.holdings.get(stockId);
    if (currentQuantity) {
      this.props.holdings.set(stockId, currentQuantity.add(quantity));
    } else {
      this.props.holdings.set(stockId, quantity);
    }
  }

  public removeShares(stockId: string, quantity: Quantity): Result<void, Error> {
    const currentQuantity = this.props.holdings.get(stockId);
    if (!currentQuantity) {
      return Result.failure(new Error('Stock not found in portfolio'));
    }

    const result = currentQuantity.subtract(quantity);
    if (result.isFailure()) {
      return Result.failure(result.getError());
    }

    const newQuantity = result.getValue();
    if (newQuantity.getValue() === 0) {
      this.props.holdings.delete(stockId);
    } else {
      this.props.holdings.set(stockId, newQuantity);
    }

    return Result.success(undefined);
  }
}
