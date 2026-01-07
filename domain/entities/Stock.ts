import { Money } from '../values/Money';
import { StockSymbol } from '../values/StockSymbol';
import { Result } from '../values/Result';

export interface StockProps {
  id: string;
  symbol: StockSymbol;
  name: string;
  isin: string; // International Securities Identification Number
  isActive: boolean;
  currentPrice: Money;
}

export class Stock {
  private constructor(private readonly props: StockProps) { }

  public static create(props: {
    symbol: StockSymbol;
    name: string;
    isin: string;
    currentPrice: Money;
    isActive?: boolean;
  }): Result<Stock, Error> {
    if (!props.name || props.name.trim().length === 0) {
      return Result.failure(new Error('Stock name cannot be empty'));
    }
    if (!props.isin || props.isin.trim().length === 0) {
      return Result.failure(new Error('ISIN cannot be empty'));
    }

    const stock = new Stock({
      id: crypto.randomUUID(),
      symbol: props.symbol,
      name: props.name,
      isin: props.isin,
      isActive: props.isActive ?? true,
      currentPrice: props.currentPrice,
    });

    return Result.success(stock);
  }

  public static fromPersistence(data: any): Stock {
    // Assuming data.current_price is in cents
    const priceResult = Money.create(data.current_price);
    const symbolResult = StockSymbol.create(data.symbol);

    if (priceResult.isFailure() || symbolResult.isFailure()) {
      // In a real app we might want to log this or handle it better, 
      // but for now we assume persistence data is valid or throw
      throw new Error('Invalid data from persistence');
    }

    return new Stock({
      id: data.id,
      symbol: symbolResult.getValue(),
      name: data.name,
      isin: data.isin,
      isActive: data.is_active,
      currentPrice: priceResult.getValue()
    });
  }

  public getId(): string { return this.props.id; }
  public getSymbol(): StockSymbol { return this.props.symbol; }
  public getName(): string { return this.props.name; }
  public getIsin(): string { return this.props.isin; }
  public isActive(): boolean { return this.props.isActive; }
  public getCurrentPrice(): Money { return this.props.currentPrice; }

  public updatePrice(newPrice: Money): Stock {
    return new Stock({
      ...this.props,
      currentPrice: newPrice
    });
  }

  public deactivate(): Stock {
    return new Stock({
      ...this.props,
      isActive: false
    });
  }

  public activate(): Stock {
    return new Stock({
      ...this.props,
      isActive: true
    });
  }
}
