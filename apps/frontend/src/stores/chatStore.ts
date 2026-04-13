import { reactive } from 'vue'
import type { ChatMessage } from '../chat/types'

const state = reactive({
  messages: [] as ChatMessage[],
  newlySyncedMessageIds: [] as string[],
})

export const chatStore = {
  state,
  lastMessageId() {
    return state.messages.at(-1)?.id || ''
  },
  setMessages(messages: ChatMessage[]) {
    const merged = [...messages]
    merged.sort((a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime())
    state.messages = merged
    state.newlySyncedMessageIds = []
  },
  addMessage(message: ChatMessage) {
    this.mergeMessages([message])
  },
  mergeMessages(messages: ChatMessage[], options?: { markAsNew?: boolean }) {
    const existingIds = new Set(state.messages.map((message) => message.id))
    const byId = new Map(state.messages.map((message) => [message.id, message]))
    for (const message of messages) {
      byId.set(message.id, message)
    }
    state.messages = Array.from(byId.values()).sort(
      (a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime(),
    )

    if (options?.markAsNew) {
      const incomingNewIds = messages.filter((message) => !existingIds.has(message.id)).map((message) => message.id)
      const markers = new Set(state.newlySyncedMessageIds)
      for (const id of incomingNewIds) {
        markers.add(id)
      }
      state.newlySyncedMessageIds = Array.from(markers)
    }
  },
  markNewSince(knownIds: Set<string>) {
    const markers = new Set(state.newlySyncedMessageIds)
    for (const msg of state.messages) {
      if (!knownIds.has(msg.id)) {
        markers.add(msg.id)
      }
    }
    state.newlySyncedMessageIds = Array.from(markers)
  },
  clearNewMessageMarkers() {
    state.newlySyncedMessageIds = []
  },
  clear() {
    state.messages = []
    state.newlySyncedMessageIds = []
  },
}
