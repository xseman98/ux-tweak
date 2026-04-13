import { Test } from '@nestjs/testing'
import { MessagesService } from './messages.service'
import { PrismaService } from '../prisma/prisma.service'

describe('MessagesService', () => {
  let service: MessagesService
  let prisma: { message: { create: jest.Mock } }

  beforeEach(async () => {
    prisma = { message: { create: jest.fn() } }
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
    const mockMessage = { id: 'msg1', sessionId: 'sess1', content: 'hello', createdAt: new Date() }
    prisma.message.create.mockResolvedValue(mockMessage)

    const result = await service.createMessage('sess1', 'hello')

    expect(prisma.message.create).toHaveBeenCalledWith({ data: { sessionId: 'sess1', content: 'hello' } })
    expect(result).toEqual(mockMessage)
  })
})
