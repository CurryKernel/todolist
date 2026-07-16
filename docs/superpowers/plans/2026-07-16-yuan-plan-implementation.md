# 源计划 (Yuan Plan) — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build "源计划" — a Wang Yuan-themed, mint-green minimalist TodoList Windows desktop app with Electron + vanilla JS + JSON local storage.

**Architecture:** Electron main process handles file I/O and native dialogs via IPC; renderer process is a vanilla JS SPA with three-panel layout (sidebar + task list + detail panel). Data stored as JSON files in user-chosen directory. CSS custom properties for 3-theme system. Chart.js for stats.

**Tech Stack:** Electron 28+, vanilla HTML/CSS/JS, Chart.js (CDN), electron-builder for Windows packaging.

## Global Constraints

- Platform: Windows 10/11 desktop
- Electron version: 28+
- No frontend framework — vanilla JS only
- Data storage: JSON files in user-chosen directory
- Theme: mint-green, 3 variants (morning, afternoon, night)
- Wang Yuan theme: moderate integration (colors + avatar + quotes + animations)
- Default window: 1200×800, minimum 900×600
- Font: PingFang SC / Microsoft YaHei / sans-serif
- All text in Chinese (Simplified)
- App name: "源计划", executable: YuanPlan
- GitHub repo: CurryKernel/todolist
- Spec reference: docs/superpowers/specs/2026-07-16-yuan-plan-todolist-design.md

---

## File Structure Map

```
todolist/
├── package.json                  # npm config, scripts, electron-builder
├── electron-builder.yml          # Windows packaging config
├── main.js                       # Electron main process
├── preload.js                    # contextBridge IPC API
├── src/
│   ├── index.html                # Main app shell (3-panel layout)
│   ├── splash.html               # Startup splash screen
│   ├── setup.html                # First-run path selection wizard
│   ├── css/
│   │   ├── main.css              # Core layout + design tokens
│   │   ├── themes.css            # 3-theme CSS variables
│   │   ├── splash.css            # Splash/setup styles
│   │   └── components.css        # Button, card, input, modal styles
│   ├── js/
│   │   ├── app.js                # App entry, routing, init flow
│   │   ├── store.js              # Data CRUD via IPC, event bus
│   │   ├── sidebar.js            # Sidebar: categories, mini-stats, add btn
│   │   ├── task-list.js          # Main list: render, filter, sort, drag
│   │   ├── task-detail.js        # Right panel: edit form, delete
│   │   ├── search.js             # Search bar + filter controls
│   │   ├── stats.js              # Statistics panel + Chart.js charts
│   │   ├── themes.js             # Theme switcher
│   │   ├── animations.js         # Note particles, confetti, transitions
│   │   └── settings.js           # Settings panel, data path, prefs
│   ├── assets/
│   │   └── icons/                # SVG icons (to be created inline)
│   └── data/
│       ├── quotes.json           # Wang Yuan quote database
│       └── defaults.json         # Default categories + settings
```

---

### Task 1: GitHub Repository Setup & Project Scaffolding

**Files:**
- Create: `package.json`
- Create: `electron-builder.yml`
- Create: `.gitignore`

**Interfaces:**
- Produces: `package.json` with electron 28, electron-builder, scripts

- [ ] **Step 1: Create GitHub repository `todolist` under CurryKernel**

Run in bash:
```bash
cd "c:/Users/gv/Desktop/todolist"
gh repo create CurryKernel/todolist --public --description "源计划 - 王源主题待办清单 Windows 桌面应用" --confirm
```

Expected: Repository created at https://github.com/CurryKernel/todolist

- [ ] **Step 2: Initialize git locally and connect to remote**

```bash
cd "c:/Users/gv/Desktop/todolist"
git init
git remote add origin git@github.com:CurryKernel/todolist.git
```

Expected: `git remote -v` shows origin pointing to CurryKernel/todolist

- [ ] **Step 3: Write `package.json`**

```json
{
  "name": "yuan-plan",
  "version": "1.0.0",
  "description": "源计划 - 王源主题待办清单",
  "main": "main.js",
  "scripts": {
    "start": "electron .",
    "build": "electron-builder",
    "build:win": "electron-builder --win"
  },
  "author": "CurryKernel",
  "license": "MIT",
  "devDependencies": {
    "electron": "^28.0.0",
    "electron-builder": "^24.9.1"
  }
}
```

- [ ] **Step 4: Write `electron-builder.yml`**

```yaml
appId: com.yuanplan.todolist
productName: 源计划
executableName: YuanPlan
directories:
  output: dist
files:
  - main.js
  - preload.js
  - src/**/*
  - node_modules/**/*
win:
  target: nsis
  icon: src/assets/icons/icon.ico
nsis:
  oneClick: false
  allowToChangeInstallationDirectory: true
  installerIcon: src/assets/icons/icon.ico
  createDesktopShortcut: true
  createStartMenuShortcut: true
  shortcutName: 源计划
```

- [ ] **Step 5: Write `.gitignore`**

```
node_modules/
dist/
*.exe
*.log
.DS_Store
```

- [ ] **Step 6: Install dependencies and commit**

```bash
cd "c:/Users/gv/Desktop/todolist"
npm install
git add package.json package-lock.json electron-builder.yml .gitignore
git commit -m "chore: init project scaffold with Electron 28"
git push -u origin main
```

Expected: `npm install` succeeds, commit pushed to GitHub

---

### Task 2: Electron Main Process & Preload (IPC Layer)

**Files:**
- Create: `main.js`
- Create: `preload.js`
- Create: `src/data/defaults.json`
- Create: `src/data/quotes.json`

**Interfaces:**
- Produces: `window.electronAPI` object available in renderer with methods:
  - `selectDataPath()` → `Promise<string|null>`
  - `readJSON(filename: string)` → `Promise<object|null>`
  - `writeJSON(filename: string, data: object)` → `Promise<boolean>`
  - `fileExists(filename: string)` → `Promise<boolean>`
  - `getAppVersion()` → `Promise<string>`
  - `getDataPath()` → `Promise<string>`
  - `setDataPath(path: string)` → `Promise<boolean>`
  - `onToast(callback: (msg: string) => void)` → cleanup function

- [ ] **Step 1: Write `src/data/defaults.json`**

```json
{
  "categories": [
    {"id": "work",    "name": "办公", "icon": "briefcase", "color": "#7BC8A4", "order": 0, "builtin": true},
    {"id": "life",    "name": "生活", "icon": "home",      "color": "#8BC34A", "order": 1, "builtin": true},
    {"id": "sport",   "name": "运动", "icon": "run",       "color": "#66BB6A", "order": 2, "builtin": true},
    {"id": "diet",    "name": "饮食", "icon": "utensils",  "color": "#81C784", "order": 3, "builtin": true}
  ],
  "settings": {
    "dataPath": "",
    "theme": "morning",
    "wangYuanMode": true,
    "autoBackup": true,
    "firstRun": true,
    "sidebarCollapsed": false,
    "detailPanelOpen": false,
    "currentFilter": "all",
    "language": "zh-CN"
  },
  "todos": {
    "version": "1.0",
    "lastModified": "",
    "items": []
  }
}
```

- [ ] **Step 2: Write `src/data/quotes.json`**

```json
{
  "quotes": [
    {"text": "生而自由，爱而无畏", "source": "王源"},
    {"text": "保持热爱，奔赴山海", "source": "王源"},
    {"text": "做自己的光，不需要太亮", "source": "王源"},
    {"text": "一步一步，踏实走好", "source": "王源"},
    {"text": "少年的梦，不应止于心动", "source": "王源"},
    {"text": "愿你出走半生，归来仍是少年", "source": "王源"},
    {"text": "好好生活，慢慢相遇", "source": "王源"},
    {"text": "心之所向，素履以往", "source": "王源"},
    {"text": "不要着急，最好的总在不经意间出现", "source": "王源"},
    {"text": "只要心中还有梦想，前路就永远充满了希望", "source": "王源"},
    {"text": "梦想不会逃走，逃走的只有自己", "source": "王源"},
    {"text": "做任何事情都要全力以赴", "source": "王源"}
  ]
}
```

- [ ] **Step 3: Write `preload.js`**

```js
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
  }
});
```

- [ ] **Step 4: Write `main.js`**

```js
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
    try {
      const filePath = path.join(userDataPath, filename);
      if (!fs.existsSync(filePath)) return null;
      return JSON.parse(fs.readFileSync(filePath, 'utf-8'));
    } catch (e) {
      console.error(`Read ${filename} failed:`, e);
      return null;
    }
  });

  ipcMain.handle('write-json', (_event, filename, data) => {
    if (!userDataPath) return false;
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
  mainWindow = new BrowserWindow({
    width: 1200,
    height: 800,
    minWidth: 900,
    minHeight: 600,
    title: '源计划 - 王源主题待办清单',
    icon: path.join(__dirname, 'src', 'assets', 'icons', 'icon.png'),
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

  mainWindow.once('ready-to-show', () => {
    mainWindow.show();
  });

  const config = loadConfig();
  userDataPath = config.dataPath || '';

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

  const config2 = loadConfig();
  if (config2.firstRun || !userDataPath) {
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
```

- [ ] **Step 5: Test that Electron starts without errors**

```bash
cd "c:/Users/gv/Desktop/todolist"
npx electron . --no-sandbox 2>&1 &
sleep 5
# Verify window opens (check manually — the setup.html will 404 but Electron should start)
```

Expected: Electron window opens (may show error for missing setup.html, which we create next)

- [ ] **Step 6: Commit**

```bash
cd "c:/Users/gv/Desktop/todolist"
git add main.js preload.js src/data/
git commit -m "feat: add Electron main process with IPC and data layer"
```

---

### Task 3: Core CSS Design System & Theme Engine

**Files:**
- Create: `src/css/main.css`
- Create: `src/css/themes.css`
- Create: `src/css/components.css`
- Create: `src/js/themes.js`

**Interfaces:**
- Produces: CSS custom properties for all design tokens, 3 theme classes (`.theme-morning`, `.theme-afternoon`, `.theme-night`), `ThemeManager` global with `init()`, `setTheme(name)`, `getCurrent()` methods.

- [ ] **Step 1: Write `src/css/themes.css`**

```css
/* ===== 源·薄荷 主题系统 ===== */

/* 晨露 Morning (default) — 白天办公 */
.theme-morning, :root {
  --bg-primary: #F5F9F6;
  --bg-sidebar: #E8F3EC;
  --bg-card: #FFFFFF;
  --bg-card-hover: #F8FBFA;
  --bg-input: #F0F7F3;
  --accent: #7BC8A4;
  --accent-hover: #5BA88A;
  --accent-light: #D4EDE0;
  --accent-ultra-light: #EDF7F1;
  --text-primary: #2C3E35;
  --text-secondary: #6B7F73;
  --text-muted: #A0B5A8;
  --border: #D4E5DA;
  --border-light: #E8F0EB;
  --danger: #E8A87C;
  --danger-hover: #D49165;
  --warning: #E8C87C;
  --warning-bg: #FDF6E8;
  --success: #7BC8A4;
  --shadow-sm: 0 1px 3px rgba(44, 62, 53, 0.04);
  --shadow-md: 0 2px 8px rgba(44, 62, 53, 0.06);
  --shadow-lg: 0 4px 16px rgba(44, 62, 53, 0.08);
  --splash-gradient: linear-gradient(135deg, #E8F3EC 0%, #F5F9F6 40%, #D4EDE0 100%);
}

/* 午后 Afternoon — 全天通用 */
.theme-afternoon {
  --bg-primary: #F0F7F2;
  --bg-sidebar: #DCE8E0;
  --bg-card: #FAFCFA;
  --bg-card-hover: #F2F7F4;
  --bg-input: #EBF3EE;
  --accent: #6AB892;
  --accent-hover: #4A9E78;
  --accent-light: #C8E6D4;
  --accent-ultra-light: #E8F4EC;
  --text-primary: #2A3A30;
  --text-secondary: #5F7367;
  --text-muted: #94A89B;
  --border: #C8DCD0;
  --border-light: #DEE8E1;
  --danger: #E09E70;
  --warning: #E0BE70;
  --success: #6AB892;
  --splash-gradient: linear-gradient(135deg, #DCE8E0 0%, #F0F7F2 40%, #C8E6D4 100%);
}

/* 夜幕 Night — 夜间护眼 */
.theme-night {
  --bg-primary: #EAF2ED;
  --bg-sidebar: #D2E2D8;
  --bg-card: #F5F9F6;
  --bg-card-hover: #EDF4EF;
  --bg-input: #E4EEE7;
  --accent: #5AA882;
  --accent-hover: #3E8E68;
  --accent-light: #BCDBCC;
  --accent-ultra-light: #E2F0E8;
  --text-primary: #26362C;
  --text-secondary: #566B5E;
  --text-muted: #889C8F;
  --border: #BCD0C4;
  --border-light: #D4E2D9;
  --danger: #D49266;
  --warning: #D4B266;
  --success: #5AA882;
  --splash-gradient: linear-gradient(135deg, #D2E2D8 0%, #EAF2ED 40%, #BCDBCC 100%);
}
```

