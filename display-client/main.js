const { app, BrowserWindow, Tray, Menu, ipcMain, nativeImage, globalShortcut, dialog } = require('electron');
const path = require('path');
const fs   = require('fs');

const CONFIG_PATH = path.join(app.getPath('userData'), 'wnrmidia-display.json');

let mainWindow = null;
let tray       = null;

// ─── Config persistence ──────────────────────────────────────────────────────

function loadConfig() {
  try { return JSON.parse(fs.readFileSync(CONFIG_PATH, 'utf-8')); }
  catch { return null; }
}

function saveConfig(data) {
  fs.writeFileSync(CONFIG_PATH, JSON.stringify(data, null, 2));
}

// ─── Window factory ──────────────────────────────────────────────────────────

function createSetupWindow() {
  if (mainWindow) { mainWindow.destroy(); mainWindow = null; }

  mainWindow = new BrowserWindow({
    width: 560,
    height: 640,
    resizable: false,
    center: true,
    autoHideMenuBar: true,
    title: 'WNR Mídia — Configuração do Display',
    backgroundColor: '#080d18',
    webPreferences: {
      preload: path.join(__dirname, 'preload.js'),
      nodeIntegration: false,
      contextIsolation: true,
    },
  });

  mainWindow.loadFile(path.join(__dirname, 'renderer', 'setup.html'));
  mainWindow.on('closed', () => { mainWindow = null; });
}

function createPlayerWindow() {
  if (mainWindow) { mainWindow.destroy(); mainWindow = null; }

  mainWindow = new BrowserWindow({
    fullscreen: true,
    autoHideMenuBar: true,
    title: 'WNR Mídia Display',
    backgroundColor: '#000000',
    webPreferences: {
      preload: path.join(__dirname, 'preload.js'),
      nodeIntegration: false,
      contextIsolation: true,
      // Allow autoplay without user gesture (kiosk requirement)
      autoplayPolicy: 'no-user-gesture-required',
    },
  });

  mainWindow.loadFile(path.join(__dirname, 'renderer', 'player.html'));
  mainWindow.on('closed', () => { mainWindow = null; });
}

// ─── Tray ─────────────────────────────────────────────────────────────────────

function createTray() {
  const iconPath = path.join(__dirname, 'assets', 'icon.png');
  const icon = fs.existsSync(iconPath)
    ? nativeImage.createFromPath(iconPath).resize({ width: 16, height: 16 })
    : nativeImage.createEmpty();

  tray = new Tray(icon);
  tray.setToolTip('WNR Mídia Display');

  const rebuild = () => tray.setContextMenu(Menu.buildFromTemplate([
    {
      label: 'WNR Mídia Display',
      enabled: false,
    },
    { type: 'separator' },
    {
      label: 'Reconfigurar Display',
      click: () => createSetupWindow(),
    },
    {
      label: 'Reiniciar Player',
      click: () => {
        const cfg = loadConfig();
        if (cfg && cfg.displayId) createPlayerWindow();
        else createSetupWindow();
      },
    },
    { type: 'separator' },
    {
      label: 'Sair',
      click: () => app.exit(0),
    },
  ]));

  rebuild();
}

// ─── IPC handlers ─────────────────────────────────────────────────────────────

ipcMain.handle('get-config', () => loadConfig());

ipcMain.handle('save-config', (_, config) => {
  saveConfig(config);
  return { success: true };
});

ipcMain.handle('launch-player', () => {
  createPlayerWindow();
  return { success: true };
});

ipcMain.handle('open-setup', () => {
  createSetupWindow();
  return { success: true };
});

// Import a pre-downloaded display config JSON file
ipcMain.handle('import-config-file', async () => {
  const { canceled, filePaths } = await dialog.showOpenDialog({
    title: 'Importar Configuração do Display',
    filters: [{ name: 'Configuração WNR Mídia', extensions: ['json'] }],
    properties: ['openFile'],
  });

  if (canceled || !filePaths.length) {
    return { success: false, reason: 'cancelled' };
  }

  try {
    const raw    = fs.readFileSync(filePaths[0], 'utf-8');
    const config = JSON.parse(raw);

    if (!config.displayId || !config.serverUrl) {
      return { success: false, reason: 'invalid' };
    }

    saveConfig(config);
    createPlayerWindow();
    return { success: true };
  } catch {
    return { success: false, reason: 'parse_error' };
  }
});

// ─── App lifecycle ────────────────────────────────────────────────────────────

app.whenReady().then(() => {
  const config = loadConfig();

  if (config && config.displayId) {
    createPlayerWindow();
  } else {
    createSetupWindow();
  }

  createTray();

  // Ctrl+Shift+F12: dev tools (useful for troubleshooting on-site)
  globalShortcut.register('CommandOrControl+Shift+F12', () => {
    if (mainWindow) mainWindow.webContents.openDevTools();
  });
});

// Keep the app alive in the system tray even when all windows are closed
app.on('window-all-closed', () => {
  // Do not quit — tray keeps the process alive
});

app.on('will-quit', () => {
  globalShortcut.unregisterAll();
});
