import { PrismaClient } from '@prisma/client';
import { ChatViewRepository, ChatView } from '@lehman-brothers/application';
import { Chat } from '@lehman-brothers/domain';

/**
 * Implémentation Prisma pour enrichir les chats avec les noms complets
 */
export class PrismaChatViewRepository implements ChatViewRepository {
  constructor(private readonly prisma: PrismaClient) { }

  /**
   * Récupère un chat avec les noms enrichis
   */
  async findByIdWithNames(chatId: string): Promise<ChatView | null> {
    const chatData = await this.prisma.chat.findUnique({
      where: { id: chatId },
      include: {
        client: {
          select: {
            id: true,
            first_name: true,
            last_name: true,
          },
        },
        advisor: {
          select: {
            id: true,
            first_name: true,
            last_name: true,
          },
        },
      },
    });

    if (!chatData) {
      return null;
    }

    return {
      id: chatData.id,
      subject: chatData.subject,
      clientId: chatData.client_id,
      clientName: `${chatData.client.first_name} ${chatData.client.last_name}`.trim(),
      advisorId: chatData.advisor_id,
      advisorName: chatData.advisor
        ? `${chatData.advisor.first_name} ${chatData.advisor.last_name}`.trim()
        : null,
      status: chatData.status,
      createdAt: chatData.created_at,
      updatedAt: chatData.updated_at,
    };
  }

  /**
   * Convertit un chat en vue enrichie
   */
  async toView(chat: Chat): Promise<ChatView> {
    // Récupérer les noms depuis la base de données
    const client = await this.prisma.user.findUnique({
      where: { id: chat.clientId },
      select: { first_name: true, last_name: true },
    });

    let advisorName: string | null = null;
    if (chat.advisorId) {
      const advisor = await this.prisma.user.findUnique({
        where: { id: chat.advisorId },
        select: { first_name: true, last_name: true },
      });
      advisorName = advisor
        ? `${advisor.first_name} ${advisor.last_name}`.trim()
        : null;
    }

    return {
      id: chat.id,
      subject: chat.subject,
      clientId: chat.clientId,
      clientName: client
        ? `${client.first_name} ${client.last_name}`.trim()
        : chat.clientId,
      advisorId: chat.advisorId,
      advisorName,
      status: chat.status,
      createdAt: chat.createdAt,
      updatedAt: chat.updatedAt,
    };
  }
}
