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

  @SubscribeMessage('session:join')
  async handleJoin(@MessageBody() data: { nickname: string }, @ConnectedSocket() client: Socket) {
    if (!data.nickname || data.nickname.trim().length === 0) {
      client.emit('error', { message: 'Nickname is required' })
      return
    }
    if (data.nickname.trim().length > 50) {
      client.emit('error', { message: 'Nickname must be 50 characters or less' })
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
      client.emit('error', { message: 'Session is required' })
      return
    }

    const session = await this.sessionService.resumeSession(data.sessionId)
    if (!session) {
      client.emit('error', { message: 'Session is not valid' })
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
      client.emit('error', { message: 'Message content is required' })
      return
    }
    if (data.content.trim().length > 500) {
      client.emit('error', { message: 'Message must be 500 characters or less' })
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
}
