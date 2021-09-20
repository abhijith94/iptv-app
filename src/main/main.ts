import 'core-js/stable';
import 'regenerator-runtime/runtime';
import path from 'path';
import { app, BrowserWindow, ipcMain, dialog } from 'electron';
import { autoUpdater } from 'electron-updater';
import log from 'electron-log';
import MenuBuilder from './menu';
import { resolveHtmlPath } from './util';
import M3UParser from './m3uParser';

app.commandLine.appendSwitch('disable-features', 'OutOfBlinkCors');

const gotTheLock = app.requestSingleInstanceLock();

export default class AppUpdater {
  constructor() {
    log.transports.file.level = 'info';
    autoUpdater.logger = log;
    autoUpdater.checkForUpdatesAndNotify();
  }
}

let mainWindow: BrowserWindow | null = null;

if (process.env.NODE_ENV === 'production') {
  const sourceMapSupport = require('source-map-support');
  sourceMapSupport.install();
}

const isDevelopment =
  process.env.NODE_ENV === 'development' || process.env.DEBUG_PROD === 'true';

if (isDevelopment) {
  require('electron-debug')();
}

const installExtensions = async () => {
  const installer = require('electron-devtools-installer');
  const forceDownload = !!process.env.UPGRADE_EXTENSIONS;
  const extensions = ['REACT_DEVELOPER_TOOLS'];

  return installer
    .default(
      extensions.map((name) => installer[name]),
      forceDownload
    )
    .catch(console.log);
};

const createWindow = async () => {
  if (
    process.env.NODE_ENV === 'development' ||
    process.env.DEBUG_PROD === 'true'
  ) {
    await installExtensions();
  }

  const RESOURCES_PATH = app.isPackaged
    ? path.join(process.resourcesPath, 'assets')
    : path.join(__dirname, '../../assets');

  const getAssetPath = (...paths: string[]): string => {
    return path.join(RESOURCES_PATH, ...paths);
  };

  mainWindow = new BrowserWindow({
    show: false,
    width: 1024,
    height: 728,
    minWidth: 1000,
    minHeight: 700,
    icon: getAssetPath('icon.png'),
    autoHideMenuBar: true,
    webPreferences: {
      preload: path.join(__dirname, 'preload.js'),
    },
  });

  mainWindow.loadURL(resolveHtmlPath('index.html'));

  // @TODO: Use 'ready-to-show' event
  //        https://github.com/electron/electron/blob/main/docs/api/browser-window.md#using-ready-to-show-event
  mainWindow.webContents.on('did-finish-load', () => {
    if (!mainWindow) {
      throw new Error('"mainWindow" is not defined');
    }
    if (process.env.START_MINIMIZED) {
      mainWindow.minimize();
    } else {
      mainWindow.show();
      mainWindow.focus();
      mainWindow.maximize();
    }
    // mainWindow.webContents.closeDevTools();
  });

  mainWindow.on('closed', () => {
    mainWindow = null;
  });

  const menuBuilder = new MenuBuilder(mainWindow);
  menuBuilder.buildMenu();
};

/**
 * Add event listeners...
 */

app.on('window-all-closed', () => {
  // Respect the OSX convention of having the application in memory even
  // after all windows have been closed
  if (process.platform !== 'darwin') {
    app.quit();
  }
});

if (!gotTheLock) {
  app.quit();
} else {
  app.on('second-instance', (e, c, wd) => {
    // Someone tried to run a second instance, we should focus our window.
    if (mainWindow) {
      if (mainWindow.isMinimized()) mainWindow.restore();
      mainWindow.focus();
    }
  });

  // Create myWindow, load the rest of the app, etc...
  app.whenReady().then(createWindow).catch(console.log);
}

app.on('activate', () => {
  // On macOS it's common to re-create a window in the app when the
  // dock icon is clicked and there are no other windows open.
  if (mainWindow === null) createWindow();
});

/**
 * Other ipc event listeners and handlers
 */
ipcMain.handle('add-new-playlist', async (_e, { url, title }) => {
  const m3uParser = new M3UParser(url, title);
  const playlist = await m3uParser.fetchPlaylist();

  if (playlist !== null) {
    return m3uParser.savePlaylistToDisk(playlist);
  }
  return 'PLAYLIST_PARSING_FAILED';
});

ipcMain.handle('fetch-all-playlists', () => {
  return M3UParser.getAllPlaylists();
});

ipcMain.handle('delete-playlist', async (_e, id: number) => {
  if (mainWindow !== undefined && mainWindow !== null) {
    const value = await dialog.showMessageBox(mainWindow, {
      title: 'Delete',
      buttons: ['Yes', 'Cancel'],
      message: 'Do you really want to delete?',
    });
    if (value.response === 0) {
      M3UParser.deletePlaylist(id);
      return 'PLAYLIST_DELETED';
    }
    return null;
  }
  return null;
});

ipcMain.handle('update-playlist', async (_e, id: number) => {
  return M3UParser.updatePlaylist(id);
});

ipcMain.handle('fetch-channels', async (_e, pid) => {
  const data = M3UParser.fetchChannels(pid);
  return data;
});

ipcMain.handle('fetch-favourite-channels', async (_e, pid) => {
  const data = M3UParser.fetchFavouriteChannels(pid);
  return data;
});

ipcMain.handle('search-channels', async (_e, { pid, channelName }) => {
  const data = M3UParser.searchChannels(pid, channelName);
  return data;
});

ipcMain.handle(
  'set-channel-favourite-prop',
  async (_e, { pid, channelId, isFavourite }) => {
    M3UParser.setChannelFavouriteProp(pid, channelId, isFavourite);
    return true;
  }
);

ipcMain.handle('save-playlist-edit', async (_e, { url, title, pid }) => {
  return M3UParser.editPlaylist(pid, title, url);
});
