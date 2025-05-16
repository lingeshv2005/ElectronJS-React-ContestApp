const { app, BrowserWindow } = require('electron');
const path = require('path');

let mainWindow;
let deeplinkingUrl;

const isDev = !app.isPackaged;

if (isDev) {
  try {
    require('electron-reload')(__dirname, {
      electron: require(path.join(__dirname, 'node_modules', 'electron')),
      hardResetMethod: 'exit',
      watchRenderer: true,
      // Optional: You can watch other folders like React's dist/build:
      // paths: [path.join(__dirname, 'dist')],
    });
    console.log("✅ electron-reload enabled");
  } catch (err) {
    console.error("⚠️ electron-reload failed:", err);
  }
}

const gotTheLock = app.requestSingleInstanceLock();
if (!gotTheLock) {
  app.quit()
  return
}

app.on('second-instance', (e, argv) => {
  if (process.platform == 'win32') {
    deeplinkingUrl = argv.slice(1).join(' ');
  }
  logEverywhere(`second-instance URL: ${deeplinkingUrl}`)

  if (mainWindow) {
    if (mainWindow.isMinimized()) mainWindow.restore()
    mainWindow.focus()
  }
})
let cachedUserId = null;
let cachedContestId = null;

function createWindow() {
  mainWindow = new BrowserWindow({
    fullscreen: true,
    webPreferences: {
      preload: path.join(__dirname, 'preload.js'),
      contextIsolation: true,
      nodeIntegration: true,
    },
  });

  if (isDev) {
    mainWindow.loadURL('http://localhost:5173');
    mainWindow.webContents.openDevTools();
  } else {
    mainWindow.loadFile(path.join(__dirname, 'dist', 'index.html'));
  }

  if (process.platform == 'win32') {
    deeplinkingUrl = process.argv.slice(1).join(' ');
  }
  logEverywhere(`createWindow URL: ${deeplinkingUrl}`)


async function reportCheating(reason, details = '') {
  if (!cachedUserId || !cachedContestId) {
    console.warn('🚫 userId or contestId not cached yet');
    return;
  }

  const cheating = {
    reason,
    timestamp: new Date().toISOString(),
    details
  };

  try {
    await fetch('https://leetcode-tracker-backend-user.onrender.com/contest/cheat', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ userId: cachedUserId, contestId: cachedContestId, cheating }),
    });
    console.log('🚨 Cheating reported:', reason);
  } catch (err) {
    console.error('❌ Failed to report cheating:', err);
  }
}

function waitForLocalStorageKeys() {
  const interval = setInterval(async () => {
    try {
      const userId = await mainWindow.webContents.executeJavaScript(`localStorage.getItem('userId')`);
      const contestId = await mainWindow.webContents.executeJavaScript(`localStorage.getItem('contestId')`);

      if (userId && contestId) {
        cachedUserId = userId;
        cachedContestId = contestId;
        console.log('✅ Cached userId and contestId:', cachedUserId, cachedContestId);
        clearInterval(interval);
      }
    } catch (err) {
      console.error('❌ Failed to fetch from localStorage:', err);
    }
  }, 1000); 
}

mainWindow.webContents.on('did-finish-load', () => {
  waitForLocalStorageKeys(); 
});

mainWindow.on('close', (e) => {
  if (cachedUserId && cachedContestId) {
    e.preventDefault();
    
    reportCheating('window-closed', 'User closed or exited the contest window')
      .finally(() => {
        mainWindow.destroy(); 
      });
  }
});

mainWindow.on('blur', () => {
  reportCheating('window-blur', 'User moved focus out of the contest window');
});

mainWindow.webContents.on('before-input-event', async (event, input) => {
  if (input.key === 'Escape') {
    event.preventDefault();
  }
});

mainWindow.webContents.on('devtools-opened', () => {
  console.log('🚫 DevTools opened - closing it');
  mainWindow.webContents.closeDevTools();
});
}

app.whenReady().then(() => {
  createWindow();

  app.on('open-url', (event, url) => {
    event.preventDefault();
    deeplinkingUrl = url;
    logEverywhere(`open-url: ${deeplinkingUrl}`)

    if (mainWindow) {
      mainWindow.webContents.send('deep-link', url);  // Send the deep link to renderer
    }

  });
});

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') app.quit();
});

app.on('activate', () => {
  if (mainWindow === null) {
    createWindow()
  }
})

if (!app.isDefaultProtocolClient('leetcode-tracker')) {
  app.setAsDefaultProtocolClient('leetcode-tracker');
}

function logEverywhere(message) {
  console.log(message)
  if (mainWindow && mainWindow.webContents) {
    mainWindow.webContents.executeJavaScript(`console.log("${message.replace(/"/g, '\\"')}")`);
  }
}
