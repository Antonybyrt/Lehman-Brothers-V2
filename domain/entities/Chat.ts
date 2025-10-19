import { Result } from '../values/Result';
import { ChatSubject } from '../values/ChatSubject';
import {
  InvalidChatSubjectError,
  ChatAlreadyHasAdvisorError,
  ChatTransferNotAllowedError,
  ChatAlreadyClosedError,
  ChatAlreadyOpenError,
} from '../errors';

export enum ChatStatus {
  OPEN = 'OPEN',
  TRANSFERRED = 'TRANSFERRED',
  CLOSED = 'CLOSED',
}

interface ChatProps {
  id: string;
  subject: ChatSubject;
  clientId: string;
  advisorId: string | null;
  transferredFromId: string | null;
  status: ChatStatus;
  open: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export class Chat {
  private constructor(private readonly props: ChatProps) { }

  static create(params: {
    id: string;
    subject: string;
    clientId: string;
    advisorId?: string | null;
  }): Result<Chat, Error> {
    try {
      const chatSubjectResult = ChatSubject.create(params.subject);
      if (!chatSubjectResult.isSuccess()) {
        return Result.failure(chatSubjectResult.getError());
      }

      const chat = new Chat({
        id: params.id,
        subject: chatSubjectResult.getValue(),
        clientId: params.clientId,
        advisorId: params.advisorId || null,
        transferredFromId: null,
        status: ChatStatus.OPEN,
        open: true,
        createdAt: new Date(),
        updatedAt: new Date(),
      });

      return Result.success(chat);
    } catch (error) {
      return Result.failure(error as Error);
    }
  }

  static fromPersistence(data: {
    id: string;
    subject: string;
    client_id: string;
    advisor_id: string | null;
    transferred_from_id: string | null;
    status: string;
    open: boolean;
    created_at: Date;
    updated_at: Date;
  }): Chat {
    const chatSubjectResult = ChatSubject.create(data.subject);
    if (!chatSubjectResult.isSuccess()) {
      throw new Error('Invalid subject from database');
    }

    return new Chat({
      id: data.id,
      subject: chatSubjectResult.getValue(),
      clientId: data.client_id,
      advisorId: data.advisor_id,
      transferredFromId: data.transferred_from_id,
      status: data.status as ChatStatus,
      open: data.open,
      createdAt: data.created_at,
      updatedAt: data.updated_at,
    });
  }

  toPersistence(): {
    id: string;
    subject: string;
    client_id: string;
    advisor_id: string | null;
    transferred_from_id: string | null;
    status: string;
    open: boolean;
    created_at: Date;
    updated_at: Date;
  } {
    return {
      id: this.props.id,
      subject: this.props.subject.getValue(),
      client_id: this.props.clientId,
      advisor_id: this.props.advisorId,
      transferred_from_id: this.props.transferredFromId,
      status: this.props.status,
      open: this.props.open,
      created_at: this.props.createdAt,
      updated_at: this.props.updatedAt,
    };
  }

  assignAdvisor(advisorId: string): Result<Chat, Error> {
    if (this.props.advisorId) {
      return Result.failure(new ChatAlreadyHasAdvisorError(this.props.id));
    }

    const updatedChat = new Chat({
      ...this.props,
      advisorId,
      updatedAt: new Date(),
    });

    return Result.success(updatedChat);
  }

  transferTo(newAdvisorId: string): Result<Chat, Error> {
    if (!this.props.advisorId) {
      return Result.failure(
        new ChatTransferNotAllowedError(this.props.id, 'No advisor assigned')
      );
    }
    if (this.props.advisorId === newAdvisorId) {
      return Result.failure(
        new ChatTransferNotAllowedError(this.props.id, 'Cannot transfer to the same advisor')
      );
    }

    const updatedChat = new Chat({
      ...this.props,
      transferredFromId: this.props.advisorId,
      advisorId: newAdvisorId,
      status: ChatStatus.OPEN,
      updatedAt: new Date(),
    });

    return Result.success(updatedChat);
  }

  close(): Result<Chat, Error> {
    if (!this.props.open) {
      return Result.failure(new ChatAlreadyClosedError(this.props.id));
    }

    const updatedChat = new Chat({
      ...this.props,
      open: false,
      status: ChatStatus.CLOSED,
      updatedAt: new Date(),
    });

    return Result.success(updatedChat);
  }

  reopen(): Result<Chat, Error> {
    if (this.props.open) {
      return Result.failure(new ChatAlreadyOpenError(this.props.id));
    }

    const updatedChat = new Chat({
      ...this.props,
      open: true,
      status: ChatStatus.OPEN,
      updatedAt: new Date(),
    });

    return Result.success(updatedChat);
  }

  get id(): string {
    return this.props.id;
  }

  get subject(): string {
    return this.props.subject.getValue();
  }

  get clientId(): string {
    return this.props.clientId;
  }

  get advisorId(): string | null {
    return this.props.advisorId;
  }

  get transferredFromId(): string | null {
    return this.props.transferredFromId;
  }

  get status(): ChatStatus {
    return this.props.status;
  }

  get open(): boolean {
    return this.props.open;
  }

  get createdAt(): Date {
    return this.props.createdAt;
  }

  get updatedAt(): Date {
    return this.props.updatedAt;
  }

  hasAccess(userId: string, userRole: string): boolean {
    if (userId === this.props.clientId) {
      return true;
    }

    if (userRole === 'DIRECTOR') {
      return true;
    }

    if (userRole === 'ADVISOR' && userId === this.props.advisorId) {
      return true;
    }

    if (userRole === 'ADVISOR' && !this.props.advisorId) {
      return true;
    }

    return false;
  }
}
