const { contextBridge, ipcRenderer } = require('electron');

// Expõe APIs seguras para o renderer
contextBridge.exposeInMainWorld('electronAPI', {
  getAppVersion: () => ipcRenderer.invoke('get-app-version'),
  platform: process.platform
});
