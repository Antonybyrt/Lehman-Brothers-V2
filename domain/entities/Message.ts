import { Result } from '../values/Result';
import { MessageContent } from '../values/MessageContent';
import {
  MessageNotFoundError,
  InvalidMessageContentError,
  MessageAlreadyDeletedError,
} from '../errors';

interface MessageProps {
  id: string;
  chatId: string;
  authorId: string;
  content: MessageContent;
  attachmentUrl: string | null;
  edited: boolean;
  deleted: boolean;
  sentAt: Date;
  updatedAt: Date;
}

export class Message {
  private constructor(private readonly props: MessageProps) { }

  // Factory method: créer un nouveau message
  static create(params: {
    id: string;
    chatId: string;
    authorId: string;
    content: string;
    attachmentUrl?: string | null;
  }): Result<Message, Error> {
    try {
      // Créer le value object MessageContent (validation incluse)
      const contentResult = MessageContent.create(params.content);
      if (!contentResult.isSuccess()) {
        return Result.failure(contentResult.getError());
      }

      const message = new Message({
        id: params.id,
        chatId: params.chatId,
        authorId: params.authorId,
        content: contentResult.getValue(),
        attachmentUrl: params.attachmentUrl || null,
        edited: false,
        deleted: false,
        sentAt: new Date(),
        updatedAt: new Date(),
      });

      return Result.success(message);
    } catch (error) {
      return Result.failure(error as Error);
    }
  }

  // Factory method: reconstituer depuis la persistance
  static fromPersistence(data: {
    id: string;
    chat_id: string;
    author_id: string;
    content: string;
    attachment_url: string | null;
    edited: boolean;
    deleted: boolean;
    sent_at: Date;
    updated_at: Date;
  }): Message {
    // On suppose que les données de la DB sont valides
    const contentResult = MessageContent.create(data.content);
    if (!contentResult.isSuccess()) {
      throw new Error('Invalid content from database');
    }

    return new Message({
      id: data.id,
      chatId: data.chat_id,
      authorId: data.author_id,
      content: contentResult.getValue(),
      attachmentUrl: data.attachment_url,
      edited: data.edited,
      deleted: data.deleted,
      sentAt: data.sent_at,
      updatedAt: data.updated_at,
    });
  }

  // Convertir vers le format persistance
  toPersistence(): {
    id: string;
    chat_id: string;
    author_id: string;
    content: string;
    attachment_url: string | null;
    edited: boolean;
    deleted: boolean;
    sent_at: Date;
    updated_at: Date;
  } {
    return {
      id: this.props.id,
      chat_id: this.props.chatId,
      author_id: this.props.authorId,
      content: this.props.content.getValue(),
      attachment_url: this.props.attachmentUrl,
      edited: this.props.edited,
      deleted: this.props.deleted,
      sent_at: this.props.sentAt,
      updated_at: this.props.updatedAt,
    };
  }

  // Règle métier: éditer le message
  edit(newContent: string): Result<Message, Error> {
    if (this.props.deleted) {
      return Result.failure(new MessageAlreadyDeletedError(this.props.id));
    }

    const contentResult = MessageContent.create(newContent);
    if (!contentResult.isSuccess()) {
      return Result.failure(contentResult.getError());
    }

    const updatedMessage = new Message({
      ...this.props,
      content: contentResult.getValue(),
      edited: true,
      updatedAt: new Date(),
    });

    return Result.success(updatedMessage);
  }

  // Règle métier: supprimer le message (soft delete)
  delete(): Result<Message, Error> {
    if (this.props.deleted) {
      return Result.failure(new MessageAlreadyDeletedError(this.props.id));
    }

    const deletedContentResult = MessageContent.create('[Message supprimé]');
    if (!deletedContentResult.isSuccess()) {
      throw new Error('Failed to create deleted content marker');
    }

    const updatedMessage = new Message({
      ...this.props,
      deleted: true,
      content: deletedContentResult.getValue(),
      updatedAt: new Date(),
    });

    return Result.success(updatedMessage);
  }

  // Getters
  get id(): string {
    return this.props.id;
  }

  get chatId(): string {
    return this.props.chatId;
  }

  get authorId(): string {
    return this.props.authorId;
  }

  get content(): string {
    return this.props.content.getValue();
  }

  get attachmentUrl(): string | null {
    return this.props.attachmentUrl;
  }

  get edited(): boolean {
    return this.props.edited;
  }

  get deleted(): boolean {
    return this.props.deleted;
  }

  get sentAt(): Date {
    return this.props.sentAt;
  }

  get updatedAt(): Date {
    return this.props.updatedAt;
  }

  // Règle métier: vérifier si l'utilisateur peut éditer/supprimer le message
  canModify(userId: string): boolean {
    return this.props.authorId === userId && !this.props.deleted;
  }
}
