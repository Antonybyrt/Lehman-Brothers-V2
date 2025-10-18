import { MessageRead } from '@lehman-brothers/domain';
import { MessageReadRepository } from '@lehman-brothers/application';
import { PrismaClient } from '@prisma/client';

export class PrismaMessageReadRepository implements MessageReadRepository {
  constructor(private readonly prisma: PrismaClient) { }

  async save(messageRead: MessageRead): Promise<void> {
    const data = messageRead.toPersistence();

    await this.prisma.messageRead.upsert({
      where: {
        message_id_user_id: {
          message_id: BigInt(data.message_id),
          user_id: data.user_id,
        },
      },
      update: {
        read_at: data.read_at,
      },
      create: {
        message_id: BigInt(data.message_id),
        user_id: data.user_id,
        read_at: data.read_at,
      },
    });
  }

  async findByMessageId(messageId: string): Promise<MessageRead[]> {
    const data = await this.prisma.messageRead.findMany({
      where: { message_id: BigInt(messageId) },
    });

    return data.map(item =>
      MessageRead.fromPersistence({
        message_id: item.message_id.toString(),
        user_id: item.user_id,
        read_at: item.read_at,
      })
    );
  }

  async findByUserIdAndChatId(userId: string, chatId: string): Promise<MessageRead[]> {
    const data = await this.prisma.messageRead.findMany({
      where: {
        user_id: userId,
        message: {
          chat_id: chatId,
        },
      },
      include: {
        message: true,
      },
    });

    return data.map(item =>
      MessageRead.fromPersistence({
        message_id: item.message_id.toString(),
        user_id: item.user_id,
        read_at: item.read_at,
      })
    );
  }

  async hasRead(messageId: string, userId: string): Promise<boolean> {
    const count = await this.prisma.messageRead.count({
      where: {
        message_id: BigInt(messageId),
        user_id: userId,
      },
    });
    return count > 0;
  }

  async markMultipleAsRead(messageIds: string[], userId: string): Promise<void> {
    // Créer les enregistrements de lecture en batch
    const reads = messageIds.map(messageId => ({
      message_id: BigInt(messageId),
      user_id: userId,
      read_at: new Date(),
    }));

    console.log('[PrismaMessageReadRepository] markMultipleAsRead:', {
      userId,
      messageIds,
      readsCount: reads.length
    });

    // Utiliser createMany avec skipDuplicates pour éviter les erreurs si déjà lu
    const result = await this.prisma.messageRead.createMany({
      data: reads,
      skipDuplicates: true,
    });

    console.log('[PrismaMessageReadRepository] Created:', result.count);
  }
}
