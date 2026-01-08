import { Order } from '../../../domain/entities/Order';
import { Trade } from '../../../domain/entities/Trade';
import { OrderType } from '../../../domain/values/OrderType';
import { OrderStatus } from '../../../domain/values/OrderStatus';
import { IOrderRepository } from '../../repositories/IOrderRepository';
import { IPortfolioRepository } from '../../repositories/IPortfolioRepository';
import { AccountRepository } from '../../repositories/AccountRepository';
import { IStockRepository } from '../../repositories/IStockRepository';
import { Result } from '../../../domain/values/Result';
import { Quantity } from '../../../domain/values/Quantity';
import { Money } from '../../../domain/values/Money';
import { Portfolio } from '../../../domain/entities/Portfolio';

import { ITradeRepository } from '../../repositories/ITradeRepository';
import { UserRepository } from '../../repositories/UserRepository';

export class MatchOrdersUseCase {
  private bankUserId: string | null = null;

  constructor(
    private readonly orderRepository: IOrderRepository,
    private readonly portfolioRepository: IPortfolioRepository,
    private readonly accountRepository: AccountRepository,
    private readonly stockRepository: IStockRepository,
    private readonly tradeRepository: ITradeRepository,
    private readonly userRepository: UserRepository
  ) { }

  private async getBankUserId(): Promise<string> {
    if (this.bankUserId) return this.bankUserId;

    const bankUser = await this.userRepository.findByEmail('bank@lehman-brothers.com');
    if (bankUser) {
      this.bankUserId = bankUser.getId();
    } else {
      // Fallback to hardcoded ID if not found (should not happen if stock created)
      this.bankUserId = '00000000-0000-0000-0000-000000000000';
    }
    return this.bankUserId;
  }

  async execute(incomingOrder: Order): Promise<void> {
    // 1. Fetch potential matching orders (opposite side, same stock)
    // For BUY order, we want SELL orders with price <= incoming limit price
    // For SELL order, we want BUY orders with price >= incoming limit price
    // Sort by price (best price first) and then by time (FIFO)

    const stockId = incomingOrder.getStockId();
    const allOrders = await this.orderRepository.findByStockId(stockId);

    // Filter for opposite side and PENDING status
    const oppositeType = incomingOrder.getType() === OrderType.BUY ? OrderType.SELL : OrderType.BUY;
    let potentialMatches = allOrders.filter(o =>
      o.getType() === oppositeType &&
      o.getStatus() === OrderStatus.PENDING &&
      o.getId() !== incomingOrder.getId() // Should not match with itself if somehow in list
    );

    const bankUserId = await this.getBankUserId();

    // Sort matches
    if (incomingOrder.getType() === OrderType.BUY) {
      // Buying: want lowest sell prices. 
      // Filter: Sell Price <= Buy Limit
      potentialMatches = potentialMatches.filter(o => o.getLimitPrice().getAmountInCents() <= incomingOrder.getLimitPrice().getAmountInCents());

      // Sort: 
      // 1. Non-Bank User > Bank User (STRICT PRIORITY)
      // 2. Lowest Price
      // 3. Oldest
      potentialMatches.sort((a, b) => {
        // Priority: Non-Bank User > Bank User
        const aIsBank = a.getUserId() === bankUserId;
        const bIsBank = b.getUserId() === bankUserId;

        if (aIsBank && !bIsBank) return 1;
        if (!aIsBank && bIsBank) return -1;

        // Price Priority (Lowest first)
        const priceDiff = a.getLimitPrice().getAmountInCents() - b.getLimitPrice().getAmountInCents();
        if (priceDiff !== 0) return priceDiff;

        // Time Priority (FIFO)
        return a.getTimestamp().getTime() - b.getTimestamp().getTime();
      });
    } else {
      // Selling: want highest buy prices.
      // Filter: Buy Price >= Sell Limit
      potentialMatches = potentialMatches.filter(o => o.getLimitPrice().getAmountInCents() >= incomingOrder.getLimitPrice().getAmountInCents());

      // Sort: 
      // 1. Non-Bank User > Bank User (STRICT PRIORITY)
      // 2. Highest Price
      // 3. Oldest
      potentialMatches.sort((a, b) => {
        // Priority: Non-Bank User > Bank User
        const aIsBank = a.getUserId() === bankUserId;
        const bIsBank = b.getUserId() === bankUserId;

        if (aIsBank && !bIsBank) return 1;
        if (!aIsBank && bIsBank) return -1;

        // Price Priority (Highest first)
        const priceDiff = b.getLimitPrice().getAmountInCents() - a.getLimitPrice().getAmountInCents();
        if (priceDiff !== 0) return priceDiff;

        // Time Priority (FIFO)
        return a.getTimestamp().getTime() - b.getTimestamp().getTime();
      });
    }

    // 2. Iterate and Execute Trades
    let remainingQuantity = incomingOrder.getQuantity().getValue();

    for (const matchOrder of potentialMatches) {
      if (remainingQuantity <= 0) break;

      const matchQuantity = Math.min(remainingQuantity, matchOrder.getQuantity().getValue());

      // Execution Price is determined by the resting order (matchOrder)
      // This is standard exchange behavior (maker-taker)
      const executionPrice = matchOrder.getLimitPrice();

      // Execute Trade
      // IMPORTANT: Update incomingOrder with the result, as it's immutable and we need the updated state (quantity) for next iteration
      incomingOrder = await this.executeTrade(incomingOrder, matchOrder, executionPrice, matchQuantity);

      remainingQuantity -= matchQuantity;
    }
  }

