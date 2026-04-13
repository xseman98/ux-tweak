import { Test } from '@nestjs/testing'
import { ChatGateway } from './chat.gateway'
import { SessionService } from '../session/session.service'
import { MessagesService } from '../messages/messages.service'

describe('ChatGateway', () => {
  let gateway: ChatGateway
  let sessionService: { createSession: jest.Mock }
  let messagesService: { createMessage: jest.Mock }
  let mockServer: { emit: jest.Mock }
  let mockClient: { emit: jest.Mock }

  beforeEach(async () => {
    sessionService = { createSession: jest.fn() }
    messagesService = { createMessage: jest.fn() }
    mockServer = { emit: jest.fn() }
    mockClient = { emit: jest.fn() }

    const module = await Test.createTestingModule({
      providers: [
        ChatGateway,
        { provide: SessionService, useValue: sessionService },
        { provide: MessagesService, useValue: messagesService },
      ],
    }).compile()

    gateway = module.get(ChatGateway)
    gateway.server = mockServer as any
  })

  describe('handleJoin', () => {
    it('returns sessionId for valid nickname', async () => {
      sessionService.createSession.mockResolvedValue({ id: 'sess1', nickname: 'Alice', createdAt: new Date() })

      const result = await gateway.handleJoin({ nickname: 'Alice' }, mockClient as any)

      expect(sessionService.createSession).toHaveBeenCalledWith('Alice')
      expect(result).toEqual({ sessionId: 'sess1' })
      expect(mockClient.emit).not.toHaveBeenCalled()
    })

    it('emits error for empty nickname', async () => {
      await gateway.handleJoin({ nickname: '' }, mockClient as any)

      expect(mockClient.emit).toHaveBeenCalledWith('error', { message: 'Nickname is required' })
      expect(sessionService.createSession).not.toHaveBeenCalled()
    })

    it('emits error for whitespace nickname', async () => {
      await gateway.handleJoin({ nickname: '   ' }, mockClient as any)

      expect(mockClient.emit).toHaveBeenCalledWith('error', { message: 'Nickname is required' })
      expect(sessionService.createSession).not.toHaveBeenCalled()
    })

    it('emits error for nickname over 50 chars', async () => {
      await gateway.handleJoin({ nickname: 'a'.repeat(51) }, mockClient as any)

      expect(mockClient.emit).toHaveBeenCalledWith('error', { message: 'Nickname must be 50 characters or less' })
      expect(sessionService.createSession).not.toHaveBeenCalled()
    })
  })

  describe('handleMessage', () => {
    it('persists message and broadcasts message:new', async () => {
      const createdAt = new Date()
      const mockMessage = { id: 'msg1', sessionId: 'sess1', content: 'hello', createdAt }
      messagesService.createMessage.mockResolvedValue(mockMessage)

      await gateway.handleMessage({ sessionId: 'sess1', content: 'hello' }, mockClient as any)

      expect(messagesService.createMessage).toHaveBeenCalledWith('sess1', 'hello')
      expect(mockServer.emit).toHaveBeenCalledWith('message:new', {
        id: 'msg1',
        sessionId: 'sess1',
        content: 'hello',
        createdAt,
      })
      expect(mockClient.emit).not.toHaveBeenCalled()
    })

    it('emits error for empty content', async () => {
      await gateway.handleMessage({ sessionId: 'sess1', content: '' }, mockClient as any)

      expect(mockClient.emit).toHaveBeenCalledWith('error', { message: 'Message content is required' })
      expect(messagesService.createMessage).not.toHaveBeenCalled()
    })

    it('emits error for whitespace content', async () => {
      await gateway.handleMessage({ sessionId: 'sess1', content: '   ' }, mockClient as any)

      expect(mockClient.emit).toHaveBeenCalledWith('error', { message: 'Message content is required' })
      expect(messagesService.createMessage).not.toHaveBeenCalled()
    })

    it('emits error for content over 500 chars', async () => {
      await gateway.handleMessage({ sessionId: 'sess1', content: 'a'.repeat(501) }, mockClient as any)

      expect(mockClient.emit).toHaveBeenCalledWith('error', { message: 'Message must be 500 characters or less' })
      expect(messagesService.createMessage).not.toHaveBeenCalled()
    })
  })
})
