const { contextBridge, ipcRenderer } = require('electron');

contextBridge.exposeInMainWorld('api', {
  selectFolder: () => ipcRenderer.invoke('select-folder'),
  connect: (config) => ipcRenderer.send('connect-websocket', config),
  disconnect: () => ipcRenderer.send('disconnect-websocket'),
  saveConfig: (config) => ipcRenderer.send('save-config', config),
  getConfig: () => ipcRenderer.invoke('get-config'),
  onStatusChange: (callback) => ipcRenderer.on('status-change', (event, status) => callback(status)),
  onLog: (callback) => ipcRenderer.on('log-message', (event, message) => callback(message))
});
