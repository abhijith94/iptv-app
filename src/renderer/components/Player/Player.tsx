/* eslint-disable jsx-a11y/click-events-have-key-events */
/* eslint-disable react/prop-types */
import { ArrowLeftIcon, Pane, SearchInput, Tab, Tablist } from 'evergreen-ui';
import React, { useEffect, useRef, useState } from 'react';
import { FixedSizeList as List } from 'react-window';
import AutoSizer from 'react-virtualized-auto-sizer';
import { Link } from 'react-router-dom';
import VideoJs from '../VideoJs/VideoJs';
import styles from './Player.scss';

declare global {
  interface Window {
    // eslint-disable-next-line
    electron: any;
  }
}

function Player(props) {
  const { ipcRenderer } = window.electron; // eslint-disable-next-line

  const tabs = ['All Channels', 'Groups'];
  const [selectedTab, setSelectedTab] = useState(0);
  const [channels, setChannels] = useState([]);
  const [playlistId, setPlaylistId] = useState(null);
  const [options, setOptions] = useState({
    autoplay: true,
    controls: true,
    responsive: true,
    fluid: false,
    sources: [],
  });
  const playerRef = React.useRef(null);

  const Row = ({ index, style }) => {
    return (
      // eslint-disable-next-line jsx-a11y/no-static-element-interactions
      <div
        key={index}
        style={style}
        className={styles.channel}
        onClick={() => {
          setOptions({
            autoplay: true,
            controls: true,
            responsive: true,
            fluid: false,
            liveui: true,
            sources: [
              {
                src: channels[index].url,
                type: 'application/x-mpegURL',
              },
            ],
          });
        }}
      >
        <div className={styles.channelName}>{`${index + 1}. ${
          channels[index].name
        }`}</div>
        <img src={channels[index].tvg.logo} alt="" className={styles.logo} />
      </div>
    );
  };

  const handlePlayerReady = (player) => {
    playerRef.current = player;
    // you can handle player events here
    player.on('waiting', () => {
      console.log('player is waiting');
    });

    player.on('dispose', () => {
      console.log('player will dispose');
    });
  };

  const fetchAllChannels = (pid) => {
    ipcRenderer
      .invoke('fetch-channels', pid)
      .then((c) => {
        if (c) {
          setChannels(c);
        }
        return null;
      })
      .catch((error: Error) => console.log(error));
  };

  const searchChannel = (channelName: string) => {
    if (channelName && channelName.trim() !== '' && channelName.length >= 3) {
      ipcRenderer
        .invoke('search-channels', { channelName, pid: playlistId })
        .then((c: any) => {
          if (c) {
            setChannels(c);
          }
          return null;
        })
        .catch((e: Error) => console.log(e));
    } else {
      fetchAllChannels(playlistId);
    }
  };

  useEffect(() => {
    // eslint-disable-next-line react/prop-types
    const pid = props.match.params.id;
    setPlaylistId(pid);
    fetchAllChannels(pid);
  }, []);

  return (
    <div className={styles.playerContainer}>
      <div className={styles.sidebar}>
        <div
          style={{
            display: 'flex',
            justifyContent: 'flex-start',
            alignItems: 'baseline',
            paddingLeft: '20px',
          }}
        >
          <Link to="/" style={{ marginRight: '20px', color: 'gray' }}>
            <ArrowLeftIcon />
          </Link>
          <Pane height={50} className={styles.tabContainer}>
            <Tablist>
              {tabs.map((tab, index) => (
                <Tab
                  key={tab}
                  id={tab}
                  onSelect={() => setSelectedTab(index)}
                  isSelected={index === selectedTab}
                  fontSize="2.3rem"
                >
                  {tab}
                </Tab>
              ))}
            </Tablist>
          </Pane>
        </div>
        <hr />
        <Pane
          key={tabs[0]}
          id={`panel-${tabs[0]}`}
          role="tabpanel"
          display={selectedTab === 0 ? 'block' : 'none'}
          height="100%"
        >
          <div className={styles.searchContainer}>
            <SearchInput
              style={{ backgroundColor: '#f1f1f1' }}
              placeholder="Search for channel..."
              onChange={(e: any) => {
                const toSearch = e.target.value;
                searchChannel(toSearch);
              }}
            />
          </div>
          <div className={styles.channelContainer}>
            <AutoSizer>
              {({ height, width }) => (
                <List
                  height={height}
                  itemCount={channels.length}
                  itemSize={50}
                  width={width}
                >
                  {Row}
                </List>
              )}
            </AutoSizer>
          </div>
        </Pane>
      </div>
      <div className={styles.player}>
        <VideoJs options={options} onReady={handlePlayerReady} />
      </div>
    </div>
  );
}

export default Player;
