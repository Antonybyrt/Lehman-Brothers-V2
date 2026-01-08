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
    return Stock.fromPersistence(data);
  }
}
