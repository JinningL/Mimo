import { contextBridge, ipcRenderer } from 'electron'

contextBridge.exposeInMainWorld('mimo', {
  setIgnoreMouse: (ignore: boolean) =>
    ipcRenderer.send('set-ignore-mouse', ignore),

  loadState: () => ipcRenderer.invoke('load-state'),

  saveState: (data: unknown) => ipcRenderer.send('save-state', data),

  getScreenBounds: (): Promise<{ x: number; y: number; width: number; height: number }> =>
    ipcRenderer.invoke('get-screen-bounds'),

  quit: () => ipcRenderer.send('quit'),
  showContextMenu: () => ipcRenderer.send('show-context-menu'),

  onNextPersona: (cb: () => void) => ipcRenderer.on('next-persona', cb),
})
