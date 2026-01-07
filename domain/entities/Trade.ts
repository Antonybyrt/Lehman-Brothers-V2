import { Money } from '../values/Money';
import { Quantity } from '../values/Quantity';
import { Result } from '../values/Result';

export interface TradeProps {
  id: string;
  buyOrderId: string;
  sellOrderId: string;
  executionPrice: Money;
  quantity: Quantity;
  fee: Money;
  timestamp: Date;
}

export class Trade {
  private constructor(private readonly props: TradeProps) { }

  public static create(props: {
    buyOrderId: string;
    sellOrderId: string;
    executionPrice: Money;
    quantity: Quantity;
    fee: Money;
  }): Result<Trade, Error> {
    const trade = new Trade({
      id: crypto.randomUUID(),
      buyOrderId: props.buyOrderId,
      sellOrderId: props.sellOrderId,
      executionPrice: props.executionPrice,
      quantity: props.quantity,
      fee: props.fee,
      timestamp: new Date(),
    });

    return Result.success(trade);
  }

  public getId(): string { return this.props.id; }
  public getBuyOrderId(): string { return this.props.buyOrderId; }
  public getSellOrderId(): string { return this.props.sellOrderId; }
  public getExecutionPrice(): Money { return this.props.executionPrice; }
  public getQuantity(): Quantity { return this.props.quantity; }
  public getFee(): Money { return this.props.fee; }
  public getTimestamp(): Date { return this.props.timestamp; }
}