- [ ] **Step 2: Write `src/css/main.css`**

```css
/* ===== 源计划 — 全局样式 ===== */
@import './themes.css';

*, *::before, *::after {
  margin: 0;
  padding: 0;
  box-sizing: border-box;
}

html, body {
  height: 100%;
  overflow: hidden;
  font-family: 'PingFang SC', 'Microsoft YaHei', 'Segoe UI', sans-serif;
  font-size: var(--text-base, 16px);
  color: var(--text-primary);
  background: var(--bg-primary);
  -webkit-font-smoothing: antialiased;
  -moz-osx-font-smoothing: grayscale;
  user-select: none;
}

/* ===== Layout ===== */
.app-container {
  display: flex;
  height: 100vh;
  width: 100vw;
}

/* ===== Sidebar ===== */
.sidebar {
  width: 220px;
  min-width: 220px;
  background: var(--bg-sidebar);
  border-right: 1px solid var(--border);
  display: flex;
  flex-direction: column;
  padding: var(--spacing-md);
  gap: var(--spacing-sm);
  transition: width 250ms ease, min-width 250ms ease;
}

.sidebar.collapsed {
  width: 60px;
  min-width: 60px;
}

.sidebar-header {
  display: flex;
  align-items: center;
  gap: var(--spacing-sm);
  padding: var(--spacing-sm) 0;
  margin-bottom: var(--spacing-sm);
}

.sidebar-avatar {
  width: 40px;
  height: 40px;
  border-radius: 50%;
  background: var(--accent-light);
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 20px;
  flex-shrink: 0;
  border: 2px solid var(--accent);
}

.sidebar-greeting {
  font-size: var(--text-sm);
  color: var(--text-secondary);
  line-height: 1.3;
}

.sidebar-greeting strong {
  color: var(--accent);
  font-weight: 600;
}

.sidebar-divider {
  height: 1px;
  background: var(--border);
  margin: var(--spacing-xs) 0;
}

.sidebar-nav {
  flex: 1;
  display: flex;
  flex-direction: column;
  gap: 2px;
  overflow-y: auto;
}

.nav-item {
  display: flex;
  align-items: center;
  gap: var(--spacing-sm);
  padding: 10px 12px;
  border-radius: var(--radius-md);
  cursor: pointer;
  transition: all 150ms ease;
  font-size: var(--text-sm);
  color: var(--text-secondary);
  text-decoration: none;
  position: relative;
}

.nav-item:hover {
  background: var(--accent-light);
  color: var(--text-primary);
}

.nav-item.active {
  background: var(--accent);
  color: #FFFFFF;
  font-weight: 500;
}

.nav-item .nav-icon {
  width: 20px;
  text-align: center;
  flex-shrink: 0;
  font-size: 16px;
}

.nav-item .nav-badge {
  margin-left: auto;
  background: var(--accent-light);
  color: var(--accent-hover);
  font-size: 11px;
  font-weight: 600;
  padding: 2px 8px;
  border-radius: var(--radius-full);
  min-width: 20px;
  text-align: center;
}

.nav-item.active .nav-badge {
  background: rgba(255,255,255,0.3);
  color: #FFFFFF;
}

.sidebar-footer {
  display: flex;
  flex-direction: column;
  gap: var(--spacing-xs);
  padding-top: var(--spacing-xs);
  border-top: 1px solid var(--border-light);
}

.sidebar-mini-stats {
  background: var(--bg-card);
  border-radius: var(--radius-md);
  padding: 12px;
  font-size: var(--text-xs);
  color: var(--text-secondary);
  text-align: center;
  cursor: pointer;
  transition: all 150ms ease;
}

.sidebar-mini-stats:hover {
  background: var(--accent-light);
}

.sidebar-mini-stats .stats-number {
  font-size: var(--text-lg);
  font-weight: 700;
  color: var(--accent);
}

/* ===== Main Content ===== */
.main-content {
  flex: 1;
  display: flex;
  flex-direction: column;
  min-width: 0;
  background: var(--bg-primary);
}

.toolbar {
  display: flex;
  align-items: center;
  gap: var(--spacing-md);
  padding: var(--spacing-md) var(--spacing-lg);
  border-bottom: 1px solid var(--border-light);
  background: var(--bg-card);
  min-height: 60px;
}

.toolbar-title {
  font-size: var(--text-lg);
  font-weight: 600;
  color: var(--text-primary);
  white-space: nowrap;
}

.task-list-container {
  flex: 1;
  overflow-y: auto;
  padding: var(--spacing-md) var(--spacing-lg);
  display: flex;
  flex-direction: column;
  gap: var(--spacing-xs);
}

/* ===== Detail Panel ===== */
.detail-panel {
  width: 340px;
  min-width: 340px;
  background: var(--bg-card);
  border-left: 1px solid var(--border);
  display: flex;
  flex-direction: column;
  transition: width 250ms ease, min-width 250ms ease, opacity 250ms ease;
  overflow: hidden;
}

.detail-panel.hidden {
  width: 0;
  min-width: 0;
  border-left: none;
  opacity: 0;
  pointer-events: none;
}

.detail-panel-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: var(--spacing-md) var(--spacing-lg);
  border-bottom: 1px solid var(--border-light);
}

.detail-panel-title {
  font-size: var(--text-base);
  font-weight: 600;
}

.detail-panel-body {
  flex: 1;
  overflow-y: auto;
  padding: var(--spacing-lg);
  display: flex;
  flex-direction: column;
  gap: var(--spacing-md);
}

/* ===== Scrollbar ===== */
::-webkit-scrollbar {
  width: 6px;
}

::-webkit-scrollbar-track {
  background: transparent;
}

::-webkit-scrollbar-thumb {
  background: var(--border);
  border-radius: 3px;
}

::-webkit-scrollbar-thumb:hover {
  background: var(--text-muted);
}
```

- [ ] **Step 3: Write `src/css/components.css`**

```css
/* ===== 源计划 — 组件样式 ===== */

/* Buttons */
.btn {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: 6px;
  padding: 8px 16px;
  border: none;
  border-radius: var(--radius-md);
  font-size: var(--text-sm);
  font-family: inherit;
  cursor: pointer;
  transition: all 150ms ease;
  white-space: nowrap;
  outline: none;
}

.btn:active { transform: scale(0.97); }

.btn-primary {
  background: var(--accent);
  color: #FFFFFF;
}

.btn-primary:hover { background: var(--accent-hover); }

.btn-secondary {
  background: var(--bg-input);
  color: var(--text-secondary);
}

.btn-secondary:hover { background: var(--accent-light); color: var(--text-primary); }

.btn-danger {
  background: transparent;
  color: var(--danger);
}

.btn-danger:hover { background: #FDF0E8; }

.btn-ghost {
  background: transparent;
  color: var(--text-muted);
  padding: 6px 10px;
}

.btn-ghost:hover { color: var(--text-primary); background: var(--bg-input); }

.btn-icon {
  width: 36px;
  height: 36px;
  padding: 0;
  border-radius: var(--radius-md);
  font-size: 18px;
}

.btn-round {
  width: 40px;
  height: 40px;
  border-radius: 50%;
  padding: 0;
  font-size: 20px;
  box-shadow: var(--shadow-md);
}

/* Inputs */
.input {
  width: 100%;
  padding: 10px 14px;
  border: 1.5px solid var(--border);
  border-radius: var(--radius-md);
  font-size: var(--text-sm);
  font-family: inherit;
  color: var(--text-primary);
  background: var(--bg-input);
  transition: border-color 150ms ease, box-shadow 150ms ease;
  outline: none;
}

.input:focus {
  border-color: var(--accent);
  box-shadow: 0 0 0 3px var(--accent-light);
}

.input::placeholder { color: var(--text-muted); }

/* Textarea */
.textarea {
  width: 100%;
  padding: 10px 14px;
  border: 1.5px solid var(--border);
  border-radius: var(--radius-md);
  font-size: var(--text-sm);
  font-family: inherit;
  color: var(--text-primary);
  background: var(--bg-input);
  resize: vertical;
  min-height: 80px;
  outline: none;
  transition: border-color 150ms ease;
}

.textarea:focus {
  border-color: var(--accent);
  box-shadow: 0 0 0 3px var(--accent-light);
}

/* Select */
.select {
  width: 100%;
  padding: 10px 14px;
  border: 1.5px solid var(--border);
  border-radius: var(--radius-md);
  font-size: var(--text-sm);
  font-family: inherit;
  color: var(--text-primary);
  background: var(--bg-input);
  cursor: pointer;
  outline: none;
  appearance: none;
  background-image: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='12' height='12' viewBox='0 0 24 24' fill='none' stroke='%236B7F73' stroke-width='2'%3E%3Cpath d='M6 9l6 6 6-6'/%3E%3C/svg%3E");
  background-repeat: no-repeat;
  background-position: right 12px center;
  padding-right: 36px;
}

.select:focus {
  border-color: var(--accent);
  box-shadow: 0 0 0 3px var(--accent-light);
}

/* Task Card */
.task-card {
  display: flex;
  align-items: center;
  gap: var(--spacing-sm);
  padding: 12px 16px;
  background: var(--bg-card);
  border-radius: var(--radius-md);
  border: 1px solid transparent;
  cursor: pointer;
  transition: all 150ms ease;
  position: relative;
}

.task-card:hover {
  border-color: var(--border);
  box-shadow: var(--shadow-sm);
  transform: translateY(-1px);
}

.task-card.dragging {
  opacity: 0.5;
  border-color: var(--accent);
  border-style: dashed;
}

.task-card.drag-over {
  border-color: var(--accent);
  background: var(--accent-ultra-light);
}

.task-card.completed .task-title {
  text-decoration: line-through;
  color: var(--text-muted);
}

/* Checkbox */
.checkbox-circle {
  width: 22px;
  height: 22px;
  border-radius: 50%;
  border: 2px solid var(--border);
  flex-shrink: 0;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: all 300ms cubic-bezier(0.34, 1.56, 0.64, 1);
  cursor: pointer;
}

.checkbox-circle:hover { border-color: var(--accent); }

.checkbox-circle.checked {
  background: var(--accent);
  border-color: var(--accent);
}

.checkbox-circle.checked::after {
  content: '✓';
  color: #FFFFFF;
  font-size: 13px;
  font-weight: 700;
}

/* Priority strip */
.priority-strip {
  width: 3px;
  height: 36px;
  border-radius: 2px;
  flex-shrink: 0;
}

.priority-high { background: var(--danger); }
.priority-medium { background: var(--warning); }
.priority-low { background: var(--text-muted); }

/* Tags */
.tag {
  display: inline-flex;
  align-items: center;
  gap: 4px;
  padding: 2px 10px;
  border-radius: var(--radius-full);
  font-size: var(--text-xs);
  background: var(--accent-light);
  color: var(--accent-hover);
  white-space: nowrap;
}

.tag-remove {
  cursor: pointer;
  font-size: 14px;
  line-height: 1;
  opacity: 0.6;
}

.tag-remove:hover { opacity: 1; }

/* Search */
.search-box {
  position: relative;
  flex: 1;
  max-width: 400px;
}

.search-box .input {
  padding-left: 38px;
}

.search-icon {
  position: absolute;
  left: 12px;
  top: 50%;
  transform: translateY(-50%);
  color: var(--text-muted);
  font-size: 16px;
  pointer-events: none;
}

.search-clear {
  position: absolute;
  right: 8px;
  top: 50%;
  transform: translateY(-50%);
  background: none;
  border: none;
  color: var(--text-muted);
  cursor: pointer;
  font-size: 16px;
  padding: 4px;
  display: none;
}

.search-box.has-value .search-clear { display: block; }

/* Toast */
.toast-container {
  position: fixed;
  bottom: 24px;
  left: 50%;
  transform: translateX(-50%);
  z-index: 9999;
  display: flex;
  flex-direction: column;
  gap: 8px;
  pointer-events: none;
}

.toast {
  padding: 10px 20px;
  border-radius: var(--radius-full);
  background: var(--text-primary);
  color: #FFFFFF;
  font-size: var(--text-sm);
  box-shadow: var(--shadow-lg);
  animation: toastIn 300ms ease, toastOut 300ms ease 2.7s forwards;
  pointer-events: auto;
}

@keyframes toastIn {
  from { opacity: 0; transform: translateY(20px); }
  to { opacity: 1; transform: translateY(0); }
}

@keyframes toastOut {
  from { opacity: 1; transform: translateY(0); }
  to { opacity: 0; transform: translateY(20px); }
}

/* Confirm Bubble */
.confirm-bubble {
  position: absolute;
  background: var(--bg-card);
  border: 1px solid var(--border);
  border-radius: var(--radius-md);
  padding: 12px 16px;
  box-shadow: var(--shadow-lg);
  z-index: 100;
  display: flex;
  gap: 8px;
  align-items: center;
  font-size: var(--text-sm);
  animation: fadeIn 150ms ease;
}

@keyframes fadeIn {
  from { opacity: 0; transform: scale(0.95); }
  to { opacity: 1; transform: scale(1); }
}

/* Empty State */
.empty-state {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 60px 20px;
  text-align: center;
  color: var(--text-muted);
}

.empty-state svg {
  width: 120px;
  height: 120px;
  margin-bottom: var(--spacing-lg);
  opacity: 0.6;
}

.empty-state .empty-title {
  font-size: var(--text-lg);
  color: var(--text-secondary);
  margin-bottom: var(--spacing-xs);
}

.empty-state .empty-desc {
  font-size: var(--text-sm);
}

/* Quick Add Bar */
.quick-add-bar {
  display: flex;
  gap: var(--spacing-sm);
  padding: var(--spacing-sm) var(--spacing-lg);
  background: var(--bg-card);
  border-bottom: 1px solid var(--border-light);
  align-items: center;
}

.quick-add-bar .input {
  flex: 1;
}

/* Stats Cards */
.stat-cards {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: var(--spacing-sm);
}

.stat-card {
  background: var(--bg-primary);
  border-radius: var(--radius-md);
  padding: var(--spacing-md);
  text-align: center;
}

.stat-card .stat-value {
  font-size: var(--text-xl);
  font-weight: 700;
  color: var(--accent);
}

.stat-card .stat-label {
  font-size: var(--text-xs);
  color: var(--text-muted);
  margin-top: 4px;
}
```

