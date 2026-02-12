const { app, BrowserWindow, Menu, ipcMain } = require('electron');
const path = require('path');
const fs = require('fs');
const express = require('express');
const { createProxyMiddleware } = require('http-proxy-middleware');

// Start local server with Ollama proxy
const expressApp = express();
const PORT = 9876;

// Serve static files (MIND app)
expressApp.use(express.static(path.join(__dirname, 'app')));

// Proxy Ollama requests to bypass CORS
expressApp.use('/ollama', createProxyMiddleware({
  target: 'http://localhost:11434',
  changeOrigin: true,
  pathRewrite: { '^/ollama': '' },
  onProxyReq: (proxyReq, req) => {
    console.log('Proxying Ollama request:', req.method, req.path);
  }
}));

// Start server and store the HTTP server instance
const server = expressApp.listen(PORT, () => {
  console.log(`MIND server running at http://localhost:${PORT}`);
});

// Backup source files (main.js, preload.js, package.json, app/index.html)
ipcMain.handle('backup-source-files', async () => {
  try {
    const appPath = __dirname;
    const now = new Date();
    const dateStr = now.toLocaleDateString('en-GB', { day: '2-digit', month: '2-digit', year: '2-digit' }).replace(/\//g, '-');
    const timeStr = now.toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit', hour12: false }).replace(':', '');
    
    const backupDir = path.join(appPath, 'app', 'Backups', dateStr, timeStr);
    
    // Create backup directory
    fs.mkdirSync(backupDir, { recursive: true });
    
    // Files to backup
    const filesToBackup = [
      { src: path.join(appPath, 'main.js'), dest: path.join(backupDir, 'main.js') },
      { src: path.join(appPath, 'preload.js'), dest: path.join(backupDir, 'preload.js') },
      { src: path.join(appPath, 'package.json'), dest: path.join(backupDir, 'package.json') },
      { src: path.join(appPath, 'app', 'index.html'), dest: path.join(backupDir, 'index.html') }
    ];
    
    // Copy each file
    for (const { src, dest } of filesToBackup) {
      if (fs.existsSync(src)) {
        fs.copyFileSync(src, dest);
      }
    }
    
    return { success: true, path: backupDir };
  } catch (error) {
    console.error('Backup failed:', error);
    return { success: false, error: error.message };
  }
});

// Get latest backup path
ipcMain.handle('get-latest-backup', async () => {
  try {
    const appPath = __dirname;
    const backupsDir = path.join(appPath, 'app', 'Backups');
    
    if (!fs.existsSync(backupsDir)) {
      return { success: false, error: 'No backups found' };
    }
    
    // Get all date folders
    const dateFolders = fs.readdirSync(backupsDir)
      .filter(f => fs.statSync(path.join(backupsDir, f)).isDirectory())
      .sort();
    
    if (dateFolders.length === 0) {
      return { success: false, error: 'No backups found' };
    }
    
    const latestDate = dateFolders[dateFolders.length - 1];
    const timeFolders = fs.readdirSync(path.join(backupsDir, latestDate))
      .filter(f => fs.statSync(path.join(backupsDir, latestDate, f)).isDirectory())
      .sort();
    
    if (timeFolders.length === 0) {
      return { success: false, error: 'No backups found' };
    }
    
    const latestBackup = path.join(backupsDir, latestDate, timeFolders[timeFolders.length - 1]);
    const files = fs.readdirSync(latestBackup);
    
    return { success: true, path: latestBackup, files };
  } catch (error) {
    return { success: false, error: error.message };
  }
});

// Create Electron window
function createWindow() {
  const mainWindow = new BrowserWindow({
    width: 1400,
    height: 900,
    minWidth: 800,
    minHeight: 600,
    title: 'MIND AI',
    icon: path.join(__dirname, 'app', 'icon.png'),
    webPreferences: {
      nodeIntegration: false,
      contextIsolation: true,
      spellcheck: true,
      preload: path.join(__dirname, 'preload.js')
    }
  });

  // Load the app
  mainWindow.loadURL(`http://localhost:${PORT}`);

  // Enable spell check context menu
  mainWindow.webContents.on('context-menu', (event, params) => {
    const menu = Menu.buildFromTemplate([
      ...(params.isEditable ? [{
        label: 'Cut',
        role: 'cut'
      }, {
        label: 'Copy',
        role: 'copy'
      }, {
        label: 'Paste',
        role: 'paste'
      }, { type: 'separator' }] : []),
      ...(params.misspelledWord ? [{
        label: `Add "${params.misspelledWord}" to dictionary`,
        click: () => {
          mainWindow.webContents.session.addWordToSpellCheckerDictionary(params.misspelledWord);
        }
      }, { type: 'separator' }] : []),
      ...params.dictionarySuggestions.map(suggestion => ({
        label: suggestion,
        click: () => {
          mainWindow.webContents.replaceMisspelling(suggestion);
        }
      })),
      ...(params.dictionarySuggestions.length > 0 ? [{ type: 'separator' }] : []),
      {
        label: 'Inspect Element',
        click: () => {
          mainWindow.webContents.inspectElement(params.x, params.y);
        }
      }
    ]);
    menu.popup();
  });

  // Open DevTools in development
  // mainWindow.webContents.openDevTools();
}

// App event handlers
app.whenReady().then(() => {
  createWindow();

  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) {
      createWindow();
    }
  });
});

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit();
  }
});

// Cleanup on quit
app.on('quit', () => {
  console.log('Shutting down MIND server...');
  if (server && typeof server.close === 'function') {
    server.close();
  }
});
