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
    const fPlaylist = this.formatPlaylistForUngroupedType(playlist);
    const allPlaylist: [{ title: string }] = store.get('allPlaylist');

    if (allPlaylist) {
      // check if playlist with title already exists or not
      if (allPlaylist.map((p) => p.title).indexOf(this.title) !== -1) {
        // playlist exists
        return 'PLAYLIST_ALREADY_EXISTS';
      }
      store.set('allPlaylist', [...allPlaylist, fPlaylist]);
      return 'PLAYLIST_CREATED';
    }
    store.set('allPlaylist', [fPlaylist]);
    return 'PLAYLIST_CREATED';
  }

  formatPlaylistForUngroupedType(playlist: Playlist) {
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
      data = data.filter((d: { id: number }) => d.id !== id);
      store.set('allPlaylist', data);
    }
  }
}
