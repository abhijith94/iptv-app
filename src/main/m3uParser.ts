import axios from 'axios';
import { parse, Playlist } from 'iptv-playlist-parser';
import Store from 'electron-store';

export default class M3UParser {
  fileType: string;

  url: string;

  title: string;

  constructor(url: string, title: string) {
    this.fileType = '';
    this.url = url;
    this.title = title;
  }

  async fetchPlaylist() {
    try {
      if (this.url && this.url.match(/^https?:\/\/.*\.m3u8?/g)) {
        const data = await axios.get(this.url);
        return parse(data.data);
      }
      return null;
    } catch (error) {
      console.log(error);
      return null;
    }
  }

  savePlaylistToDisk(playlist: Playlist) {
    const store = new Store();
    const fPlaylist = this.formatPlaylist(playlist);
    const allPlaylist: [{ title: string }] = store.get('allPlaylist');

    if (allPlaylist) {
      // check if playlist with title already exists or not
      if (allPlaylist.map((p) => p.title).indexOf(this.title) != -1) {
        // playlist exists
        return 'PLAYLIST_ALREADY_EXISTS';
      }
      store.set('allPlaylist', [...allPlaylist, fPlaylist]);
      return 'PLAYLIST_CREATED';
    }
    store.set('allPlaylist', [fPlaylist]);
    return 'PLAYLIST_CREATED';
  }

  formatPlaylist(playlist: Playlist) {
    const date = new Date();
    const data = {
      count: playlist.items.length,
      channels: [{}],
      createdAt: date,
      updatedAt: date,
      title: this.title,
      url: this.url,
      id: date.getTime(),
    };

    data.channels = playlist.items.map((p) => {
      return {
        name: p.name,
        url: p.url,
        tvg: p.tvg,
        group: p.group,
      };
    });

    return data;
  }

  static getAllPlaylists() {
    const store = new Store();
    let data = store.get('allPlaylist');
    if (data) {
      data = data.map((d) => {
        return {
          count: d.count,
          createdAt: new Date(d.createdAt).toDateString(),
          updatedAt: new Date(d.updatedAt).toDateString(),
          title: d.title,
          url: d.url,
          id: d.id,
        };
      });
    }
    return data;
  }

  static deletePlaylist(id: number) {
    const store = new Store();
    let data = store.get('allPlaylist');
    if (data) {
      data = data.filter((d: { id: number }) => d.id != id);
      store.set('allPlaylist', data);
    }
  }

  static async updatePlaylist(id: number) {
    try {
      const store = new Store();
      const data = store.get('allPlaylist');
      if (data) {
        const dataToModify = data.find((obj) => obj.id == id);
        const otherData = data.filter((obj) => obj.id != id);
        let newData = await axios.get(dataToModify.url);
        if (newData) {
          newData = parse(newData.data);
          const channels = newData.items.map((p) => {
            return {
              name: p.name,
              url: p.url,
              tvg: p.tvg,
              group: p.group,
            };
          });

          otherData.push({
            ...dataToModify,
            updatedAt: new Date(),
            count: channels.length,
            channels,
          });

          store.set('allPlaylist', otherData);

          return 'PLAYLIST_UPDATED';
        }
      }
      return null;
    } catch (error) {
      console.log(error);
      return null;
    }
  }

  static async fetchChannels(id: number) {
    try {
      const store = new Store();
      let data = store.get('allPlaylist');
      if (data) {
        data = data.filter((d) => d.id == id);
        return data[0].channels;
      }
      return null;
    } catch (error) {
      console.log(error);
      return null;
    }
  }

  static async fetchFavouriteChannels(id: number) {
    try {
      const store = new Store();
      let data = store.get('allPlaylist');
      if (data) {
        data = data.filter((d) => d.id == id);
        data[0].channels = data[0].channels.filter((c) => c.favourite == true);
        return data[0].channels;
      }
      return null;
    } catch (error) {
      console.log(error);
      return null;
    }
  }

  static async searchChannels(id: number, channelName: string) {
    try {
      const store = new Store();
      let data = store.get('allPlaylist');
      if (data) {
        data = data.filter((d) => d.id == id);
        data = data[0].channels.filter((c) =>
          c.name.toLowerCase().includes(channelName)
        );
        if (data.length > 0) {
          return data;
        }
      }
      return null;
    } catch (error) {
      console.log(error);
      return null;
    }
  }

  static async setChannelFavouriteProp(
    pid: number,
    channelId: string,
    favourite: boolean
  ) {
    try {
      const store = new Store();
      const data = store.get('allPlaylist');
      if (data) {
        const dataToModify = data.find((obj) => obj.id == pid);
        const otherData = data.filter((obj) => obj.id != pid);

        dataToModify.channels = dataToModify.channels.map((p) => {
          if (p.tvg.id == channelId) {
            p.favourite = favourite;
          }
          return p;
        });

        otherData.push({
          ...dataToModify,
        });

        store.set('allPlaylist', otherData);
      }
    } catch (error) {
      console.log(error);
    }
  }
}
