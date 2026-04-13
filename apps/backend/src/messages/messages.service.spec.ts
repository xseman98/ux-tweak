import { Test } from '@nestjs/testing'
import { MessagesService } from './messages.service'
import { PrismaService } from '../prisma/prisma.service'

describe('MessagesService', () => {
  let service: MessagesService
  let prisma: { message: { create: jest.Mock; findMany: jest.Mock; findUnique: jest.Mock } }

  beforeEach(async () => {
    prisma = { message: { create: jest.fn(), findMany: jest.fn(), findUnique: jest.fn() } }
    const module = await Test.createTestingModule({
      providers: [
        MessagesService,
        { provide: PrismaService, useValue: prisma },
      ],
    }).compile()
    service = module.get(MessagesService)
  })

  it('should be defined', () => {
    expect(service).toBeDefined()
  })

  it('creates a message with given sessionId and content', async () => {
    const mockMessage = {
      id: 'msg1',
      sessionId: 'sess1',
      content: 'hello',
      createdAt: new Date(),
      session: { nickname: 'Alice' },
    }
    prisma.message.create.mockResolvedValue(mockMessage)

    const result = await service.createMessage('sess1', 'hello')

    expect(prisma.message.create).toHaveBeenCalledWith({
      data: { sessionId: 'sess1', content: 'hello' },
      include: { session: { select: { nickname: true } } },
    })
    expect(result).toEqual(mockMessage)
  })

  it('returns recent messages sorted ascending by time', async () => {
    const first = {
      id: 'msg1',
      sessionId: 'sess1',
      content: 'first',
      createdAt: new Date('2024-01-01'),
      session: { nickname: 'Alice' },
    }
    const second = {
      id: 'msg2',
      sessionId: 'sess1',
      content: 'second',
      createdAt: new Date('2024-01-02'),
      session: { nickname: 'Bob' },
    }
    prisma.message.findMany.mockResolvedValue([second, first])

    const result = await service.getRecentMessages(2)

    expect(prisma.message.findMany).toHaveBeenCalledWith({
      take: 2,
      orderBy: { createdAt: 'desc' },
      include: { session: { select: { nickname: true } } },
    })
    expect(result).toEqual([
      { id: 'msg1', sessionId: 'sess1', content: 'first', createdAt: new Date('2024-01-01'), nickname: 'Alice' },
      { id: 'msg2', sessionId: 'sess1', content: 'second', createdAt: new Date('2024-01-02'), nickname: 'Bob' },
    ])
  })

  it('returns messages after the given message id', async () => {
    const anchor = { id: 'msg2', createdAt: new Date('2024-01-02') }
    const nextMessage = {
      id: 'msg3',
      sessionId: 'sess1',
      content: 'third',
      createdAt: new Date('2024-01-03'),
      session: { nickname: 'Alice' },
    }
    prisma.message.findUnique = jest.fn().mockResolvedValue(anchor)
    prisma.message.findMany.mockResolvedValue([nextMessage])

    const result = await service.getMessagesAfter('msg2', 30)

    expect(prisma.message.findUnique).toHaveBeenCalledWith({
      where: { id: 'msg2' },
      select: { createdAt: true },
    })
    expect(prisma.message.findMany).toHaveBeenCalledWith({
      where: { createdAt: { gt: anchor.createdAt } },
      orderBy: { createdAt: 'asc' },
      take: 30,
      include: { session: { select: { nickname: true } } },
    })
    expect(result).toEqual([
      {
        id: 'msg3',
        sessionId: 'sess1',
        content: 'third',
        createdAt: new Date('2024-01-03'),
        nickname: 'Alice',
      },
    ])
  })

  it('falls back to recent messages if afterMessageId is invalid', async () => {
    prisma.message.findUnique = jest.fn().mockResolvedValue(null)
    prisma.message.findMany.mockResolvedValue([])

    await service.getMessagesAfter('missing', 20)

    expect(prisma.message.findMany).toHaveBeenCalledWith({
      take: 20,
      orderBy: { createdAt: 'desc' },
      include: { session: { select: { nickname: true } } },
    })
  })
})
