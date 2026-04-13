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
    return { sessionId: session.id }
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
    })
  }
}
