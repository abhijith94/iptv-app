const { contextBridge, ipcRenderer } = require('electron');

contextBridge.exposeInMainWorld('electron', {
  ipcRenderer: {
    on(channel, func) {
      const validChannels = [];
      if (validChannels.includes(channel)) {
        // Deliberately strip event as it includes `sender`
        ipcRenderer.on(channel, (event, ...args) => func(...args));
      }
    },
    once(channel, func) {
      const validChannels = [];
      if (validChannels.includes(channel)) {
        // Deliberately strip event as it includes `sender`
        ipcRenderer.once(channel, (event, ...args) => func(...args));
      }
    },
    invoke(channel, args) {
      const validChannels = [
        'add-new-playlist',
        'fetch-all-playlists',
        'delete-playlist',
        'update-playlist',
        'fetch-channels',
        'fetch-favourite-channels',
        'search-channels',
        'set-channel-favourite-prop',
        'save-playlist-edit',
      ];
      if (validChannels.includes(channel)) {
        // Deliberately strip event as it includes `sender`
        return ipcRenderer.invoke(channel, args);
      }
      return Promise.resolve(null);
    },
  },
});
