import { reactive } from 'vue'
import type { ConnectionStatus } from '../chat/types'

const state = reactive({
  status: 'disconnected' as ConnectionStatus,
  error: '',
})

export const connectionStore = {
  state,
  setStatus(status: ConnectionStatus) {
    state.status = status
  },
  setError(error: string) {
    state.error = error
  },
  clearError() {
    state.error = ''
  },
}
