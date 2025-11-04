import { MessageRead } from '@lehman-brothers/domain';

export interface MessageReadRepository {
  save(messageRead: MessageRead): Promise<void>;
  findByMessageId(messageId: string): Promise<MessageRead[]>;
  findByUserIdAndChatId(userId: string, chatId: string): Promise<MessageRead[]>;
  hasRead(messageId: string, userId: string): Promise<boolean>;
  markMultipleAsRead(messageIds: string[], userId: string): Promise<void>;
}
