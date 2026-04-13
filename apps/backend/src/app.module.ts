import { Module } from '@nestjs/common'
import { ConfigModule } from '@nestjs/config'
import { envValidationSchema } from './config/env.validation'
import { PrismaModule } from './prisma/prisma.module'
import { HealthModule } from './health/health.module'
import { SessionModule } from './session/session.module'
import { MessagesModule } from './messages/messages.module'
import { ChatModule } from './chat/chat.module'

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      validationSchema: envValidationSchema,
    }),
    PrismaModule,
    HealthModule,
    SessionModule,
    MessagesModule,
    ChatModule,
  ],
})
export class AppModule {}
