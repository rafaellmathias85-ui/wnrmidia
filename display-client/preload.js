const { contextBridge, ipcRenderer } = require('electron');

contextBridge.exposeInMainWorld('electronAPI', {
  getConfig:        ()       => ipcRenderer.invoke('get-config'),
  saveConfig:       (config) => ipcRenderer.invoke('save-config', config),
  launchPlayer:     ()       => ipcRenderer.invoke('launch-player'),
  openSetup:        ()       => ipcRenderer.invoke('open-setup'),
  importConfigFile: ()       => ipcRenderer.invoke('import-config-file'),
});
