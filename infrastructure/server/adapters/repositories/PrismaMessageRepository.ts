import { Message } from '@lehman-brothers/domain';
import { MessageRepository } from '@lehman-brothers/application';
import { PrismaClient } from '@prisma/client';

export class PrismaMessageRepository implements MessageRepository {
  constructor(private readonly prisma: PrismaClient) { }

  async save(message: Message): Promise<void> {
    const messageData = message.toPersistence();

    await this.prisma.message.upsert({
      where: { id: BigInt(messageData.id) },
      update: {
        chat_id: messageData.chat_id,
        author_id: messageData.author_id,
        content: messageData.content,
        attachment_url: messageData.attachment_url,
        edited: messageData.edited,
        deleted: messageData.deleted,
        updated_at: messageData.updated_at,
      },
      create: {
        id: BigInt(messageData.id),
        chat_id: messageData.chat_id,
        author_id: messageData.author_id,
        content: messageData.content,
        attachment_url: messageData.attachment_url,
        edited: messageData.edited,
        deleted: messageData.deleted,
        sent_at: messageData.sent_at,
        updated_at: messageData.updated_at,
      },
    });
  }

  async findById(id: string): Promise<Message | null> {
    const data = await this.prisma.message.findUnique({
      where: { id: BigInt(id) },
    });

    if (!data) {
      return null;
    }

    return Message.fromPersistence({
      id: data.id.toString(),
      chat_id: data.chat_id,
      author_id: data.author_id,
      content: data.content,
      attachment_url: data.attachment_url,
      edited: data.edited,
      deleted: data.deleted,
      sent_at: data.sent_at,
      updated_at: data.updated_at,
    });
  }

  async findByChatId(
    chatId: string,
    limit: number = 50,
    beforeId?: string
  ): Promise<Message[]> {
    const data = await this.prisma.message.findMany({
      where: {
        chat_id: chatId,
        ...(beforeId && { id: { lt: BigInt(beforeId) } }),
      },
      orderBy: { id: 'desc' },
      take: limit,
    });

    return data.map(item =>
      Message.fromPersistence({
        id: item.id.toString(),
        chat_id: item.chat_id,
        author_id: item.author_id,
        content: item.content,
        attachment_url: item.attachment_url,
        edited: item.edited,
        deleted: item.deleted,
        sent_at: item.sent_at,
        updated_at: item.updated_at,
      })
    );
  }

  async countByChatId(chatId: string): Promise<number> {
    return await this.prisma.message.count({
      where: { chat_id: chatId },
    });
  }

  async delete(id: string): Promise<void> {
    await this.prisma.message.delete({
      where: { id: BigInt(id) },
    });
  }
}
