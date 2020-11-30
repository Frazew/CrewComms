'use strict'

import {app, BrowserWindow, ipcMain} from 'electron'
import {bind} from 'kr-udp-proxy';
import {AmongUsProxy} from "./AmongUsProxy";
import {PlayerColor} from "@among-js/data";
import {AmongUsSocket} from '@among-js/sus';
import AmongUsState, {PlayerAudioSettings} from "./AmongUsState";
import {format as formatUrl} from "url";
import path from "path";
import DiscordRPC from "./DiscordRPC";
import {Vector2} from '@among-js/util';
import Store from 'electron-store';

const isDevelopment = process.env.NODE_ENV !== 'production'

export interface ConfigSchema {
  accessToken: {
    type: string,
  }
}

let configStore = new Store<ConfigSchema>({
  schema: {
    accessToken: {
      type: "string",
      default: ''
    }
  }
});

// global reference to mainWindow (necessary to prevent window from being garbage collected)
let mainWindow: BrowserWindow | null;

function createMainWindow(): BrowserWindow {
  let options = {
    width: 500,
    height: 600,
    resizable: false,
    maximizable: false,
    frame: false,
    webPreferences: {
      nodeIntegration: true,
      enableRemoteModule: true,
      webSecurity: false
    }
  }
  if (isDevelopment) {
    options.resizable = true;
  }
  const window = new BrowserWindow(options)

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
      socket.joinGame('XZNNDO').then(() => {
        setTimeout(function() {socket.spawn(PlayerColor.Lime)}, 1000);
        setTimeout(function() {socket.move(new Vector2(-0.3, 2.4), new Vector2(0, -2))}, 2000);
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
  if (mainWindow === null || mainWindow === undefined) {
    mainWindow = createMainWindow()
  }
})

// create main BrowserWindow when electron is ready
app.on('ready', () => {
  if (mainWindow === null || mainWindow === undefined) {
    mainWindow = createMainWindow();
  }
});

ipcMain.on('quit', () => {
  // @ts-ignore
  mainWindow.close();
})

ipcMain.on('ready', (event) => {
  const amongUsState = new AmongUsState(event.reply);
  const discordRPC = new DiscordRPC(event.reply, configStore);

  amongUsState.on('updatePlayerAudio', (playerAudio: PlayerAudioSettings) => {
    discordRPC.setUserAudio(playerAudio.playerName, playerAudio.volume, 1 - playerAudio.balance, playerAudio.balance);
  })

  ipcMain.on('discordLogin', () => {
    discordRPC.connect();
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
  if (isDevelopment) {
    createDummies();
  }
})
