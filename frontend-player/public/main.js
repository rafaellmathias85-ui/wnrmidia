const { app, BrowserWindow, ipcMain, Menu } = require('electron');
const path = require('path');
const fs = require('fs');
const axios = require('axios');
const io = require('socket.io-client');

let mainWindow;
let socket;
let displayData = {
  displayId: null,
  token: null,
  apiUrl: process.env.REACT_APP_API_URL || 'http://localhost:5000/api',
  socketUrl: process.env.REACT_APP_SOCKET_URL || 'http://localhost:5000'
};

// Persist display UUID so playlist assignments survive restarts
function getConfigPath() {
  return path.join(app.getPath('userData'), 'display-config.json');
}

function loadDisplayId() {
  try {
    const configPath = getConfigPath();
    if (fs.existsSync(configPath)) {
      const config = JSON.parse(fs.readFileSync(configPath, 'utf8'));
      return config.displayId || null;
    }
  } catch {}
  return null;
}

function saveDisplayId(id) {
  try {
    fs.writeFileSync(getConfigPath(), JSON.stringify({ displayId: id }));
  } catch (e) {
    console.error('Failed to save displayId:', e.message);
  }
}

function createWindow() {
  const isDev = !app.isPackaged;

  mainWindow = new BrowserWindow({
    width: 1920,
    height: 1080,
    webPreferences: {
      nodeIntegration: false,
      contextIsolation: true,
      preload: path.join(__dirname, 'preload.js')
    },
    frame: false,
    fullscreen: true,
    autoHideMenuBar: true,
  });

  Menu.setApplicationMenu(null);

  const startUrl = isDev
    ? 'http://localhost:3001'
    : `file://${path.join(__dirname, '../build/index.html')}`;

  mainWindow.loadURL(startUrl);

  // F12 opens DevTools in dev mode
  if (isDev) {
    mainWindow.webContents.on('before-input-event', (event, input) => {
      if (input.key === 'F12') {
        mainWindow.webContents.toggleDevTools();
      }
    });
  }

  mainWindow.on('closed', () => {
    mainWindow = null;
  });
}

app.on('ready', createWindow);

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit();
  }
});

app.on('activate', () => {
  if (mainWindow === null) {
    createWindow();
  }
});

// IPC Handlers
ipcMain.handle('register-display', async (event, { displayName, displayType, hwInfo }) => {
  try {
    // Reuse existing UUID or generate a new one
    let uniqueId = loadDisplayId();
    if (!uniqueId) {
      uniqueId = require('uuid').v4();
      saveDisplayId(uniqueId);
    }
    displayData.displayId = uniqueId;

    const response = await axios.post(
      `${displayData.apiUrl}/displays/register`,
      {
        displayId: uniqueId,
        displayName,
        displayType,
        hardwareInfo: hwInfo
      }
    );

    return {
      success: true,
      displayId: uniqueId,
      orientation: response.data.orientation || 'landscape',
    };
  } catch (error) {
    return { success: false, error: error.message };
  }
});

ipcMain.handle('get-playlist', async (event, displayId) => {
  try {
    const response = await axios.get(
      `${displayData.apiUrl}/displays/${displayId}/playlist`
    );

    return { success: true, playlist: response.data };
  } catch (error) {
    return { success: false, error: error.message };
  }
});

ipcMain.handle('report-play', async (event, { videoId, duration }) => {
  try {
    await axios.post(
      `${displayData.apiUrl}/analytics/play`,
      {
        displayId: displayData.displayId,
        videoId,
        watchTime: duration
      }
    );

    return { success: true };
  } catch (error) {
    return { success: false, error: error.message };
  }
});

// Connect to WebSocket
function connectSocket() {
  socket = io(displayData.socketUrl);

  socket.on('connect', () => {
    console.log('Connected to server');
    socket.emit('register_display', {
      displayId: displayData.displayId
    });
  });

  socket.on('playlist_updated', (data) => {
    if (mainWindow) mainWindow.webContents.send('playlist-updated', data);
  });

  socket.on('playlist_reordered', (data) => {
    if (mainWindow) mainWindow.webContents.send('playlist-reordered', data);
  });

  socket.on('playlist_changed', (data) => {
    if (mainWindow) mainWindow.webContents.send('playlist-changed', data);
  });

  socket.on('playlist_assigned', (data) => {
    if (mainWindow) mainWindow.webContents.send('playlist-updated', data);
  });

  socket.on('disconnect', () => {
    console.log('Disconnected from server');
    setTimeout(connectSocket, 5000);
  });
}

ipcMain.handle('connect-socket', () => {
  connectSocket();
  startHeartbeat();
  return { success: true };
});

// Heartbeat: keep display status as "online" every 30 seconds
let heartbeatTimer = null;
function startHeartbeat() {
  if (heartbeatTimer) return;
  heartbeatTimer = setInterval(async () => {
    if (!displayData.displayId) return;
    try {
      await axios.post(
        `${displayData.apiUrl}/displays/${displayData.displayId}/status`,
        { status: 'online', lastSync: new Date().toISOString() }
      );
    } catch {}
  }, 30 * 1000);
}

app.on('before-quit', async () => {
  if (displayData.displayId) {
    try {
      await axios.post(
        `${displayData.apiUrl}/displays/${displayData.displayId}/status`,
        { status: 'offline', lastSync: new Date().toISOString() }
      );
    } catch {}
  }
});

