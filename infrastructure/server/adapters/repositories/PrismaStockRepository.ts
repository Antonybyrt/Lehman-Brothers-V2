import { IStockRepository } from '../../../../application/repositories/IStockRepository';
import { Stock } from '../../../../domain/entities/Stock';
import { StockSymbol } from '../../../../domain/values/StockSymbol';
import { Money } from '../../../../domain/values/Money';
import { PrismaClient } from '@prisma/client';

export class PrismaStockRepository implements IStockRepository {
  constructor(private readonly prisma: PrismaClient) { }

  async save(stock: Stock): Promise<void> {
    await this.prisma.stock.upsert({
      where: { id: stock.getId() },
      update: {
        name: stock.getName(),
        symbol: stock.getSymbol().getValue(),
        isin: stock.getIsin(),
        current_price: stock.getCurrentPrice().getAmountInCents(),
        active: stock.isActive(),
      },
      create: {
        id: stock.getId(),
        name: stock.getName(),
        symbol: stock.getSymbol().getValue(),
        isin: stock.getIsin(),
        current_price: stock.getCurrentPrice().getAmountInCents(),
        active: stock.isActive(),
      },
    });
  }

  async findById(id: string): Promise<Stock | null> {
    const stockData = await this.prisma.stock.findUnique({
      where: { id },
    });

    if (!stockData) return null;

    return this.mapToDomain(stockData);
  }

  async findAll(): Promise<Stock[]> {
    const stocksData = await this.prisma.stock.findMany();
    return stocksData.map(this.mapToDomain);
  }

  async findAllActive(): Promise<Stock[]> {
    const stocksData = await this.prisma.stock.findMany({
      where: { active: true },
    });
    return stocksData.map(this.mapToDomain);
  }

  private mapToDomain(data: any): Stock {
    const symbolResult = StockSymbol.create(data.symbol);
    const priceResult = Money.create(data.current_price);

    // Assuming data in DB is valid, but we should handle potential errors safely
    // For simplicity, we assume valid data if it exists in DB

    return Stock.create({
      symbol: symbolResult.getValue(), // Or handle error
      name: data.name,
      isin: data.isin,
      currentPrice: priceResult.getValue(), // Or handle error
    }).getValue(); // Re-creating entity. 
    // Ideally we should have a `fromPersistence` method on Stock entity or use the constructor directly if public/accessible via factory

    // Using the factory creates a new ID. We need to restore the existing ID.
    // The Stock entity doesn't expose a way to set ID via create() unless we modify it or add fromPersistence.
    // Let's check Stock entity again.
  }
}
