import { Stock } from '../../domain/entities/Stock';

export interface IStockRepository {
  save(stock: Stock): Promise<void>;
  findById(id: string): Promise<Stock | null>;
  findAll(): Promise<Stock[]>;
  findAllActive(): Promise<Stock[]>;
}
