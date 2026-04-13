import { Module } from '@nestjs/common'
import { MessagesModule } from '../messages/messages.module'
import { SessionModule } from '../session/session.module'
import { ChatGateway } from './chat.gateway'

@Module({
  imports: [SessionModule, MessagesModule],
  providers: [ChatGateway],
})
export class ChatModule {}
