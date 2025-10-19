import { Chat } from '@lehman-brothers/domain';

export interface ChatRepository {
  save(chat: Chat): Promise<void>;
  findById(id: string): Promise<Chat | null>;
  findByClientId(clientId: string): Promise<Chat[]>;
  findByAdvisorId(advisorId: string): Promise<Chat[]>;
  findUnassigned(): Promise<Chat[]>;
  delete(id: string): Promise<void>;
}
