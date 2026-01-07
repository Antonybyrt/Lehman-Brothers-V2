import { Money } from '../values/Money';
import { Quantity } from '../values/Quantity';
import { OrderType } from '../values/OrderType';
import { OrderStatus } from '../values/OrderStatus';
import { Result } from '../values/Result';

export interface OrderProps {
  id: string;
  userId: string;
  stockId: string;
  type: OrderType;
  quantity: Quantity;
  limitPrice: Money;
  status: OrderStatus;
  timestamp: Date;
}

export class Order {
  private constructor(private readonly props: OrderProps) { }

  public static create(props: {
    userId: string;
    stockId: string;
    type: OrderType;
    quantity: Quantity;
    limitPrice: Money;
  }): Result<Order, Error> {
    const order = new Order({
      id: crypto.randomUUID(),
      userId: props.userId,
      stockId: props.stockId,
      type: props.type,
      quantity: props.quantity,
      limitPrice: props.limitPrice,
      status: OrderStatus.PENDING,
      timestamp: new Date(),
    });

    return Result.success(order);
  }

  public getId(): string { return this.props.id; }
  public getUserId(): string { return this.props.userId; }
  public getStockId(): string { return this.props.stockId; }
  public getType(): OrderType { return this.props.type; }
  public getQuantity(): Quantity { return this.props.quantity; }
  public getLimitPrice(): Money { return this.props.limitPrice; }
  public getStatus(): OrderStatus { return this.props.status; }
  public getTimestamp(): Date { return this.props.timestamp; }

  public execute(): Order {
    return new Order({
      ...this.props,
      status: OrderStatus.EXECUTED
    });
  }

  public cancel(): Order {
    return new Order({
      ...this.props,
      status: OrderStatus.CANCELLED
    });
  }
  public static fromPersistence(data: any): Order {
    return new Order({
      id: data.id,
      userId: data.userId,
      stockId: data.stockId,
      type: data.type,
      quantity: Quantity.create(data.quantity).getValue(),
      limitPrice: Money.create(data.limitPrice).getValue(),
      status: data.status,
      timestamp: data.createdAt
    });
  }

  public toPersistence() {
    return {
      id: this.props.id,
      userId: this.props.userId,
      stockId: this.props.stockId,
      type: this.props.type,
      quantity: this.props.quantity.getValue(),
      limitPrice: this.props.limitPrice.getAmountInCents(),
      status: this.props.status,
      createdAt: this.props.timestamp
    };
  }
}
