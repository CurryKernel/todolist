const { contextBridge, ipcRenderer } = require('electron');

contextBridge.exposeInMainWorld('electronAPI', {
  selectDataPath: () => ipcRenderer.invoke('select-data-path'),
  readJSON: (filename) => ipcRenderer.invoke('read-json', filename),
  writeJSON: (filename, data) => ipcRenderer.invoke('write-json', filename, data),
  fileExists: (filename) => ipcRenderer.invoke('file-exists', filename),
  getAppVersion: () => ipcRenderer.invoke('get-app-version'),
  getDataPath: () => ipcRenderer.invoke('get-data-path'),
  setDataPath: (path) => ipcRenderer.invoke('set-data-path', path),
  onToast: (callback) => {
    const handler = (_event, msg) => callback(msg);
    ipcRenderer.on('toast', handler);
    return () => ipcRenderer.removeListener('toast', handler);
  },
  minimizeWindow: () => ipcRenderer.invoke('minimize-window'),
  maximizeWindow: () => ipcRenderer.invoke('maximize-window'),
  closeWindow: () => ipcRenderer.invoke('close-window'),
  onMenuAction: (callback) => {
    const handler = (_event, action) => callback(action);
    ipcRenderer.on('menu-action', handler);
    return () => ipcRenderer.removeListener('menu-action', handler);
  },
  // Floating window
  openFloatingWindow: () => ipcRenderer.invoke('open-floating-window'),
  closeFloatingWindow: () => ipcRenderer.invoke('close-floating-window'),
  onRestoreFromFloating: (callback) => {
    const handler = () => callback();
    ipcRenderer.on('restore-from-floating', handler);
    return () => ipcRenderer.removeListener('restore-from-floating', handler);
  }
});