- [ ] **Step 4: Write `src/js/themes.js`**

```js
class ThemeManager {
  constructor() {
    this.THEMES = ['morning', 'afternoon', 'night'];
    this.THEME_NAMES = { morning: '晨露', afternoon: '午后', night: '夜幕' };
    this.THEME_ICONS = { morning: '🌿', afternoon: '☀️', night: '🌙' };
    this.currentTheme = 'morning';
  }

  async init() {
    const settings = await window.electronAPI.readJSON('settings.json');
    if (settings && settings.theme && this.THEMES.includes(settings.theme)) {
      this.currentTheme = settings.theme;
    }
    this.apply();
  }

  setTheme(name) {
    if (!this.THEMES.includes(name)) return;
    this.currentTheme = name;
    this.apply();
  }

  apply() {
    document.documentElement.className = `theme-${this.currentTheme}`;
  }

  getCurrent() {
    return {
      id: this.currentTheme,
      name: this.THEME_NAMES[this.currentTheme],
      icon: this.THEME_ICONS[this.currentTheme]
    };
  }

  getThemes() {
    return this.THEMES.map(id => ({
      id,
      name: this.THEME_NAMES[id],
      icon: this.THEME_ICONS[id]
    }));
  }
}

window.ThemeManager = new ThemeManager();
```

- [ ] **Step 5: Commit**

```bash
cd "c:/Users/gv/Desktop/todolist"
git add src/css/ src/js/themes.js
git commit -m "feat: add CSS design system and theme manager (3 mint variants)"
```

---

### Task 4: Data Store & App Initialization

**Files:**
- Create: `src/js/store.js`
- Create: `src/js/app.js`

**Interfaces:**
- Produces: `AppStore` global with methods:
  - `init()` → `Promise<void>`
  - `getTodos()` → `Array`
  - `addTodo(todo)` → `Promise<Todo>`
  - `updateTodo(id, changes)` → `Promise<Todo|null>`
  - `deleteTodo(id)` → `Promise<boolean>`
  - `toggleTodo(id)` → `Promise<Todo|null>`
  - `reorderTodos(orderedIds)` → `Promise<void>`
  - `getCategories()` → `Array`
  - `addCategory(cat)` → `Promise<Category>`
  - `updateCategory(id, changes)` → `Promise<Category|null>`
  - `deleteCategory(id)` → `Promise<boolean>`
  - `getSettings()` → `Object`
  - `saveSettings(settings)` → `Promise<boolean>`
  - `on(event, callback)` → unsubscribe function
  - Events: `'change'`, `'category-change'`, `'settings-change'`
- Produces: `App` global that manages init flow (splash → setup → main)
  - `App.init()` → orchestrates startup

- [ ] **Step 1: Write `src/js/store.js`**

```js
class AppStore {
  constructor() {
    this.todos = [];
    this.categories = [];
    this.settings = {};
    this._listeners = {};
    this._saveTimer = null;
  }

  on(event, callback) {
    if (!this._listeners[event]) this._listeners[event] = [];
    this._listeners[event].push(callback);
    return () => {
      this._listeners[event] = this._listeners[event].filter(cb => cb !== callback);
    };
  }

  _emit(event, data) {
    if (this._listeners[event]) {
      this._listeners[event].forEach(cb => cb(data));
    }
  }

  _debouncedSave() {
    if (this._saveTimer) clearTimeout(this._saveTimer);
    this._saveTimer = setTimeout(() => {
      this._saveTodos();
    }, 300);
  }

  async _saveTodos() {
    const data = {
      version: '1.0',
      lastModified: new Date().toISOString(),
      items: this.todos
    };
    await window.electronAPI.writeJSON('todos.json', data);
  }

  async _saveCategories() {
    await window.electronAPI.writeJSON('categories.json', { categories: this.categories });
  }

  async _saveSettings() {
    await window.electronAPI.writeJSON('settings.json', this.settings);
  }

  async init() {
    // Load settings
    this.settings = await window.electronAPI.readJSON('settings.json');
    if (!this.settings) {
      this.settings = {
        dataPath: '', theme: 'morning', wangYuanMode: true,
        autoBackup: true, firstRun: true, sidebarCollapsed: false,
        detailPanelOpen: false, currentFilter: 'all', language: 'zh-CN'
      };
    }

    // Load todos
    const todosData = await window.electronAPI.readJSON('todos.json');
    this.todos = (todosData && todosData.items) ? todosData.items : [];

    // Load categories
    const catData = await window.electronAPI.readJSON('categories.json');
    this.categories = (catData && catData.categories) ? catData.categories : [];

    // Initialize defaults if empty
    if (this.categories.length === 0) {
      this.categories = [
        { id: 'work',  name: '办公', icon: 'briefcase', color: '#7BC8A4', order: 0, builtin: true },
        { id: 'life',  name: '生活', icon: 'home',      color: '#8BC34A', order: 1, builtin: true },
        { id: 'sport', name: '运动', icon: 'run',       color: '#66BB6A', order: 2, builtin: true },
        { id: 'diet',  name: '饮食', icon: 'utensils',  color: '#81C784', order: 3, builtin: true }
      ];
      await this._saveCategories();
    }
  }

  getTodos() { return this.todos; }

  _generateId() {
    return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, c => {
      const r = Math.random() * 16 | 0;
      return (c === 'x' ? r : (r & 0x3 | 0x8)).toString(16);
    });
  }

  async addTodo(todoData) {
    const now = new Date().toISOString();
    const maxOrder = this.todos.reduce((max, t) => Math.max(max, t.order || 0), -1);
    const todo = {
      id: this._generateId(),
      title: todoData.title || '',
      description: todoData.description || '',
      category: todoData.category || 'life',
      priority: todoData.priority || 'medium',
      dueDate: todoData.dueDate || null,
      completed: false,
      completedAt: null,
      createdAt: now,
      updatedAt: now,
      order: todoData.order !== undefined ? todoData.order : maxOrder + 1,
      tags: todoData.tags || []
    };
    this.todos.unshift(todo);
    this._debouncedSave();
    this._emit('change', { action: 'add', todo });
    return todo;
  }

  async updateTodo(id, changes) {
    const idx = this.todos.findIndex(t => t.id === id);
    if (idx === -1) return null;
    this.todos[idx] = {
      ...this.todos[idx],
      ...changes,
      updatedAt: new Date().toISOString(),
      id: this.todos[idx].id
    };
    this._debouncedSave();
    this._emit('change', { action: 'update', todo: this.todos[idx] });
    return this.todos[idx];
  }

  async deleteTodo(id) {
    const idx = this.todos.findIndex(t => t.id === id);
    if (idx === -1) return false;
    const deleted = this.todos.splice(idx, 1)[0];
    this._debouncedSave();
    this._emit('change', { action: 'delete', todo: deleted });
    return true;
  }

  async toggleTodo(id) {
    const todo = this.todos.find(t => t.id === id);
    if (!todo) return null;
    const now = new Date().toISOString();
    return this.updateTodo(id, {
      completed: !todo.completed,
      completedAt: !todo.completed ? now : null
    });
  }

  async reorderTodos(orderedIds) {
    orderedIds.forEach((id, index) => {
      const todo = this.todos.find(t => t.id === id);
      if (todo) todo.order = index;
    });
    this.todos.sort((a, b) => a.order - b.order);
    this._debouncedSave();
    this._emit('change', { action: 'reorder' });
  }

  getCategories() { return this.categories; }

  async addCategory(catData) {
    const maxOrder = this.categories.reduce((max, c) => Math.max(max, c.order || 0), -1);
    const category = {
      id: 'custom-' + this._generateId(),
      name: catData.name,
      icon: catData.icon || 'folder',
      color: catData.color || '#7BC8A4',
      order: maxOrder + 1,
      builtin: false
    };
    this.categories.push(category);
    await this._saveCategories();
    this._emit('category-change', { action: 'add', category });
    return category;
  }

  async updateCategory(id, changes) {
    const idx = this.categories.findIndex(c => c.id === id);
    if (idx === -1) return null;
    this.categories[idx] = { ...this.categories[idx], ...changes, id: this.categories[idx].id };
    await this._saveCategories();
    this._emit('category-change', { action: 'update', category: this.categories[idx] });
    return this.categories[idx];
  }

  async deleteCategory(id) {
    const cat = this.categories.find(c => c.id === id);
    if (!cat || cat.builtin) return false;
    const idx = this.categories.findIndex(c => c.id === id);
    this.categories.splice(idx, 1);
    // Move todos to default category
    this.todos.forEach(t => { if (t.category === id) t.category = 'life'; });
    await this._saveCategories();
    this._debouncedSave();
    this._emit('category-change', { action: 'delete', category: cat });
    return true;
  }

  getSettings() { return this.settings; }

  async saveSettings(newSettings) {
    this.settings = { ...this.settings, ...newSettings };
    await this._saveSettings();
    this._emit('settings-change', this.settings);
    return true;
  }
}

window.store = new AppStore();
```

- [ ] **Step 2: Write `src/js/app.js`**

```js
class App {
  constructor() {
    this.initialized = false;
  }

  async init() {
    if (this.initialized) return;
    await window.store.init();
    await window.ThemeManager.init();
    this.initialized = true;

    // Initialize UI modules
    if (window.Sidebar) window.Sidebar.init();
    if (window.TaskList) window.TaskList.init();
    if (window.TaskDetail) window.TaskDetail.init();
    if (window.SearchBar) window.SearchBar.init();
    if (window.StatsPanel) window.StatsPanel.init();
    if (window.SettingsPanel) window.SettingsPanel.init();
    if (window.Animations) window.Animations.init();

    // Listen for menu actions from main process
    if (window.electronAPI.onMenuAction) {
      window.electronAPI.onMenuAction((action) => {
        if (action === 'undo' && window.TaskList) {
          window.TaskList.handleUndo();
        }
      });
    }

    // Keyboard shortcuts
    document.addEventListener('keydown', (e) => {
      if ((e.ctrlKey || e.metaKey) && e.key === 'n') {
        e.preventDefault();
        if (window.TaskList) window.TaskList.focusQuickAdd();
      }
    });

    console.log('源计划 initialized');
  }
}

window.App = new App();
```

- [ ] **Step 3: Commit**

