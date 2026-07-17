import type { IpcChannel, IpcRequest, IpcResponse } from '@shared/ipc-contract'

declare global {
  interface Window {
    lab: {
      invoke<C extends IpcChannel>(channel: C, request: IpcRequest<C>): Promise<IpcResponse<C>>
    }
  }
}

export {}
