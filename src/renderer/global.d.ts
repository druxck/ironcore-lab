import type { IpcChannel, IpcRequest, IpcResponse } from '@shared/ipc-contract'
import type { IpcEvent, IpcEventMap } from '@shared/setup-types'

declare global {
  interface Window {
    lab: {
      invoke<C extends IpcChannel>(channel: C, request: IpcRequest<C>): Promise<IpcResponse<C>>
      on<E extends IpcEvent>(channel: E, listener: (payload: IpcEventMap[E]) => void): () => void
    }
  }
}

export {}