```bash
cd "c:/Users/gv/Desktop/todolist"
git add src/js/store.js src/js/app.js
git commit -m "feat: add data store with IPC-backed CRUD and app init flow"
```

---

### Task 5: Main HTML Shell + Splash + Setup Pages

**Files:**
- Create: `src/index.html`
- Create: `src/splash.html`
- Create: `src/setup.html`
- Create: `src/css/splash.css`

**Interfaces:**
- splash.html: loads quotes, shows random quote + 1.5s animation, then redirects
- setup.html: first-run path selection wizard
- index.html: main app shell with sidebar, content, detail panel

- [ ] **Step 1: Write `src/splash.html`**

```html
<!DOCTYPE html>
<html lang="zh-CN">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>源计划</title>
  <link rel="stylesheet" href="css/splash.css">
</head>
<body>
  <div class="splash-container">
    <div class="splash-content">
      <div class="splash-logo">
        <svg width="80" height="80" viewBox="0 0 80 80">
          <circle cx="40" cy="40" r="38" fill="none" stroke="#7BC8A4" stroke-width="2"/>
          <circle cx="40" cy="40" r="28" fill="#D4EDE0"/>
          <text x="40" y="46" text-anchor="middle" font-size="24" fill="#5BA88A">源</text>
        </svg>
      </div>
      <h1 class="splash-title">源计划</h1>
      <p class="splash-subtitle">Yuan Plan</p>
      <div class="splash-quote" id="splash-quote">
        <p class="quote-text" id="quote-text"></p>
        <p class="quote-source" id="quote-source"></p>
      </div>
    </div>
  </div>
  <script>
    async function loadQuote() {
      try {
        const response = await fetch('data/quotes.json');
        const data = await response.json();
        const quote = data.quotes[Math.floor(Math.random() * data.quotes.length)];
        document.getElementById('quote-text').textContent = `"${quote.text}"`;
        document.getElementById('quote-source').textContent = `— ${quote.source}`;
      } catch (e) {
        document.getElementById('quote-text').textContent = '"源气满满，今天也要加油"';
        document.getElementById('quote-source').textContent = '— 源计划';
      }
    }

    loadQuote();

    setTimeout(() => {
      document.querySelector('.splash-container').style.opacity = '0';
      setTimeout(() => {
        window.location.href = 'index.html';
      }, 400);
    }, 2000);
  </script>
</body>
</html>
```

- [ ] **Step 2: Write `src/css/splash.css`**

```css
@import './themes.css';

* { margin: 0; padding: 0; box-sizing: border-box; }

body {
  font-family: 'PingFang SC', 'Microsoft YaHei', sans-serif;
  height: 100vh;
  overflow: hidden;
  background: #F5F9F6;
}

.splash-container {
  height: 100vh;
  display: flex;
  align-items: center;
  justify-content: center;
  background: var(--splash-gradient, linear-gradient(135deg, #E8F3EC 0%, #F5F9F6 40%, #D4EDE0 100%));
  transition: opacity 400ms ease;
}

.splash-content {
  text-align: center;
  animation: splashEnter 800ms ease;
}

@keyframes splashEnter {
  from { opacity: 0; transform: translateY(30px); }
  to { opacity: 1; transform: translateY(0); }
}

.splash-logo {
  margin-bottom: 24px;
}

.splash-logo svg {
  filter: drop-shadow(0 4px 12px rgba(123, 200, 164, 0.3));
}

.splash-title {
  font-size: 36px;
  font-weight: 700;
  color: #2C3E35;
  margin-bottom: 4px;
  letter-spacing: 4px;
}

.splash-subtitle {
  font-size: 14px;
  color: #7BC8A4;
  letter-spacing: 6px;
  text-transform: uppercase;
  margin-bottom: 40px;
}

.splash-quote {
  opacity: 0;
  animation: quoteFadeIn 600ms ease 400ms forwards;
}

@keyframes quoteFadeIn {
  from { opacity: 0; transform: translateY(10px); }
  to { opacity: 1; transform: translateY(0); }
}

.quote-text {
  font-size: 16px;
  color: #6B7F73;
  font-style: italic;
  line-height: 1.6;
  max-width: 300px;
  margin: 0 auto;
}

.quote-source {
  font-size: 13px;
  color: #A0B5A8;
  margin-top: 8px;
}

/* Setup Page */
.setup-container {
  height: 100vh;
  display: flex;
  align-items: center;
  justify-content: center;
  background: var(--splash-gradient, linear-gradient(135deg, #E8F3EC 0%, #F5F9F6 40%, #D4EDE0 100%));
}

.setup-card {
  background: #FFFFFF;
  border-radius: 16px;
  padding: 48px 40px;
  text-align: center;
  box-shadow: 0 4px 24px rgba(44, 62, 53, 0.08);
  max-width: 480px;
  width: 90%;
  animation: splashEnter 600ms ease;
}

.setup-icon {
  font-size: 56px;
  margin-bottom: 20px;
}

.setup-title {
  font-size: 24px;
  font-weight: 700;
  color: #2C3E35;
  margin-bottom: 8px;
}

.setup-desc {
  font-size: 14px;
  color: #6B7F73;
  margin-bottom: 28px;
  line-height: 1.6;
}

.setup-path {
  display: flex;
  gap: 10px;
  margin-bottom: 24px;
}

.setup-path input {
  flex: 1;
  padding: 10px 14px;
  border: 1.5px solid #D4E5DA;
  border-radius: 10px;
  font-size: 14px;
  font-family: inherit;
  background: #F0F7F3;
  color: #2C3E35;
  outline: none;
}

.setup-path input:focus {
  border-color: #7BC8A4;
}

.setup-path button {
  padding: 10px 20px;
  background: #7BC8A4;
  color: #FFFFFF;
  border: none;
  border-radius: 10px;
  cursor: pointer;
  font-size: 14px;
  font-family: inherit;
  white-space: nowrap;
  transition: background 150ms;
}

.setup-path button:hover { background: #5BA88A; }

.setup-start-btn {
  padding: 12px 48px;
  background: #7BC8A4;
  color: #FFFFFF;
  border: none;
  border-radius: 25px;
  cursor: pointer;
  font-size: 16px;
  font-family: inherit;
  font-weight: 600;
  transition: all 150ms ease;
  box-shadow: 0 2px 12px rgba(123, 200, 164, 0.3);
}

.setup-start-btn:hover {
  background: #5BA88A;
  transform: translateY(-1px);
  box-shadow: 0 4px 16px rgba(123, 200, 164, 0.4);
}

.setup-start-btn:disabled {
  background: #A0B5A8;
  cursor: not-allowed;
  box-shadow: none;
}

.setup-error {
  color: #E8A87C;
  font-size: 13px;
  margin-top: 8px;
  display: none;
}
```

- [ ] **Step 3: Write `src/setup.html`**

```html
<!DOCTYPE html>
<html lang="zh-CN">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>源计划 - 初次设置</title>
  <link rel="stylesheet" href="css/splash.css">
</head>
<body>
  <div class="setup-container">
    <div class="setup-card">
      <div class="setup-icon">💚</div>
      <h1 class="setup-title">欢迎使用源计划</h1>
      <p class="setup-desc">
        请选择一个文件夹来存储你的待办数据。<br>
        数据将保存在你电脑本地，不会上传到任何地方。
      </p>
      <div class="setup-path">
        <input type="text" id="path-input" placeholder="点击右侧按钮选择文件夹..." readonly>
        <button id="browse-btn">浏览...</button>
      </div>
      <p class="setup-error" id="setup-error">请先选择数据存储位置</p>
      <button class="setup-start-btn" id="start-btn" disabled>开始使用</button>
    </div>
  </div>
  <script>
    let selectedPath = '';

    document.getElementById('browse-btn').addEventListener('click', async () => {
      const path = await window.electronAPI.selectDataPath();
      if (path) {
        selectedPath = path;
        document.getElementById('path-input').value = path;
        document.getElementById('start-btn').disabled = false;
        document.getElementById('setup-error').style.display = 'none';
      }
    });

    document.getElementById('start-btn').addEventListener('click', async () => {
      if (!selectedPath) {
        document.getElementById('setup-error').style.display = 'block';
        return;
      }
      await window.electronAPI.setDataPath(selectedPath);

      // Initialize data files
      const resp = await fetch('data/defaults.json');
      const defaults = await resp.json();
      await window.electronAPI.writeJSON('categories.json', { categories: defaults.categories });
      await window.electronAPI.writeJSON('todos.json', defaults.todos);
      await window.electronAPI.writeJSON('settings.json', {
        ...defaults.settings,
        dataPath: selectedPath,
        firstRun: false
      });

      // Show welcome then go to main
      document.querySelector('.setup-card').innerHTML = `
        <div class="setup-icon">✨</div>
        <h1 class="setup-title">设置完成！</h1>
        <p class="setup-desc">源计划，陪你元气每一天 💚</p>
        <svg width="120" height="120" viewBox="0 0 120 120" style="margin: 16px 0; opacity: 0.6;">
          <circle cx="60" cy="60" r="50" fill="none" stroke="#7BC8A4" stroke-width="1.5"/>
          <path d="M40 55 Q60 30 80 55" fill="none" stroke="#7BC8A4" stroke-width="2" stroke-linecap="round"/>
          <circle cx="60" cy="70" r="20" fill="#D4EDE0"/>
          <text x="60" y="76" text-anchor="middle" font-size="18" fill="#5BA88A">源</text>
        </svg>
      `;

      setTimeout(() => {
        window.location.href = 'index.html';
      }, 2000);
    });
  </script>
</body>
</html>
```

- [ ] **Step 4: Write `src/index.html`**

```html
<!DOCTYPE html>
<html lang="zh-CN" class="theme-morning">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>源计划 - 王源主题待办清单</title>
  <link rel="stylesheet" href="css/main.css">
  <link rel="stylesheet" href="css/components.css">
</head>
<body>
  <div class="app-container">
    <!-- Sidebar -->
    <aside class="sidebar" id="sidebar">
      <div class="sidebar-header">
        <div class="sidebar-avatar" id="sidebar-avatar">🎵</div>
        <div class="sidebar-greeting" id="sidebar-greeting">
          源气满满<br><strong>今天也要加油 💚</strong>
        </div>
      </div>
      <div class="sidebar-divider"></div>
      <nav class="sidebar-nav" id="category-nav">
        <!-- Populated by sidebar.js -->
      </nav>
      <div class="sidebar-footer">
        <div class="sidebar-mini-stats" id="mini-stats" title="点击查看完整统计">
          <div>今日完成</div>
          <div class="stats-number" id="mini-stats-number">0/0</div>
        </div>
        <button class="btn btn-secondary" id="settings-btn" style="width:100%;">
          ⚙️ 设置
        </button>
      </div>
    </aside>

    <!-- Main Content -->
    <main class="main-content" id="main-content">
      <div class="toolbar" id="toolbar">
        <span class="toolbar-title" id="toolbar-title">全部待办</span>
        <div class="search-box" id="search-box">
          <span class="search-icon">🔍</span>
          <input type="text" class="input" id="search-input" placeholder="搜索待办事项...">
          <button class="search-clear" id="search-clear">✕</button>
        </div>
        <button class="btn btn-primary" id="quick-add-btn" title="快速添加 (Ctrl+N)">+ 新建</button>
        <div style="flex:1;"></div>
        <select class="select" id="sort-select" style="width:auto;">
          <option value="order">手动排序</option>
          <option value="createdAt-desc">最新创建</option>
          <option value="dueDate-asc">截止日期</option>
          <option value="priority-desc">优先级</option>
        </select>
        <div class="filter-tabs" id="filter-tabs">
          <button class="btn btn-secondary filter-btn active" data-filter="all">全部</button>
          <button class="btn btn-secondary filter-btn" data-filter="active">进行中</button>
          <button class="btn btn-secondary filter-btn" data-filter="completed">已完成</button>
        </div>
      </div>

      <!-- Quick Add Bar (hidden by default) -->
      <div class="quick-add-bar" id="quick-add-bar" style="display:none;">
        <input type="text" class="input" id="quick-add-input" placeholder="输入任务标题，回车确认...">
        <select class="select" id="quick-add-category" style="width:120px;">
          <!-- Populated by JS -->
        </select>
        <select class="select" id="quick-add-priority" style="width:100px;">
          <option value="high">🔴 高</option>
          <option value="medium" selected>🟡 中</option>
          <option value="low">🟢 低</option>
        </select>
        <button class="btn btn-primary" id="quick-add-confirm">添加</button>
        <button class="btn btn-ghost" id="quick-add-cancel">取消</button>
      </div>

      <!-- Task List -->
      <div class="task-list-container" id="task-list">
        <div class="empty-state" id="empty-state">
          <svg viewBox="0 0 120 120" width="120" height="120">
            <circle cx="60" cy="45" r="8" fill="#D4EDE0"/>
            <circle cx="45" cy="70" r="6" fill="#D4EDE0"/>
            <circle cx="75" cy="70" r="6" fill="#D4EDE0"/>
            <path d="M35 90 Q60 105 85 90" fill="none" stroke="#D4EDE0" stroke-width="2" stroke-linecap="round"/>
            <circle cx="60" cy="55" r="42" fill="none" stroke="#E8F0EB" stroke-width="1"/>
          </svg>
          <div class="empty-title">从这里开始你的计划</div>
          <div class="empty-desc">按 Ctrl+N 或点击 "+ 新建" 添加第一个待办</div>
        </div>
      </div>
    </main>

    <!-- Detail Panel -->
    <aside class="detail-panel hidden" id="detail-panel">
      <div class="detail-panel-header">
        <span class="detail-panel-title">任务详情</span>
        <button class="btn btn-ghost btn-icon" id="detail-close-btn">✕</button>
      </div>
      <div class="detail-panel-body" id="detail-panel-body">
        <!-- Populated by task-detail.js -->
      </div>
    </aside>
  </div>

  <!-- Toast Container -->
  <div class="toast-container" id="toast-container"></div>

  <!-- Scripts -->
  <script src="js/store.js"></script>
  <script src="js/themes.js"></script>
  <script src="js/animations.js"></script>
  <script src="js/sidebar.js"></script>
  <script src="js/search.js"></script>
  <script src="js/task-list.js"></script>
  <script src="js/task-detail.js"></script>
  <script src="js/stats.js"></script>
  <script src="js/settings.js"></script>
  <script src="js/app.js"></script>
  <script>
    document.addEventListener('DOMContentLoaded', () => {
      window.App.init();
    });
  </script>
</body>
</html>
```

