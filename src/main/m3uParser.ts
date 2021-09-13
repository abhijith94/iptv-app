import axios from 'axios';
import { parse, Playlist } from 'iptv-playlist-parser';

export default class M3UParser {
  fileType: string;

  url: string;

  constructor(url: string) {
    this.fileType = '';
    this.url = url;
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

  savePlaylistToDisk(playlist: Playlist) {}
}
