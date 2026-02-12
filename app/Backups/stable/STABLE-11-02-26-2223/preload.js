const { contextBridge, ipcRenderer } = require('electron');

// Expose protected methods to renderer process
contextBridge.exposeInMainWorld('electronAPI', {
  platform: process.platform,
  version: process.versions.electron,
  backupSourceFiles: () => ipcRenderer.invoke('backup-source-files'),
  getLatestBackup: () => ipcRenderer.invoke('get-latest-backup')
});
