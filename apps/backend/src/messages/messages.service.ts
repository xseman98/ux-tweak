import { Injectable } from '@nestjs/common'
import { PrismaService } from '../prisma/prisma.service'

@Injectable()
export class MessagesService {
  constructor(private prisma: PrismaService) {}

  createMessage(sessionId: string, content: string) {
    return this.prisma.message.create({
      data: { sessionId, content },
      include: { session: { select: { nickname: true } } },
    })
  }

  async getRecentMessages(limit = 30) {
    const messages = await this.prisma.message.findMany({
      take: limit,
      orderBy: { createdAt: 'desc' },
      include: { session: { select: { nickname: true } } },
    })

    return messages.reverse().map((message) => ({
      id: message.id,
      sessionId: message.sessionId,
      content: message.content,
      createdAt: message.createdAt,
      nickname: message.session.nickname,
    }))
  }
}
