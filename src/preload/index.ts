import { contextBridge, ipcRenderer } from 'electron'
import type { IpcChannel, IpcRequest, IpcResponse } from '@shared/ipc-contract'
import type { IpcEvent, IpcEventMap } from '@shared/setup-types'

const labApi = {
  invoke<C extends IpcChannel>(channel: C, request: IpcRequest<C>): Promise<IpcResponse<C>> {
    return ipcRenderer.invoke(channel, request)
  },
  /**
   * Subscribes to a main -> renderer push event (progress updates for a
   * background install, as opposed to the request/response invoke() calls
   * above). Returns an unsubscribe function.
   */
  on<E extends IpcEvent>(channel: E, listener: (payload: IpcEventMap[E]) => void): () => void {
    const wrapped = (_event: Electron.IpcRendererEvent, payload: IpcEventMap[E]): void => listener(payload)
    ipcRenderer.on(channel, wrapped)
    return () => ipcRenderer.removeListener(channel, wrapped)
  }
}

contextBridge.exposeInMainWorld('lab', labApi)

export type LabApi = typeof labApi
