import { WebSocketGateway, SubscribeMessage, MessageBody, WebSocketServer, ConnectedSocket } from '@nestjs/websockets'
import { Server, Socket } from 'socket.io'
import { SessionService } from '../session/session.service'
import { MessagesService } from '../messages/messages.service'

@WebSocketGateway({ cors: true })
export class ChatGateway {
  @WebSocketServer()
  server!: Server

  constructor(
    private sessionService: SessionService,
    private messagesService: MessagesService,
  ) {}

  private emitError(client: Socket, message: string, code: string) {
    client.emit('error', { message, code })
  }

  @SubscribeMessage('session:join')
  async handleJoin(@MessageBody() data: { nickname: string }, @ConnectedSocket() client: Socket) {
    if (!data.nickname || data.nickname.trim().length === 0) {
      this.emitError(client, 'Nickname is required', 'NICKNAME_REQUIRED')
      return
    }
    if (data.nickname.trim().length > 50) {
      this.emitError(client, 'Nickname must be 50 characters or less', 'NICKNAME_TOO_LONG')
      return
    }
    const session = await this.sessionService.createSession(data.nickname.trim())
    const recentMessages = await this.messagesService.getRecentMessages()

    client.emit('session:joined', {
      sessionId: session.id,
      nickname: session.nickname,
      messages: recentMessages,
    })

    return { sessionId: session.id, messages: recentMessages }
  }

  @SubscribeMessage('session:resume')
  async handleResume(@MessageBody() data: { sessionId: string }, @ConnectedSocket() client: Socket) {
    if (!data.sessionId) {
      this.emitError(client, 'Session is required', 'SESSION_REQUIRED')
      return
    }

    const session = await this.sessionService.resumeSession(data.sessionId)
    if (!session) {
      this.emitError(client, 'Session is not valid', 'SESSION_INVALID')
      return
    }

    const recentMessages = await this.messagesService.getRecentMessages()
    client.emit('session:resumed', {
      sessionId: session.id,
      nickname: session.nickname,
      messages: recentMessages,
    })

    return { sessionId: session.id, nickname: session.nickname, messages: recentMessages }
  }

  @SubscribeMessage('message:send')
  async handleMessage(@MessageBody() data: { sessionId: string; content: string }, @ConnectedSocket() client: Socket) {
    if (!data.content || data.content.trim().length === 0) {
      this.emitError(client, 'Message content is required', 'MESSAGE_REQUIRED')
      return
    }
    if (data.content.trim().length > 500) {
      this.emitError(client, 'Message must be 500 characters or less', 'MESSAGE_TOO_LONG')
      return
    }
    const message = await this.messagesService.createMessage(data.sessionId, data.content.trim())
    this.server.emit('message:new', {
      id: message.id,
      sessionId: message.sessionId,
      content: message.content,
      createdAt: message.createdAt,
      nickname: message.session.nickname,
    })
  }

  @SubscribeMessage('messages:sync')
  async handleSync(@MessageBody() data: { afterMessageId?: string }, @ConnectedSocket() client: Socket) {
    const messages = await this.messagesService.getMessagesAfter(data?.afterMessageId)
    const payload = { messages }
    client.emit('messages:synced', payload)
    return payload
  }
}
