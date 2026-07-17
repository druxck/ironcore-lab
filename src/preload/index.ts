import { contextBridge, ipcRenderer } from 'electron'
import type { IpcChannel, IpcRequest, IpcResponse } from '@shared/ipc-contract'

const labApi = {
  invoke<C extends IpcChannel>(channel: C, request: IpcRequest<C>): Promise<IpcResponse<C>> {
    return ipcRenderer.invoke(channel, request)
  }
}

contextBridge.exposeInMainWorld('lab', labApi)

export type LabApi = typeof labApi
