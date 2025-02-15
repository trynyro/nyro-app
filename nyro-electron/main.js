const { app, BrowserWindow, screen, ipcMain, globalShortcut, clipboard } = require('electron');
const path = require('path');
const clipboardExtended = require('electron-clipboard-extended');
const os = require('os');
const { exec } = require('child_process');
const isDev = process.env.NODE_ENV !== 'production';
const { PowerShell } = require("node-powershell");
const fs = require('fs').promises;
const { autoUpdater } = require("electron-updater");

let mainWindow;
let isProcessingShortcut = false;
let isRetracted = false;
let lastExpandedPosition = null;
let lastSize = null;
let shortcutTimeout = null;
let isPinned = false;
autoUpdater.autoDownload = false;
autoUpdater.autoInstallOnAppQuit = true;

const WINDOW_WIDTH = 255;
const WINDOW_HEIGHT = 445;
const RETRACTED_WIDTH = 30;
const RETRACTED_HEIGHT = 150;

function resetPosition() {
  if (mainWindow) {
    const { width, height } = screen.getPrimaryDisplay().workAreaSize;
    const x = Math.floor(width - WINDOW_WIDTH);
    const y = Math.floor((height - WINDOW_HEIGHT) / 2);
    mainWindow.webContents.send('resize', { width: WINDOW_WIDTH, height: WINDOW_HEIGHT });
    mainWindow.setSize(WINDOW_WIDTH, WINDOW_HEIGHT);
    mainWindow.setPosition(x, y);
    isRetracted = false;
    mainWindow.webContents.send('retraction-state-changed', isRetracted);
  }
}

function retractWindow() {
  if (!mainWindow) {
    return false;
  }
  const currentDisplay = screen.getDisplayMatching(mainWindow.getBounds());
  const { width, height } = screen.getPrimaryDisplay().workAreaSize;

  try {
    lastExpandedPosition = mainWindow.getPosition();
    lastSize = mainWindow.getSize();

    const retractedX = currentDisplay.workArea.x + width - RETRACTED_WIDTH;
    const retractedY = Math.round((height - RETRACTED_HEIGHT) / 2);
    mainWindow.setPosition(retractedX, retractedY);
    mainWindow.setSize(RETRACTED_WIDTH, RETRACTED_HEIGHT);
    
    isRetracted = true;
    mainWindow.webContents.send('retraction-state-changed', isRetracted, RETRACTED_WIDTH, RETRACTED_HEIGHT);
    return true;
  } catch (error) {
    return false;
  }
}

function expandWindow() {
  if (!mainWindow) {
    return false;
  }

  const { width, height } = screen.getPrimaryDisplay().workAreaSize;
  try {
    mainWindow.webContents.send('retraction-state-changed', isRetracted);
    
    if (lastExpandedPosition && lastExpandedPosition[0] !== undefined && lastExpandedPosition[1] !== undefined) {
      mainWindow.setPosition(lastExpandedPosition[0], lastExpandedPosition[1]);
      mainWindow.setSize(lastSize[0], lastSize[1]);
      mainWindow.webContents.send("resize", { width: lastSize[0], height: lastSize[1] })
    } else {
      mainWindow.webContents.send('resize', { width: WINDOW_WIDTH, height: WINDOW_HEIGHT });
      mainWindow.setSize(WINDOW_WIDTH, WINDOW_HEIGHT);
      const expandedX = width - WINDOW_WIDTH - 10;
      const expandedY = height - WINDOW_HEIGHT - 10;
      mainWindow.setPosition(expandedX, expandedY);
    }

    isRetracted = false;
    return true;
  } catch (error) {
    return false;
  }
}


function createWindow() {
  const { width, height } = screen.getPrimaryDisplay().workAreaSize;

  const initialX = width - WINDOW_WIDTH - 10;
  const initialY = Math.round((height - WINDOW_HEIGHT) / 2);

  mainWindow = new BrowserWindow({
    width: WINDOW_WIDTH + 2,
    height: WINDOW_HEIGHT + 50,
    x: initialX,
    y: initialY,
    webPreferences: {
      preload: path.join(__dirname, 'preload.js'), 
      contextIsolation: true,
      enableRemoteModule: false,
    },
    icon: path.join(__dirname, 'favicon.ico'),
    frame: false,
    resizable: true,
    transparent: true,
    alwaysOnTop: true,
    hasShadow: false,
    focusable: true,
    fullscreenable: false,
  });

  lastExpandedPosition = [initialX, initialY];
  mainWindow.loadURL(
    isDev
      ? "http://localhost:3000"
      : `file://${path.join(__dirname, '../renderer/build/index.html')}`
  );

  ipcMain.on('windowDrag', (event, { deltaX, deltaY }) => {
    if (!isPinned && mainWindow) {
      const [currentX, currentY] = mainWindow.getPosition();
      mainWindow.setPosition(currentX + deltaX, currentY + deltaY);
    }
  });

  ipcMain.on('toggle-pin', (event, pinState) => {
    isPinned = pinState;
    if (mainWindow) {
      mainWindow.setMovable(!isPinned);
    }
    event.reply('pin-state-changed', isPinned);
  });

  mainWindow.on("will-resize", (event, newBounds) => {
    if (!isRetracted) {
      if (newBounds.width < WINDOW_WIDTH) {
        event.preventDefault();
        mainWindow.webContents.send("resize", { width: WINDOW_WIDTH, height: newBounds.height })
        mainWindow.setSize(WINDOW_WIDTH, newBounds.height);
      }
      else if (newBounds.height < WINDOW_HEIGHT) {
        event.preventDefault();
        mainWindow.webContents.send("resize", { width: newBounds.width, height: WINDOW_HEIGHT })
        mainWindow.setSize(newBounds.width, WINDOW_HEIGHT);
      } else {
        mainWindow.webContents.send("resize", { width: newBounds.width, height: newBounds.height })
        mainWindow.setSize(newBounds.width, newBounds.height);
      }
    } else {
      event.preventDefault();
    }
  });

  clipboardExtended.startWatching();

  setInterval(() => {
    const [x, y] = mainWindow.getPosition();
    const { width: screenWidth, height: screenHeight } = screen.getPrimaryDisplay().workAreaSize;

    if (x > screenWidth - 20) {
      mainWindow.setPosition(screenWidth - 20, y);
    }
    if (y < 0) {
      mainWindow.setPosition(x, 0);
    }
    if (y > screenHeight - 20) {
      mainWindow.setPosition(x, screenHeight - 20);
    }
  }, 1000);

  mainWindow.on('closed', () => {
    mainWindow = null;
  });

  ipcMain.handle('retract-window', async (event) => {
    return retractWindow();
  });

  ipcMain.handle('expand-window', async (event) => {
    return expandWindow();
  });
}

