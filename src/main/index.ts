import { app, BrowserWindow, ipcMain, screen, Menu } from 'electron'
import { join } from 'path'
import { existsSync, readFileSync, writeFileSync } from 'fs'

function statePath(): string {
  return join(app.getPath('userData'), 'mimo-state.json')
}

function loadState(): unknown {
  try {
    const p = statePath()
    if (existsSync(p)) return JSON.parse(readFileSync(p, 'utf-8'))
  } catch {}
  return null
}

function saveState(data: unknown): void {
  try {
    writeFileSync(statePath(), JSON.stringify(data, null, 2))
  } catch {}
}

let mainWindow: BrowserWindow | null = null

function createWindow(): void {
  const { x, y, width, height } = screen.getPrimaryDisplay().bounds

  mainWindow = new BrowserWindow({
    x,
    y,
    width,
    height,
    transparent: true,
    frame: false,
    alwaysOnTop: true,
    skipTaskbar: true,
    resizable: false,
    movable: false,
    hasShadow: false,
    webPreferences: {
      preload: join(__dirname, '../preload/index.js'),
      contextIsolation: true,
      nodeIntegration: false,
    },
  })

  // Stay above all windows; visible on every macOS Space
  mainWindow.setAlwaysOnTop(true, 'floating')
  mainWindow.setVisibleOnAllWorkspaces(true, { visibleOnFullScreen: true })
  // Pass mouse events through transparent areas by default
  mainWindow.setIgnoreMouseEvents(true, { forward: true })

  if (process.env.ELECTRON_RENDERER_URL) {
    mainWindow.loadURL(process.env.ELECTRON_RENDERER_URL)
  } else {
    mainWindow.loadFile(join(__dirname, '../renderer/index.html'))
  }
}

app.whenReady().then(() => {
  createWindow()

  // Toggle hit-test so only the pet region captures mouse events
  ipcMain.on('set-ignore-mouse', (_, ignore: boolean) => {
    mainWindow?.setIgnoreMouseEvents(ignore, { forward: true })
  })

  ipcMain.handle('load-state', () => loadState())
  ipcMain.on('save-state', (_, data) => saveState(data))
  ipcMain.handle('get-screen-bounds', () => screen.getPrimaryDisplay().bounds)
  ipcMain.on('quit', () => app.quit())

  ipcMain.on('show-context-menu', (event) => {
    const win = BrowserWindow.fromWebContents(event.sender)
    const menu = Menu.buildFromTemplate([
      { label: '🐾 Mimo', enabled: false },
      { type: 'separator' },
      { label: '🔄 Next Persona', click: () => win?.webContents.send('next-persona') },
      { type: 'separator' },
      { label: 'Quit Mimo', click: () => app.quit() },
    ])
    if (win) menu.popup({ window: win })
  })
})

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') app.quit()
})
