import { Chat } from '@lehman-brothers/domain';
import { ChatRepository, UserRepository, ChatViewRepository } from '../../repositories';
import { ChatNotificationService } from '../../services';
import { UserNotFoundError, InvalidUserRoleError, ValidationError } from '@lehman-brothers/domain';
import { exhaustive } from 'exhaustive';

export interface CreateChatRequest {
  readonly clientId: string;
  readonly subject: string;
  readonly creatorRole?: string; // Role of the user creating the chat (CLIENT or ADVISOR)
  readonly creatorId?: string; // ID of the user creating the chat (to auto-assign advisor)
}

export interface CreateChatResponse {
  readonly success: boolean;
  readonly chatId?: string;
  readonly subject?: string;
  readonly error?: string;
  readonly errorType?: 'validation' | 'not_found' | 'server';
}

/**
 * Create a new chat
 * Business rules: Validates user exists and is CLIENT, creates chat with OPEN status, sends notifications
 */
export class CreateChatUseCase {
  constructor(
    private readonly chatRepository: ChatRepository,
    private readonly userRepository: UserRepository,
    private readonly chatViewRepository: ChatViewRepository,
    private readonly notificationService: ChatNotificationService
  ) { }

  async execute(request: CreateChatRequest): Promise<CreateChatResponse> {
    if (!this.isValidRequest(request)) {
      return {
        success: false,
        error: 'Client ID and subject are required',
        errorType: 'validation'
      };
    }

    try {
      const client = await this.userRepository.findById(request.clientId);
      if (!client) {
        throw new UserNotFoundError(request.clientId);
      }

      const clientRole = client.getRole().getValue();
      if (clientRole !== 'CLIENT') {
        throw new InvalidUserRoleError(clientRole, ['CLIENT']);
      }

      const advisorId = (request.creatorRole === 'ADVISOR' || request.creatorRole === 'DIRECTOR') && request.creatorId
        ? request.creatorId
        : null;

      const chatResult = Chat.create({
        id: crypto.randomUUID(),
        subject: request.subject,
        clientId: request.clientId,
        advisorId: advisorId,
      });

      if (!chatResult.isSuccess()) {
        throw chatResult.getError();
      }

      const chat = chatResult.getValue();

      await this.chatRepository.save(chat);

      const chatView = await this.chatViewRepository.findByIdWithNames(chat.id);

      if (chatView) {
        const chatPayload = {
          chatId: chatView.id,
          subject: chatView.subject,
          clientId: chatView.clientId,
          clientName: chatView.clientName,
          advisorId: chatView.advisorId || undefined,
          advisorName: chatView.advisorName || undefined,
          status: chatView.status,
          createdAt: chatView.createdAt.toISOString(),
        };

        await this.notificationService.notifyRole('ADVISOR', 'chat:created', chatPayload);

        const shouldNotifyClient = request.creatorRole === 'ADVISOR' || request.creatorRole === 'DIRECTOR';
        if (shouldNotifyClient) {
          await this.notificationService.notifyUser(chat.clientId, 'chat:created', chatPayload);
        }
      }

      return {
        success: true,
        chatId: chat.id,
        subject: chat.subject,
      };
    } catch (error) {
      if (error instanceof UserNotFoundError) {
        return {
          success: false,
          error: error.message,
          errorType: 'not_found'
        };
      }
      if (error instanceof InvalidUserRoleError || error instanceof ValidationError) {
        return {
          success: false,
          error: error.message,
          errorType: 'validation'
        };
      }
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error occurred',
        errorType: 'server'
      };
    }
  }

  private isValidRequest(request: CreateChatRequest): boolean {
    const hasRequiredFields = request.clientId && request.subject;
    const isValidSubject = request.subject && request.subject.trim().length > 0;

    return exhaustive(String(hasRequiredFields && isValidSubject), {
      'true': () => true,
      'false': () => false
    });
  }
}
