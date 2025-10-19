import { Message } from '@lehman-brothers/domain';

export interface MessageRepository {
  save(message: Message): Promise<void>;
  findById(id: string): Promise<Message | null>;
  findByChatId(chatId: string, limit?: number, beforeId?: string): Promise<Message[]>;
  countByChatId(chatId: string): Promise<number>;
  delete(id: string): Promise<void>;
}
