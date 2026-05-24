const { contextBridge, ipcRenderer } = require('electron');

contextBridge.exposeInMainWorld('electron', {
  registerDisplay: (data) => ipcRenderer.invoke('register-display', data),
  getPlaylist: (displayId) => ipcRenderer.invoke('get-playlist', displayId),
  reportPlay: (data) => ipcRenderer.invoke('report-play', data),
  connectSocket: () => ipcRenderer.invoke('connect-socket'),
  onPlaylistUpdated: (callback) => ipcRenderer.on('playlist-updated', (event, data) => callback(data)),
  onPlaylistReordered: (callback) => ipcRenderer.on('playlist-reordered', (event, data) => callback(data)),
  onPlaylistChanged: (callback) => ipcRenderer.on('playlist-changed', (event, data) => callback(data))
});