  private async executeTrade(
    aggressorOrder: Order,
    restingOrder: Order,
    price: Money,
    quantityValue: number
  ): Promise<Order> {
    const quantity = Quantity.create(quantityValue).getValue();

    // 1. Update Order Statuses (In memory, will save later)
    // Note: We need to handle partial fills if we want to be precise, 
    // but for now let's assume we just update quantity or mark as filled if fully matched.
    // The current Order entity doesn't seem to have "filledQuantity" field, only "quantity".
    // If we assume "quantity" is "remaining quantity", we can decrease it.
    // Let's check Order.ts... it has "quantity". Let's assume it's remaining.

    // Actually, usually Order has "initialQuantity" and "filledQuantity".
    // If Order.ts only has "quantity", we might need to interpret it as "remaining to fill" 
    // OR we need to update Order entity.
    // For this MVP, let's assume we modify the order's quantity to reflect remaining?
    // Or better, let's just create a Trade and if Order is fully filled, mark as EXECUTED.
    // If partially filled, we keep it PENDING but with reduced quantity?
    // Let's look at Order.ts again. It has `execute()` which sets status to EXECUTED.
    // It doesn't seem to support partial fills easily without modifying quantity.
    // Let's modify quantity for now.

    // Update Aggressor
    // We can't easily "modify" the immutable Order object's quantity without a method.
    // We might need to add a method `fill(quantity: Quantity): Order` to Order entity.
    // For now, let's assume we can't and we might need to update the entity.

    // WAIT: I need to check if I can update Order entity.
    // I will assume I can add a method to Order entity or use existing ones.
    // Let's assume I will add `fill` method to Order.

    // 2. Create Trade Record
    const tradeResult = Trade.create({
      buyOrderId: aggressorOrder.getType() === OrderType.BUY ? aggressorOrder.getId() : restingOrder.getId(),
      sellOrderId: aggressorOrder.getType() === OrderType.SELL ? aggressorOrder.getId() : restingOrder.getId(),
      executionPrice: price,
      quantity: quantity,
      fee: Money.create(0).getValue(), // No fees for now
      aggressorSide: aggressorOrder.getType()
    });

    if (tradeResult.isSuccess()) {
      await this.tradeRepository.save(tradeResult.getValue());
    }

    // 3. Transfer Assets
    const buyer = aggressorOrder.getType() === OrderType.BUY ? aggressorOrder : restingOrder;
    const seller = aggressorOrder.getType() === OrderType.SELL ? aggressorOrder : restingOrder;

    // Buyer: Gets Shares, Pays Cash
    // Seller: Gives Shares, Gets Cash

    // Update Buyer Portfolio
    let buyerPortfolio = await this.portfolioRepository.findByUserId(buyer.getUserId());
    if (!buyerPortfolio) {
      buyerPortfolio = Portfolio.create({ userId: buyer.getUserId() }).getValue();
    }
    buyerPortfolio.addShares(buyer.getStockId(), quantity);
    await this.portfolioRepository.save(buyerPortfolio);

    // Update Seller Portfolio
    // Seller already had shares deducted (reserved) when placing order?
    // Let's check PlaceOrderUseCase.
    // Yes: "Deduct shares immediately (reservation)"
    // So for Seller, we don't need to remove shares again.
    // BUT if the seller is the RESTING order, their shares were already removed.
    // If the seller is the AGGRESSOR, their shares were removed in PlaceOrderUseCase just before calling this service.
    // So correct, shares are already gone from seller's portfolio.

    // Update Buyer Account (Cash)
    // Buyer already had cash deducted (reserved) when placing order?
    // PlaceOrderUseCase: "Check and Withdraw Cash"
    // Yes, cash is reserved.
    // BUT the reserved cash was based on LIMIT price.
    // Execution price might be lower (better) for buyer.
    // If Execution Price < Buyer Limit Price, we need to refund the difference.

    const buyerAccounts = await this.accountRepository.findByUserId(buyer.getUserId());
    const buyerAccount = buyerAccounts[0]; // Assume default

    if (buyerAccount) {
      const cost = price.multiply(quantityValue);
      const reservedCost = buyer.getLimitPrice().multiply(quantityValue);

      if (reservedCost.getAmountInCents() > cost.getAmountInCents()) {
        const refund = reservedCost.subtract(cost).getAmountInEuro();
        const depositResult = buyerAccount.deposit(refund);
        if (depositResult.isSuccess()) {
          await this.accountRepository.save(depositResult.getValue());
        }
      }
    }

    // Update Seller Account (Cash)
    // Seller needs to receive cash.
    const sellerAccounts = await this.accountRepository.findByUserId(seller.getUserId());
    const sellerAccount = sellerAccounts[0]; // Assume default

    if (sellerAccount) {
      const cost = price.multiply(quantityValue);
      const depositResult = sellerAccount.deposit(cost.getAmountInEuro());
      if (depositResult.isSuccess()) {
        await this.accountRepository.save(depositResult.getValue());
      }
    }

    // 4. Update Orders
    const newAggressor = aggressorOrder.fill(quantity);
    await this.orderRepository.save(newAggressor);

    const newResting = restingOrder.fill(quantity);
    await this.orderRepository.save(newResting);

    return newAggressor;
  }
}
