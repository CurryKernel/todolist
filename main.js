const { app, BrowserWindow, ipcMain, dialog, Menu } = require('electron');
const path = require('path');
const fs = require('fs');

let mainWindow = null;
let userDataPath = null;
const CONFIG_PATH = path.join(app.getPath('userData'), 'config.json');

function loadConfig() {
  try {
    if (fs.existsSync(CONFIG_PATH)) {
      return JSON.parse(fs.readFileSync(CONFIG_PATH, 'utf-8'));
    }
  } catch (e) { console.error('Failed to load config:', e); }
  return { dataPath: '', firstRun: true };
}

function saveConfig(config) {
  try {
    fs.writeFileSync(CONFIG_PATH, JSON.stringify(config, null, 2), 'utf-8');
  } catch (e) { console.error('Failed to save config:', e); }
}

function ensureFile(dbPath, filename, defaultData) {
  const filePath = path.join(dbPath, filename);
  if (!fs.existsSync(filePath)) {
    fs.writeFileSync(filePath, JSON.stringify(defaultData, null, 2), 'utf-8');
  }
  return filePath;
}

function backupTodos(dbPath) {
  try {
    const todosPath = path.join(dbPath, 'todos.json');
    if (!fs.existsSync(todosPath)) return;
    const backupDir = path.join(dbPath, 'backups');
    if (!fs.existsSync(backupDir)) fs.mkdirSync(backupDir, { recursive: true });
    const date = new Date().toISOString().split('T')[0];
    const backupPath = path.join(backupDir, `todos-${date}.json`);
    if (!fs.existsSync(backupPath)) {
      fs.copyFileSync(todosPath, backupPath);
    }
  } catch (e) { console.error('Backup failed:', e); }
}

function setupIPC() {
  ipcMain.handle('select-data-path', async () => {
    const result = await dialog.showOpenDialog(mainWindow, {
      title: '请选择数据存储文件夹',
      properties: ['openDirectory', 'createDirectory'],
      buttonLabel: '选择此文件夹'
    });
    if (result.canceled || result.filePaths.length === 0) return null;
    return result.filePaths[0];
  });

  ipcMain.handle('get-data-path', () => userDataPath);

  ipcMain.handle('set-data-path', (_event, newPath) => {
    userDataPath = newPath;
    const config = loadConfig();
    config.dataPath = newPath;
    config.firstRun = false;
    saveConfig(config);
    return true;
  });

  ipcMain.handle('read-json', (_event, filename) => {
    if (!userDataPath) return null;
    if (typeof filename !== 'string' || !/^[a-zA-Z0-9_\-]+\.json$/.test(filename)) {
      console.error('Rejected invalid filename:', filename);
      return null;
    }
    try {
      const filePath = path.join(userDataPath, filename);
      if (!fs.existsSync(filePath)) return null;
      return JSON.parse(fs.readFileSync(filePath, 'utf-8'));
    } catch (e) {
      console.error(`Read ${filename} failed:`, e);
      // Try backup recovery
      try {
        const backupDir = path.join(userDataPath, 'backups');
        if (fs.existsSync(backupDir)) {
          const backupFiles = fs.readdirSync(backupDir)
            .filter(f => f.startsWith(filename.replace('.json', '')))
            .sort()
            .reverse();
          if (backupFiles.length > 0) {
            const backupPath = path.join(backupDir, backupFiles[0]);
            console.log(`Restoring from backup: ${backupFiles[0]}`);
            const data = JSON.parse(fs.readFileSync(backupPath, 'utf-8'));
            // Restore backup as current file
            fs.writeFileSync(filePath, JSON.stringify(data, null, 2), 'utf-8');
            return data;
          }
        }
      } catch (be) {
        console.error('Backup recovery failed:', be);
      }
      return null;
    }
  });

  ipcMain.handle('write-json', (_event, filename, data) => {
    if (!userDataPath) return false;
    if (typeof filename !== 'string' || !/^[a-zA-Z0-9_\-]+\.json$/.test(filename)) {
      console.error('Rejected invalid filename:', filename);
      return false;
    }
    try {
      const filePath = path.join(userDataPath, filename);
      fs.writeFileSync(filePath, JSON.stringify(data, null, 2), 'utf-8');
      return true;
    } catch (e) {
      console.error(`Write ${filename} failed:`, e);
      mainWindow.webContents.send('toast', '保存失败，请检查磁盘空间');
      return false;
    }
  });

  ipcMain.handle('file-exists', (_event, filename) => {
    if (!userDataPath) return false;
    if (typeof filename !== 'string' || !/^[a-zA-Z0-9_\-]+\.json$/.test(filename)) {
      console.error('Rejected invalid filename:', filename);
      return false;
    }
    return fs.existsSync(path.join(userDataPath, filename));
  });

  ipcMain.handle('get-app-version', () => app.getVersion());

  ipcMain.handle('minimize-window', () => mainWindow.minimize());
  ipcMain.handle('maximize-window', () => {
    if (mainWindow.isMaximized()) mainWindow.unmaximize();
    else mainWindow.maximize();
  });
  ipcMain.handle('close-window', () => mainWindow.close());
}

