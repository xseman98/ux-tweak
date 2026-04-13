import { Module } from '@nestjs/common'
import { MessagesModule } from '../messages/messages.module'
import { SessionModule } from '../session/session.module'

@Module({
  imports: [SessionModule, MessagesModule],
})
export class ChatModule {}
