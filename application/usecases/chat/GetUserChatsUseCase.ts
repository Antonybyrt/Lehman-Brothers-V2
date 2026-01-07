import { ChatRepository, UserViewRepository, MessageRepository } from '../../repositories';
import { UserRole } from '@lehman-brothers/domain/values/UserRole';
import { exhaustive } from 'exhaustive';

export interface GetUserChatsRequest {
  readonly userId: string;
  readonly userRole: string;
}

export interface GetUserChatsResponse {
  readonly success: boolean;
  readonly chats?: Array<{
    readonly id: string;
    readonly subject: string;
    readonly clientId: string;
    readonly clientName: string;
    readonly advisorId: string | null;
    readonly advisorName?: string;
    readonly status: string;
    readonly priority: string;
    readonly createdAt: string;
    readonly updatedAt: string;
    readonly lastMessage: string | null;
    readonly lastMessageAt: string | null;
    readonly lastMessageAuthorId: string | null;
  }>;
  readonly error?: string;
  readonly errorType?: 'server';
}

export class GetUserChatsUseCase {
  constructor(
    private readonly chatRepository: ChatRepository,
    private readonly userViewRepository: UserViewRepository,
    private readonly messageRepository: MessageRepository
  ) { }

  async execute(request: GetUserChatsRequest): Promise<GetUserChatsResponse> {
    try {
      let chats: any[] = [];

      if (request.userRole === UserRole.CLIENT) {
        chats = await this.chatRepository.findByClientId(request.userId);
      } else if (request.userRole === UserRole.ADVISOR) {
        const assignedChats = await this.chatRepository.findByAdvisorId(request.userId);
        const unassignedChats = await this.chatRepository.findUnassigned();

        const chatMap = new Map();
        [...assignedChats, ...unassignedChats].forEach(chat => {
          chatMap.set(chat.id, chat);
        });
        chats = Array.from(chatMap.values());
      } else {
        // For other roles (e.g. ADMIN/DIRECTOR), maybe show all or unassigned?
        // The original controller logic defaulted to unassigned for unknown roles.
        chats = await this.chatRepository.findUnassigned();
      }

      const chatsData = await Promise.all(chats.map(async (chat) => {
        const clientName = await this.userViewRepository.getFullNameById(chat.clientId) || 'Unknown Client';

        let advisorName: string | undefined;
        if (chat.advisorId) {
          advisorName = await this.userViewRepository.getFullNameById(chat.advisorId) || 'Unknown Advisor';
        }

        const messages = await this.messageRepository.findByChatId(chat.id, 1);
        const lastMessage = messages.length > 0 ? messages[0] : null;

        return {
          id: chat.id,
          subject: chat.subject,
          clientId: chat.clientId,
          clientName,
          advisorId: chat.advisorId,
          ...(advisorName ? { advisorName } : {}),
          status: chat.status,
          priority: chat.priority,
          createdAt: chat.createdAt.toISOString(),
          updatedAt: chat.updatedAt.toISOString(),
          lastMessage: lastMessage ? lastMessage.content : null,
          lastMessageAt: lastMessage ? lastMessage.sentAt.toISOString() : null,
          lastMessageAuthorId: lastMessage ? lastMessage.authorId : null,
        };
      }));

      return {
        success: true,
        chats: chatsData
      };
    } catch (error) {
      console.error('[GetUserChatsUseCase] Error getting user chats:', error);
      return {
        success: false,
        error: 'Failed to retrieve chats',
        errorType: 'server'
      };
    }
  }
}
