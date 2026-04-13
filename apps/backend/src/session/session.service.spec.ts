import { Test } from '@nestjs/testing'
import { SessionService } from './session.service'
import { PrismaService } from '../prisma/prisma.service'

describe('SessionService', () => {
  let service: SessionService
  let prisma: { userSession: { create: jest.Mock } }

  beforeEach(async () => {
    prisma = { userSession: { create: jest.fn() } }
    const module = await Test.createTestingModule({
      providers: [
        SessionService,
        { provide: PrismaService, useValue: prisma },
      ],
    }).compile()
    service = module.get(SessionService)
  })

  it('should be defined', () => {
    expect(service).toBeDefined()
  })

  it('creates a user session with given nickname', async () => {
    const mockSession = { id: 'cuid1', nickname: 'Alice', createdAt: new Date() }
    prisma.userSession.create.mockResolvedValue(mockSession)

    const result = await service.createSession('Alice')

    expect(prisma.userSession.create).toHaveBeenCalledWith({ data: { nickname: 'Alice' } })
    expect(result).toEqual(mockSession)
  })
})
