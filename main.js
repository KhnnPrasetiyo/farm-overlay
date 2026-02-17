const { app, BrowserWindow, ipcMain } = require("electron");
const activeWin = require("active-win");

let win;
let monitoring;
let isRunning = false;

// GANTI sesuai nama exe game kamu
let gameProcessName = "MapleStory.exe";

function createWindow() {
  win = new BrowserWindow({
    width: 280,
    height: 180,
    frame: false,
    transparent: true,
    resizable: false,
    alwaysOnTop: true,
    webPreferences: {
      nodeIntegration: true,
      contextIsolation: false
    }
  });

  win.setAlwaysOnTop(true, "screen-saver");
  win.loadFile("index.html");
}

ipcMain.on("set-running", (e, state) => {
  isRunning = state;
});

ipcMain.on("toggle-clickthrough", (e, enabled) => {
  win.setIgnoreMouseEvents(enabled, { forward: true });
});

ipcMain.on("shake-window", () => {
  const [startX, startY] = win.getPosition();
  let i = 0;

  const shaker = setInterval(() => {
    const offset = i % 2 === 0 ? -10 : 10;
    win.setPosition(startX + offset, startY);
    i++;

    if (i > 15) {
      clearInterval(shaker);
      win.setPosition(startX, startY);
    }
  }, 30);
});

// Monitor game focus
function startMonitoring() {
  monitoring = setInterval(async () => {
    const active = await activeWin();
    if (!active) return;

    const isGameActive = active.owner.name === gameProcessName;

    if (!isGameActive && isRunning) {
      win.webContents.send("auto-stop");
    }
  }, 1000);
}

app.whenReady().then(() => {
  createWindow();
  startMonitoring();
});
