import { Injectable } from '@nestjs/common'
import { PrismaService } from '../prisma/prisma.service'

@Injectable()
export class MessagesService {
  constructor(private prisma: PrismaService) {}

  private mapMessage(message: {
    id: string
    sessionId: string
    content: string
    createdAt: Date
    session: { nickname: string }
  }) {
    return {
      id: message.id,
      sessionId: message.sessionId,
      content: message.content,
      createdAt: message.createdAt,
      nickname: message.session.nickname,
    }
  }

  createMessage(sessionId: string, content: string) {
    return (this.prisma as any).message.create({
      data: { sessionId, content },
      include: { session: { select: { nickname: true } } },
    })
  }

  async getRecentMessages(limit = 30) {
    const messages = await (this.prisma as any).message.findMany({
      take: limit,
      orderBy: { createdAt: 'desc' },
      include: { session: { select: { nickname: true } } },
    })

    return messages.reverse().map((message: any) => this.mapMessage(message))
  }

  async getMessagesAfter(afterMessageId?: string, fallbackLimit = 30) {
    if (!afterMessageId) {
      return this.getRecentMessages(fallbackLimit)
    }

    const anchorMessage = await (this.prisma as any).message.findUnique({
      where: { id: afterMessageId },
      select: { createdAt: true },
    })

    if (!anchorMessage) {
      return this.getRecentMessages(fallbackLimit)
    }

    const messages = await (this.prisma as any).message.findMany({
      where: { createdAt: { gt: anchorMessage.createdAt } },
      orderBy: { createdAt: 'asc' },
      take: fallbackLimit,
      include: { session: { select: { nickname: true } } },
    })

    return messages.map((message: any) => this.mapMessage(message))
  }
}
