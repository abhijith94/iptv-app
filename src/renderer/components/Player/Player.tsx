/* eslint-disable jsx-a11y/click-events-have-key-events */
/* eslint-disable react/prop-types */
import {
  ArrowLeftIcon,
  DrawerLeftFilledIcon,
  DrawerRightFilledIcon,
  Pane,
  SearchInput,
  StarEmptyIcon,
  StarIcon,
  Tab,
  Tablist,
} from 'evergreen-ui';
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

  const tabs = ['All Channels', 'Favourites'];
  const [selectedTab, setSelectedTab] = useState(0);
  const [channels, setChannels] = useState([]);
  const [playlistId, setPlaylistId] = useState(null);
  const [currentChannelName, setCurrentChannelName] = useState('');
  const [currentChannelId, setCurrentChannelId] = useState('');
  const [currentChannelIsFav, setCurrentChannelIsFav] = useState(false);
  const [showSidebar, setShowSidebar] = useState(true);
  const [options, setOptions] = useState({
    autoplay: true,
    controls: true,
    responsive: true,
    fluid: false,
    sources: [],
  });
  const playerRef = React.useRef(null);

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

  const fetchFavouriteChannels = (pid) => {
    ipcRenderer
      .invoke('fetch-favourite-channels', pid)
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

  const addToFavourites = (channelId: string) => {
    if (channelId !== null) {
      let chnls = [...channels];
      chnls = chnls.map((c) => {
        if (c.id === channelId) {
          c.favourite = true;
        }
        return c;
      });
      setChannels(chnls);

      setCurrentChannelIsFav(true);
      ipcRenderer
        .invoke('set-channel-favourite-prop', {
          pid: playlistId,
          channelId,
          isFavourite: true,
        })
        .then(() => {
          return null;
        })
        .catch((e: Error) => console.log(e));
    }
  };

  const removeFromFavourites = (channelId: string) => {
    console.log('called', channelId);

    if (channelId !== null) {
      let chnls = [...channels];
      chnls = chnls.map((c) => {
        if (c.tvg.id == channelId) {
          c.favourite = false;
        }
        return c;
      });
      setChannels(chnls);

      if (currentChannelId === channelId) {
        setCurrentChannelIsFav(false);
      }
      ipcRenderer
        .invoke('set-channel-favourite-prop', {
          pid: playlistId,
          channelId,
          isFavourite: false,
        })
        .then(() => {
          if (selectedTab == 1) {
            fetchFavouriteChannels(playlistId);
          }
          return null;
        })
        .catch((e: Error) => console.log(e));
    }
  };

  const Row = ({ index, style }) => {
    return (
      // eslint-disable-next-line jsx-a11y/no-static-element-interactions
      <div
        key={index}
        style={style}
        className={styles.channel}
        id={
          channels[index].tvg.id == currentChannelId
            ? styles.channelSelected
            : ''
        }
        onClick={() => {
          setOptions({
            autoplay: true,
            controls: true,
            responsive: true,
            fluid: true,
            liveui: true,
            sources: [
              {
                src: channels[index].url,
                type: 'application/x-mpegURL',
              },
            ],
          });
          setCurrentChannelName(channels[index].name);
          setCurrentChannelId(channels[index].tvg.id);
          if (channels[index].favourite) {
            setCurrentChannelIsFav(true);
          } else {
            setCurrentChannelIsFav(false);
          }
        }}
      >
        <div className={styles.channelName}>{`${index + 1}. ${
          channels[index].name
        }`}</div>
        {selectedTab == 1 ? (
          <div style={{ display: 'flex', alignItems: 'center' }}>
            <img
              src={channels[index].tvg.logo}
              alt=""
              className={styles.logo}
            />
            <StarIcon
              size={30}
              color="gainsboro"
              title="Remove bookmark"
              className={styles.bookmarkIcon}
              color="#edb33e"
              style={{ marginRight: '10px' }}
              onClick={(e) => {
                e.stopPropagation();
                removeFromFavourites(channels[index].tvg.id);
              }}
            />
          </div>
        ) : (
          <img src={channels[index].tvg.logo} alt="" className={styles.logo} />
        )}
      </div>
    );
  };

  useEffect(() => {
    // eslint-disable-next-line react/prop-types
    const pid = props.match.params.id;
    setPlaylistId(pid);
    fetchAllChannels(pid);
  }, []);

  return (
    <div className={styles.playerContainer}>
      <div
        className={styles.sidebar}
        id={!showSidebar ? styles.hideSidebar : ''}
      >
        <div
          style={{
            display: 'flex',
            justifyContent: 'flex-start',
            alignItems: 'baseline',
            paddingLeft: '20px',
            width: '350px',
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
                  onSelect={() => {
                    setChannels([]);
                    if (index == 0) {
                      fetchAllChannels(playlistId);
                    } else if (index == 1) {
                      fetchFavouriteChannels(playlistId);
                    }
                    setSelectedTab(index);
                  }}
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
        <Pane
          key={tabs[1]}
          id={`panel-${tabs[1]}`}
          role="tabpanel"
          display={selectedTab === 1 ? 'block' : 'none'}
          height="100%"
        >
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
      <div
        className={styles.player}
        id={!showSidebar ? styles.widenPlayer : ''}
      >
        {currentChannelName ? (
          <div className={styles.drawerToggle}>
            {showSidebar ? (
              <DrawerRightFilledIcon
                size={25}
                color="gainsboro"
                title="Close sidebar"
                onClick={() => {
                  setShowSidebar(false);
                }}
              />
            ) : (
              <DrawerLeftFilledIcon
                size={25}
                color="gainsboro"
                title="Open sidebar"
                onClick={() => {
                  setShowSidebar(true);
                }}
              />
            )}
            {(() => {
              if (selectedTab == 0 && currentChannelIsFav) {
                return (
                  <StarIcon
                    size={25}
                    color="gainsboro"
                    title="Remove bookmark"
                    className={styles.bookmarkIcon}
                    onClick={() => {
                      removeFromFavourites(currentChannelId);
                    }}
                  />
                );
              } else if (selectedTab == 0 && !currentChannelIsFav) {
                return (
                  <StarEmptyIcon
                    size={25}
                    color="gainsboro"
                    title="Bookmark"
                    className={styles.bookmarkIcon}
                    onClick={() => {
                      addToFavourites(currentChannelId);
                    }}
                  />
                );
              }
            })()}

            <p className={styles.channelName}>{currentChannelName}</p>
          </div>
        ) : null}

        <VideoJs options={options} onReady={handlePlayerReady} />
      </div>
    </div>
  );
}

export default Player;
