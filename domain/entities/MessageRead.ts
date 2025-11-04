interface MessageReadProps {
  messageId: string;
  userId: string;
  readAt: Date;
}

export class MessageRead {
  private constructor(private readonly props: MessageReadProps) { }

  static create(params: { messageId: string; userId: string }): MessageRead {
    return new MessageRead({
      messageId: params.messageId,
      userId: params.userId,
      readAt: new Date(),
    });
  }

  static fromPersistence(data: {
    message_id: string;
    user_id: string;
    read_at: Date;
  }): MessageRead {
    return new MessageRead({
      messageId: data.message_id,
      userId: data.user_id,
      readAt: data.read_at,
    });
  }

  toPersistence(): {
    message_id: string;
    user_id: string;
    read_at: Date;
  } {
    return {
      message_id: this.props.messageId,
      user_id: this.props.userId,
      read_at: this.props.readAt,
    };
  }

  get messageId(): string {
    return this.props.messageId;
  }

  get userId(): string {
    return this.props.userId;
  }

  get readAt(): Date {
    return this.props.readAt;
  }
}
