import { Chat, ChatStatus } from '@lehman-brothers/domain';
import { ChatRepository } from '@lehman-brothers/application';
import { PrismaClient } from '@prisma/client';

export class PrismaChatRepository implements ChatRepository {
  constructor(private readonly prisma: PrismaClient) { }

  async save(chat: Chat): Promise<void> {
    const chatData = chat.toPersistence();

    await this.prisma.chat.upsert({
      where: { id: chatData.id },
      update: {
        subject: chatData.subject,
        client_id: chatData.client_id,
        advisor_id: chatData.advisor_id,
        transferred_from_id: chatData.transferred_from_id,
        status: chatData.status as any,
        open: chatData.open,
        updated_at: chatData.updated_at,
      },
      create: {
        id: chatData.id,
        subject: chatData.subject,
        client_id: chatData.client_id,
        advisor_id: chatData.advisor_id,
        transferred_from_id: chatData.transferred_from_id,
        status: chatData.status as any,
        open: chatData.open,
        created_at: chatData.created_at,
        updated_at: chatData.updated_at,
      },
    });
  }

  async findById(id: string): Promise<Chat | null> {
    const data = await this.prisma.chat.findUnique({
      where: { id },
    });
    return data ? Chat.fromPersistence(data) : null;
  }

  async findByClientId(clientId: string): Promise<Chat[]> {
    const data = await this.prisma.chat.findMany({
      where: { client_id: clientId },
      orderBy: { created_at: 'desc' },
    });
    return data.map(item => Chat.fromPersistence(item));
  }

  async findByAdvisorId(advisorId: string): Promise<Chat[]> {
    const data = await this.prisma.chat.findMany({
      where: { advisor_id: advisorId },
      orderBy: { updated_at: 'desc' },
    });
    return data.map(item => Chat.fromPersistence(item));
  }

  async findUnassigned(): Promise<Chat[]> {
    const data = await this.prisma.chat.findMany({
      where: {
        advisor_id: null,
        open: true,
      },
      orderBy: { created_at: 'desc' },
    });
    return data.map(item => Chat.fromPersistence(item));
  }

  async delete(id: string): Promise<void> {
    await this.prisma.chat.delete({
      where: { id },
    });
  }
}