autoUpdater.on("update-available", (info) => {
  mainWindow.webContents.send("size", { txt: `No update available. Current version ${app.getVersion()}` });
  mainWindow.webContents.send("updateMessage", `Update available. Current version ${app.getVersion()}`);
  let pth = autoUpdater.downloadUpdate();
  mainWindow.webContents.send("updateMessage", pth);
});

autoUpdater.on("update-not-available", (info) => {
  try{
    mainWindow.webContents.send("size", { txt: `No update available. Current version ${app.getVersion()}` });
    mainWindow.webContents.send("updateMessage", `No update available. Current version ${app.getVersion()}`);
  } catch (error) {
    console.log("Error in update-not-available. " + error);
  }
});

autoUpdater.on("update-downloaded", (info) => {
  mainWindow.webContents.send("updateMessage", `Update downloaded. Current version ${app.getVersion()}`);
});

autoUpdater.on("error", (info) => {
  mainWindow.webContents.send("updateMessage", info);
});

async function getSelectedText() {
  const platform = os.platform();

  let selectedText = '';
  if (platform === 'win32') {
    try {
      const ps = new PowerShell({
        executionPolicy: 'Bypass',
        noProfile: true
      });

      const command = PowerShell.$`
        Add-Type -AssemblyName System.Windows.Forms
        $currentClipboard = [System.Windows.Forms.Clipboard]::GetText()
        [System.Windows.Forms.SendKeys]::SendWait('^c')
        Start-Sleep -Milliseconds 200
        $newClipboard = [System.Windows.Forms.Clipboard]::GetText()
        if ($newClipboard -ne $currentClipboard) {
          $text = $newClipboard
        } else {
          [System.Windows.Forms.SendKeys]::SendWait('^{INSERT}')
          Start-Sleep -Milliseconds 200
          $text = [System.Windows.Forms.Clipboard]::GetText()
        }
        [System.Windows.Forms.Clipboard]::Clear()
        $text
      `;

      const output = await command;
      await ps.dispose();
      
      selectedText = output.raw.trim() || '';
    } catch (error) {
      console.error('PowerShell execution error:', error);
    }
  } else if (platform === 'darwin') {
    try {
      const script = `
        osascript -e '
          set currentClipboard to the clipboard
          tell application "System Events" to keystroke "c" using command down
          delay 0.2
          set newClipboard to the clipboard
          if newClipboard is not equal to currentClipboard then
            set clipboard_content to newClipboard
          else
            set clipboard_content to currentClipboard
          end if
          set the clipboard to ""
          return clipboard_content
        '
      `;
      const { stdout } = await new Promise((resolve, reject) => {
        exec(script, (error, stdout, stderr) => {
          if (error) reject(error);
          else resolve({ stdout, stderr });
        });
      });
      selectedText = stdout.trim();
    } catch (error) {
      console.error('AppleScript execution error:', error);
    }
  }

  return selectedText;
}

app.whenReady().then(() => {
  createWindow();

  ipcMain.on('toggle-retract', (event) => {
    if (!isPinned) {
      toggleRetract();
    }
  });


  globalShortcut.register('CommandOrControl+Shift+R', () => {
    try {
      resetPosition();
    } catch (error) {
      console.error('Error in resetPosition:', error);
    }
  });

  const shortcutRegistered = globalShortcut.register('CommandOrControl+Shift+1', async () => {
    if (isProcessingShortcut) {
      return;
    }
    isProcessingShortcut = true;
    clearTimeout(shortcutTimeout);

    try {
      const selectedText = await getSelectedText();
      if (selectedText && selectedText.trim() !== '') {
        mainWindow.webContents.send('insert-selected-text', selectedText.trim());
      }
    } catch (error) {
      console.error('Error getting selected text:', error);
    } finally {
      shortcutTimeout = setTimeout(() => {
        isProcessingShortcut = false;
      }, 300);
    }
  });

  globalShortcut.register('CommandOrControl+Shift+2', async () => {
    try {
      const clipboardImage = clipboard.readImage();
      if (!clipboardImage.isEmpty()) {
        const imageBuffer = clipboardImage.toPNG();
        const base64Image = `data:image/png;base64,${imageBuffer.toString('base64')}`;
        mainWindow.webContents.send('insert-selected-image', base64Image);
      }
    } catch (error) {
      console.error('Error in captureSelectedArea:', error);
    }
  });

  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) {
      createWindow();
    }
  });

  autoUpdater.checkForUpdates();
});

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit();
  }
});

app.on('will-quit', () => {
  globalShortcut.unregisterAll();
  clipboardExtended.stopWatching();
});