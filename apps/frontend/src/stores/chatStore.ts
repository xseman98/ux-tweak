import { reactive } from 'vue'
import type { ChatMessage } from '../chat/types'

const state = reactive({
  messages: [] as ChatMessage[],
})

export const chatStore = {
  state,
  setMessages(messages: ChatMessage[]) {
    state.messages = [...messages].sort((a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime())
  },
  addMessage(message: ChatMessage) {
    state.messages.push(message)
    state.messages.sort((a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime())
  },
  clear() {
    state.messages = []
  },
}