function createWindow() {
  const config = loadConfig();
  userDataPath = config.dataPath || '';

  // Restore window bounds from config, with defaults
  const windowBounds = config.windowBounds || { width: 1200, height: 800 };

  mainWindow = new BrowserWindow({
    width: windowBounds.width,
    height: windowBounds.height,
    minWidth: 900,
    minHeight: 600,
    title: '源计划 - 王源主题待办清单',
    webPreferences: {
      preload: path.join(__dirname, 'preload.js'),
      contextIsolation: true,
      nodeIntegration: false,
      sandbox: false
    },
    show: false,
    frame: true,
    backgroundColor: '#F5F9F6'
  });

  // Restore window position if available
  if (windowBounds.x !== undefined && windowBounds.y !== undefined) {
    mainWindow.setPosition(windowBounds.x, windowBounds.y);
  }

  mainWindow.once('ready-to-show', () => {
    mainWindow.show();
  });

  // Save window bounds on close
  mainWindow.on('close', () => {
    const cfg = loadConfig();
    const bounds = mainWindow.getBounds();
    cfg.windowBounds = bounds;
    saveConfig(cfg);
  });

  if (userDataPath && fs.existsSync(userDataPath)) {
    backupTodos(userDataPath);
  }

  const appMenu = Menu.buildFromTemplate([
    {
      label: '源计划',
      submenu: [
        { label: '关于源计划', click: () => mainWindow.webContents.send('menu-action', 'about') },
        { type: 'separator' },
        { label: '退出', accelerator: 'Alt+F4', click: () => app.quit() }
      ]
    },
    {
      label: '编辑',
      submenu: [
        { label: '撤销', accelerator: 'CmdOrCtrl+Z', click: () => mainWindow.webContents.send('menu-action', 'undo') },
        { type: 'separator' },
        { label: '剪切', accelerator: 'CmdOrCtrl+X', role: 'cut' },
        { label: '复制', accelerator: 'CmdOrCtrl+C', role: 'copy' },
        { label: '粘贴', accelerator: 'CmdOrCtrl+V', role: 'paste' }
      ]
    },
    {
      label: '视图',
      submenu: [
        { label: '刷新', accelerator: 'CmdOrCtrl+R', role: 'reload' },
        { label: '切换全屏', accelerator: 'F11', role: 'togglefullscreen' },
        { type: 'separator' },
        { label: '开发者工具', accelerator: 'F12', role: 'toggleDevTools' }
      ]
    }
  ]);
  Menu.setApplicationMenu(appMenu);

  setupIPC();

  if (config.firstRun || !userDataPath) {
    mainWindow.loadFile(path.join(__dirname, 'src', 'setup.html'));
  } else {
    mainWindow.loadFile(path.join(__dirname, 'src', 'splash.html'));
  }
}

app.whenReady().then(createWindow);

app.on('window-all-closed', () => {
  app.quit();
});

app.on('activate', () => {
  if (BrowserWindow.getAllWindows().length === 0) createWindow();
});
