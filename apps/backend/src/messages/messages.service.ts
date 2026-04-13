import { Injectable } from '@nestjs/common'
import { PrismaService } from '../prisma/prisma.service'

@Injectable()
export class MessagesService {
  constructor(private prisma: PrismaService) {}

  createMessage(sessionId: string, content: string) {
    return this.prisma.message.create({ data: { sessionId, content } })
  }
}