- [ ] **Step 5: Commit**

```bash
cd "c:/Users/gv/Desktop/todolist"
git add src/index.html src/splash.html src/setup.html src/css/splash.css
git commit -m "feat: add HTML shell, splash screen, and setup wizard pages"
```

---

### Task 6: Sidebar + Search + Filter

**Files:**
- Create: `src/js/sidebar.js`
- Create: `src/js/search.js`

**Interfaces:**
- Sidebar: renders category nav from store, click triggers filter, mini-stats display, "+" quick-add trigger, settings button
- SearchBar: real-time search with debounce, filter tabs (all/active/completed), sort select

- [ ] **Step 1: Write `src/js/sidebar.js`**

```js
class SidebarModule {
  constructor() {
    this.currentCategory = 'all';
    this.container = document.getElementById('category-nav');
  }

  init() {
    this.render();
    window.store.on('change', () => this.render());
    window.store.on('category-change', () => this.render());
    window.store.on('settings-change', () => this.updateGreeting());

    document.getElementById('mini-stats').addEventListener('click', () => {
      if (window.StatsPanel) window.StatsPanel.toggle();
    });

    document.getElementById('settings-btn').addEventListener('click', () => {
      if (window.SettingsPanel) window.SettingsPanel.toggle();
    });

    this.updateGreeting();
  }

  updateGreeting() {
    const hour = new Date().getHours();
    let greeting = '今天也要加油 💚';
    if (hour < 6) greeting = '夜深了，早点休息 🌙';
    else if (hour < 9) greeting = '早上好，源气满满 🌅';
    else if (hour < 12) greeting = '上午好，全力以赴 💪';
    else if (hour < 14) greeting = '中午好，记得吃饭 🍽️';
    else if (hour < 18) greeting = '下午好，保持专注 ✨';
    else if (hour < 22) greeting = '晚上好，回顾今天 📝';
    document.getElementById('sidebar-greeting').innerHTML = `源气满满<br><strong>${greeting}</strong>`;
  }

  render() {
    const categories = window.store.getCategories();
    const todos = window.store.getTodos();

    let html = '';

    // "All" item
    const allCount = todos.filter(t => !t.completed).length;
    html += `
      <div class="nav-item ${this.currentCategory === 'all' ? 'active' : ''}" data-category="all">
        <span class="nav-icon">📋</span>
        <span>全部待办</span>
        <span class="nav-badge">${allCount}</span>
      </div>
    `;

    // Category items
    categories.forEach(cat => {
      const count = todos.filter(t => t.category === cat.id && !t.completed).length;
      const iconMap = { briefcase: '💼', home: '🏠', run: '🏃', utensils: '🍽️', folder: '📂' };
      const icon = iconMap[cat.icon] || '📂';
      html += `
        <div class="nav-item ${this.currentCategory === cat.id ? 'active' : ''}" data-category="${cat.id}">
          <span class="nav-icon">${icon}</span>
          <span>${cat.name}</span>
          <span class="nav-badge">${count}</span>
        </div>
      `;
    });

    // "Add Category" button
    html += `
      <div class="nav-item" id="add-category-btn" style="color: var(--text-muted); font-style: italic;">
        <span class="nav-icon">＋</span>
        <span>新建分类</span>
      </div>
    `;

    this.container.innerHTML = html;

    // Click handlers
    this.container.querySelectorAll('.nav-item[data-category]').forEach(item => {
      item.addEventListener('click', () => {
        this.currentCategory = item.dataset.category;
        this.render();
        if (window.TaskList) window.TaskList.filterByCategory(this.currentCategory);
      });
    });

    // Add category handler
    const addBtn = document.getElementById('add-category-btn');
    if (addBtn) {
      addBtn.addEventListener('click', () => {
        const name = prompt('请输入新分类名称：');
        if (name && name.trim()) {
          const colors = ['#7BC8A4', '#8BC34A', '#66BB6A', '#81C784', '#4CAF50', '#009688'];
          const color = colors[Math.floor(Math.random() * colors.length)];
          window.store.addCategory({ name: name.trim(), icon: 'folder', color });
        }
      });
    }

    // Update mini stats
    const today = new Date().toISOString().split('T')[0];
    const todayCompleted = todos.filter(t => t.completed && t.completedAt && t.completedAt.startsWith(today)).length;
    const todayTotal = todos.filter(t => !t.completed || (t.completedAt && t.completedAt.startsWith(today))).length;
    document.getElementById('mini-stats-number').textContent = `${todayCompleted}/${todos.filter(t => !t.completed).length + todayCompleted}`;
  }

  getCurrentCategory() {
    return this.currentCategory;
  }
}

window.Sidebar = new SidebarModule();
```

- [ ] **Step 2: Write `src/js/search.js`**

```js
class SearchBarModule {
  constructor() {
    this.currentFilter = 'all';    // all | active | completed
    this.currentSort = 'order';    // order | createdAt-desc | dueDate-asc | priority-desc
    this.searchQuery = '';
    this._debounceTimer = null;
  }

  init() {
    const searchInput = document.getElementById('search-input');
    const searchClear = document.getElementById('search-clear');
    const searchBox = document.getElementById('search-box');
    const sortSelect = document.getElementById('sort-select');
    const filterBtns = document.querySelectorAll('.filter-btn');

    searchInput.addEventListener('input', () => {
      if (searchInput.value) {
        searchBox.classList.add('has-value');
      } else {
        searchBox.classList.remove('has-value');
      }
      this.searchQuery = searchInput.value.trim().toLowerCase();
      if (this._debounceTimer) clearTimeout(this._debounceTimer);
      this._debounceTimer = setTimeout(() => {
        this.applyFilters();
      }, 300);
    });

    searchClear.addEventListener('click', () => {
      searchInput.value = '';
      searchBox.classList.remove('has-value');
      this.searchQuery = '';
      this.applyFilters();
    });

    sortSelect.addEventListener('change', () => {
      this.currentSort = sortSelect.value;
      this.applyFilters();
    });

    filterBtns.forEach(btn => {
      btn.addEventListener('click', () => {
        filterBtns.forEach(b => b.classList.remove('active'));
        btn.classList.add('active');
        this.currentFilter = btn.dataset.filter;
        this.applyFilters();
      });
    });
  }

  applyFilters() {
    if (window.TaskList) {
      window.TaskList.applyFilters({
        category: window.Sidebar ? window.Sidebar.getCurrentCategory() : 'all',
        status: this.currentFilter,
        sort: this.currentSort,
        query: this.searchQuery
      });
    }
  }

  getFilters() {
    return {
      category: window.Sidebar ? window.Sidebar.getCurrentCategory() : 'all',
      status: this.currentFilter,
      sort: this.currentSort,
      query: this.searchQuery
    };
  }
}

window.SearchBar = new SearchBarModule();
```

- [ ] **Step 3: Commit**

```bash
cd "c:/Users/gv/Desktop/todolist"
git add src/js/sidebar.js src/js/search.js
git commit -m "feat: add sidebar navigation, category filtering, and search bar"
```

---

### Task 7: Task List with Drag & Drop

**Files:**
- Create: `src/js/task-list.js`

**Interfaces:**
- TaskList: renders cards from store, filters/sorts, drag-drop reorder, quick-add, undo delete
  - `init()`, `filterByCategory(id)`, `applyFilters({category, status, sort, query})`, `focusQuickAdd()`, `handleUndo()`

- [ ] **Step 1: Write `src/js/task-list.js`**

