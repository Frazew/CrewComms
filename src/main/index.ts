'use strict'

import {app, BrowserWindow, ipcMain} from 'electron'
import {bind} from 'kr-udp-proxy';
import {AmongUsProxy} from "./AmongUsProxy";
import {PlayerColor} from "@among-js/data";
import {AmongUsSocket} from '@among-js/sus';
import AmongUsState from "./AmongUsState";
import {format as formatUrl} from "url";
import path from "path";
//import DiscordRPC from "./DiscordRPC";

const isDevelopment = process.env.NODE_ENV !== 'production'

// global reference to mainWindow (necessary to prevent window from being garbage collected)
let mainWindow: BrowserWindow | null;

function createMainWindow(): BrowserWindow {
  const window = new BrowserWindow({
    webPreferences: {
      nodeIntegration: true,
      enableRemoteModule: true,
      webSecurity: false
    }
  })

  if (isDevelopment) {
    window.webContents.openDevTools()
  }

  if (isDevelopment) {
    window.loadURL(`http://localhost:${process.env.ELECTRON_WEBPACK_WDS_PORT}`)
  }
  else {
    window.loadURL(formatUrl({
      pathname: path.join(__dirname, 'index.html'),
      protocol: 'file',
      slashes: true
    }))
  }

  window.on('closed', () => {
    mainWindow = null
  })

  window.webContents.on('devtools-opened', () => {
    window.focus()
    setImmediate(() => {
      window.focus()
    })
  })

  return window
}

async function createDummies() {
  for (let i = 0; i < 1; i++) {
    let socket = new AmongUsSocket('Dummy' + i);
    socket.connect(i == 0 ? 22024 : 22023, "localhost").then(() => {
      socket.joinGame('NGVSLO').then(() => {
        setTimeout(function() {socket.spawn(PlayerColor.Lime)}, 1000);
      })
    })
  }
}
// quit application when all windows are closed
app.on('window-all-closed', () => {
  // on macOS it is common for applications to stay open until the user explicitly quits
  if (process.platform !== 'darwin') {
    app.quit()
  }
})

app.on('activate', () => {
  // on macOS it is common to re-create a window even after all windows have been closed
  if (mainWindow === null) {
    mainWindow = createMainWindow()
  }
})

// create main BrowserWindow when electron is ready
app.on('ready', () => {
  mainWindow = createMainWindow();

  const amongUsState = new AmongUsState();
  //const discordRPC = new DiscordRPC();
  //discordRPC.connect();

  ipcMain.on('discordLogin', () => {
    console.log("login");
  })
  bind(() => new AmongUsProxy(amongUsState), {
    // fromAddress: '0.0.0.0',
    fromPort: 22024,
    toAddress: "localhost", //matchmakingServers.EU[1],
    toPort: 22023,
    // keepPortTimeout: 10000,
    sync: true
    // onError: err=>{ console.error(err); }
  });
  createDummies();
})