```js
class TaskListModule {
  constructor() {
    this.container = document.getElementById('task-list');
    this.emptyState = document.getElementById('empty-state');
    this.filterState = { category: 'all', status: 'all', sort: 'order', query: '' };
    this.deletedTodo = null;
    this.undoTimer = null;
  }

  init() {
    this.render();
    window.store.on('change', () => this.render());

    // Quick add bar
    document.getElementById('quick-add-btn').addEventListener('click', () => this.showQuickAdd());
    document.getElementById('quick-add-cancel').addEventListener('click', () => this.hideQuickAdd());
    document.getElementById('quick-add-confirm').addEventListener('click', () => this.handleQuickAdd());

    const quickInput = document.getElementById('quick-add-input');
    quickInput.addEventListener('keydown', (e) => {
      if (e.key === 'Enter') this.handleQuickAdd();
      if (e.key === 'Escape') this.hideQuickAdd();
    });

    // Populate quick-add category select
    this.populateQuickAddCategories();
    window.store.on('category-change', () => this.populateQuickAddCategories());
  }

  populateQuickAddCategories() {
    const select = document.getElementById('quick-add-category');
    const categories = window.store.getCategories();
    select.innerHTML = categories.map(c => `<option value="${c.id}">${c.name}</option>`).join('');
  }

  showQuickAdd() {
    const bar = document.getElementById('quick-add-bar');
    bar.style.display = 'flex';
    document.getElementById('quick-add-input').focus();
  }

  hideQuickAdd() {
    document.getElementById('quick-add-bar').style.display = 'none';
    document.getElementById('quick-add-input').value = '';
  }

  async handleQuickAdd() {
    const title = document.getElementById('quick-add-input').value.trim();
    if (!title) return;

    const category = document.getElementById('quick-add-category').value;
    const priority = document.getElementById('quick-add-priority').value;

    await window.store.addTodo({ title, category, priority });
    document.getElementById('quick-add-input').value = '';
    document.getElementById('quick-add-input').focus();
  }

  focusQuickAdd() {
    this.showQuickAdd();
  }

  filterByCategory(categoryId) {
    this.filterState.category = categoryId;
    this.applyFilters(this.filterState);
  }

  applyFilters(filters) {
    this.filterState = { ...this.filterState, ...filters };
    this.render();
  }

  getFilteredTodos() {
    let todos = [...window.store.getTodos()];
    const { category, status, sort, query } = this.filterState;

    // Category filter
    if (category && category !== 'all') {
      todos = todos.filter(t => t.category === category);
    }

    // Status filter
    if (status === 'active') todos = todos.filter(t => !t.completed);
    else if (status === 'completed') todos = todos.filter(t => t.completed);

    // Search query
    if (query) {
      const q = query.toLowerCase();
      todos = todos.filter(t =>
        t.title.toLowerCase().includes(q) ||
        (t.description && t.description.toLowerCase().includes(q)) ||
        (t.tags && t.tags.some(tag => tag.toLowerCase().includes(q)))
      );
    }

    // Sort
    switch (sort) {
      case 'createdAt-desc':
        todos.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
        break;
      case 'dueDate-asc':
        todos.sort((a, b) => {
          if (!a.dueDate && !b.dueDate) return 0;
          if (!a.dueDate) return 1;
          if (!b.dueDate) return -1;
          return new Date(a.dueDate) - new Date(b.dueDate);
        });
        break;
      case 'priority-desc':
        const priOrder = { high: 0, medium: 1, low: 2 };
        todos.sort((a, b) => (priOrder[a.priority] || 1) - (priOrder[b.priority] || 1));
        break;
      case 'order':
      default:
        todos.sort((a, b) => a.order - b.order);
        break;
    }

    // Completed items go to bottom
    const active = todos.filter(t => !t.completed);
    const completed = todos.filter(t => t.completed);
    return [...active, ...completed];
  }

  render() {
    const todos = this.getFilteredTodos();
    const hasQuery = this.filterState.query && this.filterState.query.length > 0;

    if (todos.length === 0) {
      this.container.innerHTML = '';
      const emptyDiv = document.createElement('div');
      emptyDiv.className = 'empty-state';
      if (hasQuery) {
        emptyDiv.innerHTML = `
          <svg viewBox="0 0 120 120" width="100" height="100">
            <circle cx="60" cy="60" r="40" fill="none" stroke="#E8F0EB" stroke-width="1.5"/>
            <text x="60" y="65" text-anchor="middle" font-size="32">🔍</text>
          </svg>
          <div class="empty-title">源气不足，试试换个关键词~</div>
          <div class="empty-desc">没有找到匹配"${this.filterState.query}"的任务</div>
        `;
      } else {
        emptyDiv.innerHTML = `
          <svg viewBox="0 0 120 120" width="120" height="120">
            <circle cx="60" cy="45" r="8" fill="#D4EDE0"/>
            <circle cx="45" cy="70" r="6" fill="#D4EDE0"/>
            <circle cx="75" cy="70" r="6" fill="#D4EDE0"/>
            <path d="M35 90 Q60 105 85 90" fill="none" stroke="#D4EDE0" stroke-width="2" stroke-linecap="round"/>
            <circle cx="60" cy="55" r="42" fill="none" stroke="#E8F0EB" stroke-width="1"/>
          </svg>
          <div class="empty-title">从这里开始你的计划</div>
          <div class="empty-desc">按 Ctrl+N 或点击 "+ 新建" 添加第一个待办</div>
        `;
      }
      this.container.appendChild(emptyDiv);
      return;
    }

    // Build HTML
    let html = '';
    const categories = window.store.getCategories();
    const catMap = {};
    categories.forEach(c => { catMap[c.id] = c; });

    // Group: today due items at top
    const today = new Date().toISOString().split('T')[0];
    const todayDue = todos.filter(t => t.dueDate && t.dueDate.startsWith(today) && !t.completed);
    const nonToday = todos.filter(t => !(t.dueDate && t.dueDate.startsWith(today) && !t.completed));

    if (todayDue.length > 0) {
      html += `<div style="font-size:12px; color:var(--text-muted); padding:8px 0; font-weight:600;">📅 今日待办</div>`;
      html += todayDue.map(t => this._renderCard(t, catMap)).join('');
      html += `<div style="font-size:12px; color:var(--text-muted); padding:8px 0; font-weight:600;">📋 其他任务</div>`;
    }

    html += nonToday.map(t => this._renderCard(t, catMap)).join('');
    this.container.innerHTML = html;

    // Attach event listeners
    this.container.querySelectorAll('.task-card').forEach(card => {
      const id = card.dataset.id;

      // Click → open detail
      card.addEventListener('click', (e) => {
        if (e.target.closest('.checkbox-circle') || e.target.closest('.drag-handle')) return;
        if (window.TaskDetail) window.TaskDetail.open(id);
      });

      // Checkbox toggle
      const checkbox = card.querySelector('.checkbox-circle');
      if (checkbox) {
        checkbox.addEventListener('click', async (e) => {
          e.stopPropagation();
          const todo = window.store.getTodos().find(t => t.id === id);
          await window.store.toggleTodo(id);
          if (!todo.completed && window.Animations) {
            const rect = checkbox.getBoundingClientRect();
            window.Animations.spawnNotes(rect.left + 11, rect.top);
          }
        });
      }

      // Drag & drop
      card.addEventListener('dragstart', (e) => {
        card.classList.add('dragging');
        e.dataTransfer.effectAllowed = 'move';
        e.dataTransfer.setData('text/plain', id);
      });

      card.addEventListener('dragend', () => {
        card.classList.remove('dragging');
        this.container.querySelectorAll('.task-card').forEach(c => c.classList.remove('drag-over'));
        this._saveOrder();
      });

      card.addEventListener('dragover', (e) => {
        e.preventDefault();
        e.dataTransfer.dropEffect = 'move';
        card.classList.add('drag-over');
      });

      card.addEventListener('dragleave', () => {
        card.classList.remove('drag-over');
      });

      card.addEventListener('drop', (e) => {
        e.preventDefault();
        card.classList.remove('drag-over');
        const draggedId = e.dataTransfer.getData('text/plain');
        const draggedEl = this.container.querySelector(`.task-card[data-id="${draggedId}"]`);
        if (draggedEl && draggedEl !== card) {
          card.parentNode.insertBefore(draggedEl, card);
        }
      });
    });
  }

  _renderCard(todo, catMap) {
    const cat = catMap[todo.category] || {};
    const isOverdue = todo.dueDate && !todo.completed && new Date(todo.dueDate) < new Date();
    const dueDate = todo.dueDate ? new Date(todo.dueDate).toLocaleDateString('zh-CN', { month: 'short', day: 'numeric', weekday: 'short' }) : '';

    const priorityLabels = { high: '🔴', medium: '🟡', low: '🟢' };
    const iconMap = { briefcase: '💼', home: '🏠', run: '🏃', utensils: '🍽️', folder: '📂' };
    const catIcon = iconMap[cat.icon] || '📂';

    return `
      <div class="task-card ${todo.completed ? 'completed' : ''}" data-id="${todo.id}" draggable="true">
        <span class="drag-handle" style="cursor:grab; color:var(--text-muted); font-size:14px;">⋮⋮</span>
        <div class="checkbox-circle ${todo.completed ? 'checked' : ''}"></div>
        <div class="priority-strip priority-${todo.priority}"></div>
        <div style="flex:1; min-width:0;">
          <div style="font-size:var(--text-sm); color:${isOverdue ? 'var(--danger)' : 'var(--text-primary)'}; font-weight:500; white-space:nowrap; overflow:hidden; text-overflow:ellipsis;">
            ${this._highlightMatch(todo.title)}
            ${isOverdue ? ' ⚠️' : ''}
          </div>
          <div style="display:flex; gap:8px; margin-top:4px; align-items:center;">
            <span style="font-size:var(--text-xs); color:var(--text-muted);">${catIcon} ${cat.name || '未分类'}</span>
            ${dueDate ? `<span style="font-size:var(--text-xs); color:${isOverdue ? 'var(--danger)' : 'var(--text-muted)'};">📅 ${dueDate}</span>` : ''}
            ${todo.tags && todo.tags.length ? todo.tags.map(tag => `<span class="tag">${tag}</span>`).join('') : ''}
          </div>
        </div>
      </div>
    `;
  }

  _highlightMatch(text) {
    if (!this.filterState.query) return text;
    const escaped = this.filterState.query.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    return text.replace(new RegExp(`(${escaped})`, 'gi'), '<mark style="background:var(--accent-light);padding:0 2px;border-radius:2px;">$1</mark>');
  }

  _saveOrder() {
    const cards = this.container.querySelectorAll('.task-card');
    const orderedIds = Array.from(cards).map(c => c.dataset.id);
    window.store.reorderTodos(orderedIds);
  }

  handleUndo() {
    if (this.deletedTodo && this.undoTimer) {
      clearTimeout(this.undoTimer);
      window.store.addTodo(this.deletedTodo);
      this.showToast('已撤销删除');
      this.deletedTodo = null;
      this.undoTimer = null;
    }
  }

  showToast(msg) {
    const container = document.getElementById('toast-container');
    const toast = document.createElement('div');
    toast.className = 'toast';
    toast.textContent = msg;
    container.appendChild(toast);
    setTimeout(() => toast.remove(), 3000);
  }
}

window.TaskList = new TaskListModule();
```

- [ ] **Step 2: Commit**

```bash
cd "c:/Users/gv/Desktop/todolist"
git add src/js/task-list.js
git commit -m "feat: add task list with drag-drop, quick-add, and undo delete"
```

---

### Task 8: Task Detail Panel

**Files:**
- Create: `src/js/task-detail.js`

**Interfaces:**
- TaskDetail: open/close right panel, edit form with auto-save (1.5s debounce), delete with confirm bubble + undo

- [ ] **Step 1: Write `src/js/task-detail.js`**

```js
class TaskDetailModule {
  constructor() {
    this.panel = document.getElementById('detail-panel');
    this.body = document.getElementById('detail-panel-body');
    this.currentTodoId = null;
    this._saveTimer = null;
    this.deletedTodo = null;
    this.undoTimer = null;
  }

  init() {
    document.getElementById('detail-close-btn').addEventListener('click', () => this.close());

    // Listen for store changes to refresh if currently open
    window.store.on('change', (evt) => {
      if (evt.action === 'delete' && evt.todo.id === this.currentTodoId) {
        this.close();
      }
      if (this.currentTodoId && evt.action === 'update' && evt.todo.id === this.currentTodoId) {
        // Don't re-render during user edits — check if this was external
        const activeEl = document.activeElement;
        if (!this.body.contains(activeEl)) {
          this.open(this.currentTodoId);
        }
      }
    });
  }

  open(todoId) {
    const todo = window.store.getTodos().find(t => t.id === todoId);
    if (!todo) return;

    this.currentTodoId = todoId;
    this.panel.classList.remove('hidden');
    this._render(todo);
  }

  close() {
    this.panel.classList.add('hidden');
    this.currentTodoId = null;
    if (this._saveTimer) clearTimeout(this._saveTimer);
  }

  _render(todo) {
    const categories = window.store.getCategories();
    const catOptions = categories.map(c =>
      `<option value="${c.id}" ${todo.category === c.id ? 'selected' : ''}>${c.name}</option>`
    ).join('');

    const priorityOptions = ['high', 'medium', 'low'].map(p =>
      `<option value="${p}" ${todo.priority === p ? 'selected' : ''}>${p === 'high' ? '🔴 高' : p === 'medium' ? '🟡 中' : '🟢 低'}</option>`
    ).join('');

    const dueDateValue = todo.dueDate ? todo.dueDate.substring(0, 16) : '';

    const tagsStr = (todo.tags || []).join(', ');

    this.body.innerHTML = `
      <div class="form-group">
        <label style="font-size:12px;color:var(--text-muted);display:block;margin-bottom:4px;">标题</label>
        <input type="text" class="input" id="detail-title" value="${this._escapeHtml(todo.title)}" placeholder="任务标题">
      </div>

      <div class="form-group">
        <label style="font-size:12px;color:var(--text-muted);display:block;margin-bottom:4px;">描述</label>
        <textarea class="textarea" id="detail-desc" placeholder="添加详细描述...">${this._escapeHtml(todo.description || '')}</textarea>
      </div>

      <div class="form-group">
        <label style="font-size:12px;color:var(--text-muted);display:block;margin-bottom:4px;">分类</label>
        <select class="select" id="detail-category">${catOptions}</select>
      </div>

      <div class="form-group">
        <label style="font-size:12px;color:var(--text-muted);display:block;margin-bottom:4px;">优先级</label>
        <select class="select" id="detail-priority">${priorityOptions}</select>
      </div>

      <div class="form-group">
        <label style="font-size:12px;color:var(--text-muted);display:block;margin-bottom:4px;">截止日期</label>
        <input type="datetime-local" class="input" id="detail-due-date" value="${dueDateValue}">
      </div>

      <div class="form-group">
        <label style="font-size:12px;color:var(--text-muted);display:block;margin-bottom:4px;">标签 (逗号分隔)</label>
        <input type="text" class="input" id="detail-tags" value="${tagsStr}" placeholder="重要, 紧急">
      </div>

      <div style="font-size:12px; color:var(--text-muted); margin-top: 8px;">
        创建于 ${new Date(todo.createdAt).toLocaleString('zh-CN')}
        ${todo.completedAt ? `<br>完成于 ${new Date(todo.completedAt).toLocaleString('zh-CN')}` : ''}
      </div>

      <div style="display:flex; gap:8px; margin-top: auto; padding-top: 16px;">
        <button class="btn btn-danger" id="detail-delete-btn" style="flex:1;">
          🗑 删除任务
        </button>
        <button class="btn btn-secondary" id="detail-complete-btn" style="flex:1;">
          ${todo.completed ? '↩ 取消完成' : '✅ 标记完成'}
        </button>
      </div>
    `;

    // Attach auto-save to all inputs
    const inputs = this.body.querySelectorAll('input, textarea, select');
    inputs.forEach(input => {
      input.addEventListener('input', () => this._scheduleSave());
      input.addEventListener('change', () => this._saveNow());
    });

    // Delete button
    document.getElementById('detail-delete-btn').addEventListener('click', () => {
      this._confirmDelete(todo);
    });

    // Complete toggle button
    document.getElementById('detail-complete-btn').addEventListener('click', async () => {
      const updated = await window.store.toggleTodo(todo.id);
      if (updated) {
        if (!todo.completed && window.Animations) {
          // Animation triggered from task-list checkbox, skip here
        }
        this.open(todo.id); // re-render
      }
    });
  }

  _scheduleSave() {
    if (this._saveTimer) clearTimeout(this._saveTimer);
    this._saveTimer = setTimeout(() => this._saveNow(), 1500);
  }

  async _saveNow() {
    if (!this.currentTodoId) return;
    const title = document.getElementById('detail-title')?.value?.trim();
    if (!title) return; // don't save empty title

    const tagsStr = document.getElementById('detail-tags')?.value || '';
    const tags = tagsStr.split(',').map(t => t.trim()).filter(Boolean);

    const changes = { title };
    const descEl = document.getElementById('detail-desc');
    if (descEl) changes.description = descEl.value;
    const catEl = document.getElementById('detail-category');
    if (catEl) changes.category = catEl.value;
    const priEl = document.getElementById('detail-priority');
    if (priEl) changes.priority = priEl.value;
    const dueEl = document.getElementById('detail-due-date');
    if (dueEl) changes.dueDate = dueEl.value || null;
    changes.tags = tags;

    await window.store.updateTodo(this.currentTodoId, changes);
  }

  _confirmDelete(todo) {
    // Create confirm bubble
    const deleteBtn = document.getElementById('detail-delete-btn');
    const rect = deleteBtn.getBoundingClientRect();

    const bubble = document.createElement('div');
    bubble.className = 'confirm-bubble';
    bubble.style.position = 'fixed';
    bubble.style.top = (rect.top - 60) + 'px';
    bubble.style.left = (rect.left) + 'px';
    bubble.innerHTML = `
      <span>确认删除？</span>
      <button class="btn btn-danger" id="confirm-delete-btn" style="padding:4px 12px;font-size:12px;">删除</button>
      <button class="btn btn-ghost" id="cancel-delete-btn" style="padding:4px 12px;font-size:12px;">取消</button>
    `;
    document.body.appendChild(bubble);

    const removeBubble = () => { if (bubble.parentNode) bubble.remove(); };

    bubble.querySelector('#cancel-delete-btn').addEventListener('click', removeBubble);
    bubble.querySelector('#confirm-delete-btn').addEventListener('click', async () => {
      removeBubble();
      this.deletedTodo = { ...todo };
      await window.store.deleteTodo(todo.id);
      this.close();

      // Show undo toast
      const container = document.getElementById('toast-container');
      const toast = document.createElement('div');
      toast.className = 'toast';
      toast.innerHTML = `已删除 "<strong>${todo.title}</strong>" <button style="background:none;border:none;color:#7BC8A4;cursor:pointer;font-weight:600;margin-left:8px;" id="undo-delete-btn">撤销</button>`;
      container.appendChild(toast);

      document.getElementById('undo-delete-btn').addEventListener('click', async () => {
        await window.store.addTodo(this.deletedTodo);
        this.deletedTodo = null;
        toast.remove();
      });

      this.undoTimer = setTimeout(() => {
        this.deletedTodo = null;
        toast.remove();
      }, 3000);
    });

    // Click outside to dismiss
    setTimeout(() => {
      document.addEventListener('click', function handler(e) {
        if (!bubble.contains(e.target) && e.target !== deleteBtn) {
          removeBubble();
          document.removeEventListener('click', handler);
        }
      });
    }, 0);
  }

  _escapeHtml(str) {
    const div = document.createElement('div');
    div.textContent = str;
    return div.innerHTML;
  }
}

window.TaskDetail = new TaskDetailModule();
```

- [ ] **Step 2: Commit**

```bash
cd "c:/Users/gv/Desktop/todolist"
git add src/js/task-detail.js
git commit -m "feat: add task detail panel with auto-save, delete confirm, and undo"
```

---

### Task 9: Statistics Panel with Chart.js

**Files:**
- Create: `src/js/stats.js`

**Interfaces:**
- StatsPanel: renders stat cards + category donut chart + weekly trend line chart + priority bar chart
  - Uses Chart.js loaded via CDN in index.html

- [ ] **Step 1: Add Chart.js CDN to `src/index.html`**

Add this line before the other script tags in index.html:
```html
<script src="https://cdn.jsdelivr.net/npm/chart.js@4.4.0/dist/chart.umd.min.js"></script>
```

- [ ] **Step 2: Write `src/js/stats.js`**

```js
class StatsPanelModule {
  constructor() {
    this.visible = false;
    this.charts = {};
  }

  init() {
    // Stats panel is toggled from sidebar mini-stats click
  }

  toggle() {
    if (this.visible) {
      this.hide();
    } else {
      this.show();
    }
  }

  show() {
    if (this.visible) return;
    this.visible = true;
    this._renderPanel();
    // Delay chart rendering for smooth transition
    setTimeout(() => this._renderCharts(), 300);
  }

  hide() {
    this.visible = false;
    this._destroyPanel();
  }

  _renderPanel() {
    // Use detail panel area or create overlay
    const panel = document.getElementById('detail-panel');
    const body = document.getElementById('detail-panel-body');
    const headerTitle = panel.querySelector('.detail-panel-title');
    headerTitle.textContent = '📊 数据统计';
    panel.classList.remove('hidden');

    const todos = window.store.getTodos();
    const categories = window.store.getCategories();
    const now = new Date();
    const today = now.toISOString().split('T')[0];

    const total = todos.length;
    const completed = todos.filter(t => t.completed).length;
    const todayCompleted = todos.filter(t => t.completed && t.completedAt && t.completedAt.startsWith(today)).length;
    const active = total - completed;
    const rate = total > 0 ? Math.round((completed / total) * 100) : 0;

    // Calculate streak
    let streak = 0;
    for (let i = 0; i < 365; i++) {
      const d = new Date(now);
      d.setDate(d.getDate() - i);
      const ds = d.toISOString().split('T')[0];
      const hasCompleted = todos.some(t => t.completed && t.completedAt && t.completedAt.startsWith(ds));
      if (hasCompleted) streak++;
      else if (i > 0) break;
    }

    body.innerHTML = `
      <div class="stat-cards">
        <div class="stat-card">
          <div class="stat-value">${total}</div>
          <div class="stat-label">总任务数</div>
        </div>
        <div class="stat-card">
          <div class="stat-value">${rate}%</div>
          <div class="stat-label">完成率</div>
        </div>
        <div class="stat-card">
          <div class="stat-value">${todayCompleted}</div>
          <div class="stat-label">今日完成</div>
        </div>
        <div class="stat-card">
          <div class="stat-value">${streak}天</div>
          <div class="stat-label">连续达成</div>
        </div>
      </div>

      <div style="margin-top:16px;">
        <h4 style="font-size:13px;color:var(--text-secondary);margin-bottom:8px;">分类占比</h4>
        <div style="height:180px;">
          <canvas id="category-chart"></canvas>
        </div>
      </div>

      <div style="margin-top:16px;">
        <h4 style="font-size:13px;color:var(--text-secondary);margin-bottom:8px;">近7天趋势</h4>
        <div style="height:160px;">
          <canvas id="trend-chart"></canvas>
        </div>
      </div>

      <div style="margin-top:16px;">
        <h4 style="font-size:13px;color:var(--text-secondary);margin-bottom:8px;">优先级分布</h4>
        <div style="height:120px;">
          <canvas id="priority-chart"></canvas>
        </div>
      </div>
    `;
  }

  _renderCharts() {
    const todos = window.store.getTodos();
    const categories = window.store.getCategories();

    // Category donut chart
    const catCtx = document.getElementById('category-chart');
    if (catCtx) {
      const catData = categories.map(cat => ({
        name: cat.name,
        count: todos.filter(t => t.category === cat.id && !t.completed).length,
        color: cat.color
      })).filter(d => d.count > 0);

      if (catData.length === 0) {
        catData.push({ name: '暂无数据', count: 1, color: '#D4E5DA' });
      }

      this.charts.category = new Chart(catCtx, {
        type: 'doughnut',
        data: {
          labels: catData.map(d => d.name),
          datasets: [{
            data: catData.map(d => d.count),
            backgroundColor: catData.map(d => d.color),
            borderWidth: 2,
            borderColor: '#FFFFFF'
          }]
        },
        options: {
          responsive: true,
          maintainAspectRatio: false,
          plugins: {
            legend: {
              position: 'right',
              labels: { padding: 12, usePointStyle: true, pointStyleWidth: 8, font: { size: 11 } }
            }
          },
          cutout: '65%'
        }
      });
    }

    // Weekly trend chart
    const trendCtx = document.getElementById('trend-chart');
    if (trendCtx) {
      const days = [];
      const dayData = [];
      for (let i = 6; i >= 0; i--) {
        const d = new Date();
        d.setDate(d.getDate() - i);
        const ds = d.toISOString().split('T')[0];
        const label = d.toLocaleDateString('zh-CN', { weekday: 'short' });
        days.push(label);
        dayData.push(todos.filter(t => t.completed && t.completedAt && t.completedAt.startsWith(ds)).length);
      }

      this.charts.trend = new Chart(trendCtx, {
        type: 'line',
        data: {
          labels: days,
          datasets: [{
            label: '完成任务',
            data: dayData,
            borderColor: '#7BC8A4',
            backgroundColor: 'rgba(123, 200, 164, 0.1)',
            fill: true,
            tension: 0.4,
            pointBackgroundColor: '#7BC8A4',
            pointRadius: 4,
            pointHoverRadius: 6
          }]
        },
        options: {
          responsive: true,
          maintainAspectRatio: false,
          plugins: { legend: { display: false } },
          scales: {
            y: { beginAtZero: true, ticks: { stepSize: 1, font: { size: 10 } }, grid: { color: '#E8F0EB' } },
            x: { ticks: { font: { size: 10 } }, grid: { display: false } }
          }
        }
      });
    }

    // Priority bar chart
    const priCtx = document.getElementById('priority-chart');
    if (priCtx) {
      const high = todos.filter(t => !t.completed && t.priority === 'high').length;
      const medium = todos.filter(t => !t.completed && t.priority === 'medium').length;
      const low = todos.filter(t => !t.completed && t.priority === 'low').length;

      this.charts.priority = new Chart(priCtx, {
        type: 'bar',
        data: {
          labels: ['高', '中', '低'],
          datasets: [{
            data: [high, medium, low],
            backgroundColor: ['#E8A87C', '#E8C87C', '#A0B5A8'],
            borderRadius: 6,
            borderSkipped: false
          }]
        },
        options: {
          responsive: true,
          maintainAspectRatio: false,
          indexAxis: 'y',
          plugins: { legend: { display: false } },
          scales: {
            x: { beginAtZero: true, ticks: { stepSize: 1 }, grid: { color: '#E8F0EB' } },
            y: { grid: { display: false } }
          }
        }
      });
    }
  }

  _destroyPanel() {
    // Destroy charts
    Object.values(this.charts).forEach(chart => chart.destroy());
    this.charts = {};

    const panel = document.getElementById('detail-panel');
    panel.classList.add('hidden');
    const headerTitle = panel.querySelector('.detail-panel-title');
    headerTitle.textContent = '任务详情';
  }
}

window.StatsPanel = new StatsPanelModule();
```

- [ ] **Step 3: Commit**

```bash
cd "c:/Users/gv/Desktop/todolist"
git add src/js/stats.js src/index.html
git commit -m "feat: add statistics panel with Chart.js (donut, line, bar charts)"
```

---

### Task 10: Settings Panel

**Files:**
- Create: `src/js/settings.js`

**Interfaces:**
- SettingsPanel: toggle settings view in detail panel area, theme switcher, data path change, about info

- [ ] **Step 1: Write `src/js/settings.js`**

```js
class SettingsPanelModule {
  constructor() {
    this.visible = false;
  }

  init() {}

  toggle() {
    if (this.visible) {
      this.hide();
    } else {
      this.show();
    }
  }

  show() {
    this.visible = true;
    const panel = document.getElementById('detail-panel');
    const body = document.getElementById('detail-panel-body');
    const headerTitle = panel.querySelector('.detail-panel-title');
    headerTitle.textContent = '⚙️ 设置';
    panel.classList.remove('hidden');

    const settings = window.store.getSettings();
    const currentTheme = window.ThemeManager.getCurrent();
    const themes = window.ThemeManager.getThemes();

    body.innerHTML = `
      <div class="form-group">
        <label style="font-size:12px;color:var(--text-muted);display:block;margin-bottom:8px;">🎨 主题换肤</label>
        <div style="display:flex;gap:8px;" id="theme-buttons">
          ${themes.map(t => `
            <button class="btn ${t.id === currentTheme.id ? 'btn-primary' : 'btn-secondary'}"
                    data-theme="${t.id}" style="flex:1;flex-direction:column;gap:4px;padding:16px 8px;">
              <span style="font-size:24px;">${t.icon}</span>
              <span style="font-size:12px;">${t.name}</span>
            </button>
          `).join('')}
        </div>
      </div>

      <div class="form-group">
        <label style="font-size:12px;color:var(--text-muted);display:block;margin-bottom:4px;">📁 数据存储路径</label>
        <div style="display:flex;gap:8px;">
          <input type="text" class="input" id="settings-path" value="${settings.dataPath || ''}" readonly style="flex:1;">
          <button class="btn btn-secondary" id="change-path-btn">更改</button>
        </div>
      </div>

      <div class="form-group">
        <label style="font-size:12px;color:var(--text-muted);display:block;margin-bottom:4px;">💚 王源主题模式</label>
        <div style="display:flex;align-items:center;justify-content:space-between;">
          <span style="font-size:13px;">启用王源主题元素</span>
          <label style="position:relative;display:inline-block;width:44px;height:24px;">
            <input type="checkbox" id="wangyuan-toggle" ${settings.wangYuanMode ? 'checked' : ''}
                   style="opacity:0;width:0;height:0;">
            <span style="position:absolute;cursor:pointer;top:0;left:0;right:0;bottom:0;background:${settings.wangYuanMode ? 'var(--accent)' : 'var(--border)'};border-radius:24px;transition:300ms;"
                  id="toggle-bg"></span>
            <span style="position:absolute;content:'';height:18px;width:18px;left:${settings.wangYuanMode ? '23px' : '3px'};bottom:3px;background:white;border-radius:50%;transition:300ms;"
                  id="toggle-dot"></span>
          </label>
        </div>
      </div>

      <div class="form-group">
        <label style="font-size:12px;color:var(--text-muted);display:block;margin-bottom:4px;">💾 自动备份</label>
        <label style="position:relative;display:inline-block;width:44px;height:24px;">
          <input type="checkbox" id="autobackup-toggle" ${settings.autoBackup ? 'checked' : ''}
                 style="opacity:0;width:0;height:0;">
          <span style="position:absolute;cursor:pointer;top:0;left:0;right:0;bottom:0;background:${settings.autoBackup ? 'var(--accent)' : 'var(--border)'};border-radius:24px;transition:300ms;"></span>
          <span style="position:absolute;height:18px;width:18px;left:${settings.autoBackup ? '23px' : '3px'};bottom:3px;background:white;border-radius:50%;transition:300ms;"></span>
        </label>
      </div>

      <div style="margin-top:auto;padding-top:16px;border-top:1px solid var(--border-light);text-align:center;">
        <p style="font-size:13px;color:var(--text-secondary);">源计划 v1.0.0</p>
        <p style="font-size:11px;color:var(--text-muted);margin-top:4px;">王源主题待办清单</p>
        <p style="font-size:11px;color:var(--text-muted);">Made with 💚 for 小汤圆</p>
      </div>
    `;

    // Theme buttons
    document.getElementById('theme-buttons').addEventListener('click', async (e) => {
      const btn = e.target.closest('[data-theme]');
      if (!btn) return;
      const theme = btn.dataset.theme;
      window.ThemeManager.setTheme(theme);
      await window.store.saveSettings({ theme });
      this.show(); // re-render
    });

    // Change path
    document.getElementById('change-path-btn').addEventListener('click', async () => {
      const path = await window.electronAPI.selectDataPath();
      if (path) {
        await window.electronAPI.setDataPath(path);
        await window.store.saveSettings({ dataPath: path });
        document.getElementById('settings-path').value = path;
      }
    });

    // Wang Yuan mode toggle
    document.getElementById('wangyuan-toggle').addEventListener('change', async (e) => {
      await window.store.saveSettings({ wangYuanMode: e.target.checked });
      this.show();
    });

    // Auto backup toggle
    document.getElementById('autobackup-toggle').addEventListener('change', async (e) => {
      await window.store.saveSettings({ autoBackup: e.target.checked });
    });
  }

  hide() {
    this.visible = false;
    const panel = document.getElementById('detail-panel');
    panel.classList.add('hidden');
    const headerTitle = panel.querySelector('.detail-panel-title');
    headerTitle.textContent = '任务详情';
  }
}

window.SettingsPanel = new SettingsPanelModule();
```

- [ ] **Step 2: Commit**

```bash
cd "c:/Users/gv/Desktop/todolist"
git add src/js/settings.js
git commit -m "feat: add settings panel with theme switcher, path config, and toggles"
```

---

### Task 11: Animations (Notes, Particles, Transitions)

**Files:**
- Create: `src/js/animations.js`

**Interfaces:**
- Animations: `spawnNotes(x, y)` — spawns music note particles at position for completion celebration

- [ ] **Step 1: Write `src/js/animations.js`**

```js
class AnimationsModule {
  constructor() {
    this.enabled = true;
  }

  init() {
    const settings = window.store.getSettings();
    this.enabled = settings.wangYuanMode !== false;
    window.store.on('settings-change', (s) => {
      this.enabled = s.wangYuanMode !== false;
    });
  }

  spawnNotes(x, y) {
    if (!this.enabled) return;

    const notes = ['♪', '♫', '♬', '🎵', '🎶', '✨', '💚', '🍀'];
    const colors = ['#7BC8A4', '#5BA88A', '#8BC34A', '#D4EDE0'];

    for (let i = 0; i < 8; i++) {
      const note = document.createElement('span');
      note.textContent = notes[Math.floor(Math.random() * notes.length)];
      note.style.cssText = `
        position: fixed;
        left: ${x}px;
        top: ${y}px;
        font-size: ${14 + Math.random() * 16}px;
        color: ${colors[Math.floor(Math.random() * colors.length)]};
        pointer-events: none;
        z-index: 9999;
        opacity: 1;
        transition: all 800ms cubic-bezier(0.25, 0.46, 0.45, 0.94);
      `;
      document.body.appendChild(note);

      // Trigger animation in next frame
      requestAnimationFrame(() => {
        const angle = (Math.PI * 2 * i) / 8;
        const distance = 40 + Math.random() * 60;
        note.style.transform = `translate(${Math.cos(angle) * distance}px, ${Math.sin(angle) * distance - 50}px) rotate(${Math.random() * 360}deg)`;
        note.style.opacity = '0';
      });

      // Cleanup
      setTimeout(() => note.remove(), 850);
    }
  }

  fadeIn(element, duration = 200) {
    element.style.opacity = '0';
    element.style.transition = `opacity ${duration}ms ease`;
    requestAnimationFrame(() => { element.style.opacity = '1'; });
  }

  slideIn(element, from = 'right', duration = 250) {
    const offsets = { right: '20px', left: '-20px', top: '-20px', bottom: '20px' };
    element.style.opacity = '0';
    element.style.transform = `translate(${offsets[from] || '20px'})`;
    element.style.transition = `all ${duration}ms ease`;
    requestAnimationFrame(() => {
      element.style.opacity = '1';
      element.style.transform = 'translate(0)';
    });
  }
}

window.Animations = new AnimationsModule();
```

- [ ] **Step 2: Commit**

```bash
cd "c:/Users/gv/Desktop/todolist"
git add src/js/animations.js
git commit -m "feat: add animation system with note particles and transitions"
```

---

### Task 12: Integration Testing & Bug Fixes

**Files:**
- May modify any file

This task verifies the full app works end-to-end.

- [ ] **Step 1: Launch the app and verify startup flow**

```bash
cd "c:/Users/gv/Desktop/todolist"
npx electron . --no-sandbox
```

Manual checklist:
- [ ] Splash screen shows with random quote
- [ ] First-run setup appears (delete config in userData to test)
- [ ] Path selection dialog works
- [ ] Welcome screen shows
- [ ] Main app loads with sidebar, toolbar, empty task list

- [ ] **Step 2: Test core CRUD operations**

- Ctrl+N to add new todo → verify it appears in list
- Click todo → detail panel opens → edit title → verify auto-save
- Click checkbox → verify completion animation + strikethrough
- Delete todo → verify confirm bubble → verify undo toast

- [ ] **Step 3: Test categories**

- Click different categories in sidebar → verify list filters
- Add custom category → verify it appears
- Filter by all/active/completed → verify correct

- [ ] **Step 4: Test search & sort**

- Type in search → verify filtered results with highlights
- Change sort order → verify list reorders
- Clear search → verify all items return

- [ ] **Step 5: Test theme switching**

- Open settings → switch to 午后 → verify theme changes
- Switch to 夜幕 → verify dark mint theme
- Close and reopen → verify theme persists

- [ ] **Step 6: Test statistics**

- Click "今日完成" badge → verify stats panel
- Verify 4 stat cards show correct numbers
- Verify donut chart renders
- Verify trend chart renders

- [ ] **Step 7: Test drag & drop**

- Drag a task to a different position → verify reorder persists after refresh

- [ ] **Step 8: Fix any issues found and commit**

```bash
cd "c:/Users/gv/Desktop/todolist"
git add -A
git commit -m "fix: integration testing fixes and polish"
```

---

### Task 13: Final Polish & GitHub Push

**Files:**
- Modify: `package.json` (verify scripts)
- Create: `README.md`

- [ ] **Step 1: Write `README.md`**

```markdown
# 源计划 (Yuan Plan)

> 王源主题待办清单 — 简约薄荷，元气满满 💚

## 功能特色

- ✅ 完整的待办事项管理（增删改查、拖拽排序）
- 📂 四大预设分类：办公、生活、运动、饮食，支持自定义
- 🔴 三级优先级 + 截止日期 + 逾期提醒
- 🔍 实时搜索 + 多维度筛选排序
- 📊 数据统计面板（完成率、分类占比、周趋势、优先级分布）
- 🎨 三套薄荷绿主题换肤（晨露 / 午后 / 夜幕）
- 💚 王源元素融入（配色、语录、音符动效、四叶草空状态）
- 💾 数据本地存储，用户自选路径，自动备份

## 技术栈

- Electron 28
- 原生 HTML/CSS/JS
- Chart.js 数据可视化
- JSON 文件本地存储

## 开发运行

```bash
npm install
npm start
```

## 打包

```bash
npm run build:win
```

## 许可

MIT License

---

Made with 💚 for 小汤圆
```

- [ ] **Step 2: Final push to GitHub**

```bash
cd "c:/Users/gv/Desktop/todolist"
git add README.md
git commit -m "docs: add README with features and setup instructions"
git push -u origin main
```

- [ ] **Step 3: Verify GitHub repo**

```bash
gh repo view CurryKernel/todolist --web
```

Expected: Repository page opens with all files visible.

---

## Self-Review Checklist

1. **Spec coverage:** Every spec section (4.1-4.7) maps to at least one task:
   - CRUD (4.1) → Tasks 7, 8
   - Categories (4.2) → Tasks 4, 6
   - Priority & dates (4.3) → Tasks 6, 7, 8
   - Search & filter (4.4) → Task 6
   - Statistics (4.5) → Task 9
   - Themes (4.6) → Tasks 3, 10
   - First-run setup (4.7) → Tasks 2, 5

2. **Placeholder scan:** No TBD/TODO, no vague "add error handling" — all steps have concrete code.

3. **Type consistency:** Method names are consistent across tasks:
   - `window.store.addTodo()`, `window.store.toggleTodo()`, etc.
   - `window.ThemeManager.setTheme()`, `window.Sidebar.init()`, etc.
   - All IPC method names match between main.js and preload.js.

4. **File paths:** All paths match the directory structure; every JS file is included in index.html's script tags.

---

*Plan written on 2026-07-16*
