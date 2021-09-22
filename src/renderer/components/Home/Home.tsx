import React, { BaseSyntheticEvent, useEffect, useState } from 'react';
import {
  PlusIcon,
  IconButton,
  Table,
  Pane,
  TrashIcon,
  RefreshIcon,
  EditIcon,
  Dialog,
  TextInputField,
  toaster,
} from 'evergreen-ui';
import { useHistory } from 'react-router';
import styles from './Home.scss';
import tvsvg from '../../../../assets/icon.png';

declare global {
  interface Window {
    // eslint-disable-next-line
    electron: any;
  }
}

function Home() {
  const { ipcRenderer } = window.electron; // eslint-disable-next-line
  const history = useHistory();

  const [playlist, setPlaylist] = useState<
    {
      id: number;
      title: string;
      createdAt: Date;
      updatedAt: Date;
      count: number;
    }[]
  >([]);
  const [showAddPlaylistModal, setShowAddPlaylistModal] = useState(false);
  const [tmpPlayList, setTmpPlayList] = useState({
    title: null,
    url: null,
    channels: 0,
    pid: null,
  });
  const [invalidTitle, setInvalidTitle] = useState(false);
  const [titleErrorMessage, setTitleErrorMessage] =
    useState<string | null>(null);
  const [invalidUrl, setInvalidUrl] = useState(false);
  const [urlErrorMessage, setUrlErrorMessage] = useState<string | null>(null);

  const [showEditPlaylistModal, setShowEditPlaylistModal] = useState(false);

  const fetchAllPlaylists = () => {
    ipcRenderer
      .invoke('fetch-all-playlists')
      .then(
        (
          data: {
            id: number;
            title: string;
            createdAt: Date;
            updatedAt: Date;
            count: number;
          }[]
        ) => {
          if (!data) {
            setPlaylist([]);
          } else {
            setPlaylist(data);
          }
          return null;
        }
      )
      .catch((e: Error) => console.log(e));
  };

  const addNewPlaylist = () => {
    ipcRenderer
      .invoke('add-new-playlist', {
        url: tmpPlayList.url,
        title: tmpPlayList.title,
      })
      .then((data: string) => {
        toaster.closeAll();
        if (data === 'PLAYLIST_ALREADY_EXISTS') {
          // show alert
          toaster.danger('Playlist with same name already exists');
        } else if (data === 'PLAYLIST_CREATED') {
          setShowAddPlaylistModal(false);
          setTmpPlayList({
            title: null,
            url: null,
            channels: 0,
          });
          toaster.success('Playlist added');
          fetchAllPlaylists();
        } else if (data === 'PLAYLIST_PARSING_FAILED') {
          toaster.warning('Failed to get playlist');
        } else {
          // something went wrong
          toaster.danger('Something went wrong');
        }
        return null;
      })
      .catch((e: Error) => console.log(e));
  };

  const deletePlaylist = (id: number) => {
    ipcRenderer
      .invoke('delete-playlist', id)
      .then((result: string) => {
        if (result === 'PLAYLIST_DELETED') {
          fetchAllPlaylists();
        }
        return null;
      })
      .catch((error: Error) => console.log(error));
  };

  const updatePlaylist = (id: number) => {
    ipcRenderer
      .invoke('update-playlist', id)
      .then((result: string) => {
        if (result === 'PLAYLIST_UPDATED') {
          fetchAllPlaylists();
          toaster.success('Playlist updated');
          return null;
        }
        toaster.warning('Could not update the playlist');
        return null;
      })
      .catch((error: Error) => console.log(error));
  };

  const openPlayerWindow = (id: number) => {
    history.push(`/${id}`);
  };

  const savePlaylistEdit = () => {
    ipcRenderer
      .invoke('save-playlist-edit', {
        url: tmpPlayList.url,
        title: tmpPlayList.title,
        pid: tmpPlayList.pid,
      })
      .then((data: string) => {
        toaster.closeAll();
        if (data === 'PLAYLIST_ALREADY_EXISTS') {
          // show alert
          toaster.danger('Playlist with same name already exists');
        } else if (data === 'PLAYLIST_UPDATED') {
          toaster.success('Playlist modified');
          setShowEditPlaylistModal(false);
          fetchAllPlaylists();
          setTmpPlayList({
            title: null,
            url: null,
            channels: 0,
            pid: null,
          });
        } else if (data === 'PLAYLIST_PARSING_FAILED') {
          toaster.warning('Failed to get playlist');
        } else {
          // something went wrong
          toaster.danger('Something went wrong');
        }
        return null;
      })
      .catch((e: Error) => console.log(e));
  };

  useEffect(() => {
    fetchAllPlaylists();
  }, []);

  return (
    <div className={styles.home}>
      <div className={styles.top}>
        <img src={tvsvg} alt="tvlogo" className={styles.tvlogo} />
        <h1 className={styles.title}>IPTV</h1>
      </div>
      <div className={styles.addToPlaylistContainer}>
        <IconButton
          icon={<PlusIcon style={{ fill: 'white' }} size={50} />}
          className={styles.addToPlaylistBtn}
          size="large"
          appearance="primary"
          onClick={() => setShowAddPlaylistModal(true)}
        />
      </div>
      <div className={styles.breakline}>
        <hr />
      </div>
      <div className={styles.bottom}>
        <Table className={styles.playlistTable}>
          <Table.Head fontSize="medium" padding={0}>
            <Table.SearchHeaderCell />
            <Table.TextHeaderCell>Channels</Table.TextHeaderCell>
            <Table.TextHeaderCell>Created</Table.TextHeaderCell>
            <Table.TextHeaderCell>Updated</Table.TextHeaderCell>
            <Table.TextHeaderCell>Modify</Table.TextHeaderCell>
          </Table.Head>
          <Table.Body height="fit-content" maxHeight="300px" border="none">
            {playlist.map((p) => (
              <Table.Row
                key={p.id}
                onSelect={() => {}}
                isSelectable
                className={styles.tableCell}
              >
                <Table.TextCell onClick={() => openPlayerWindow(p.id)}>
                  {p.title}
                </Table.TextCell>
                <Table.TextCell onClick={() => openPlayerWindow(p.id)}>
                  {p.count}
                </Table.TextCell>
                <Table.TextCell onClick={() => openPlayerWindow(p.id)}>
                  {p.createdAt}
                </Table.TextCell>
                <Table.TextCell onClick={() => openPlayerWindow(p.id)}>
                  {p.updatedAt}
                </Table.TextCell>
                <Table.TextCell>
                  <Pane display="flex" alignItems="center">
                    <IconButton
                      icon={RefreshIcon}
                      intent="success"
                      marginRight="13px"
                      onClick={() => {
                        updatePlaylist(p.id);
                      }}
                    />
                    <IconButton
                      icon={EditIcon}
                      intent="warning"
                      marginRight="13px"
                      onClick={() => {
                        setTmpPlayList({
                          title: p.title,
                          url: p.url,
                          pid: p.id,
                        });
                        setShowEditPlaylistModal(true);
                      }}
                    />
                    <IconButton
                      icon={TrashIcon}
                      intent="danger"
                      marginRight="13px"
                      onClick={() => {
                        deletePlaylist(p.id);
                      }}
                    />
                  </Pane>
                </Table.TextCell>
              </Table.Row>
            ))}
          </Table.Body>
        </Table>
      </div>
      <Pane alignContent="center">
        <Dialog
          isShown={showAddPlaylistModal}
          title="Add to playlist"
          onConfirm={() => {
            addNewPlaylist();
          }}
          onCancel={() => {
            setTmpPlayList({
              title: null,
              url: null,
              channels: 0,
            });
            setShowAddPlaylistModal(false);
            setInvalidTitle(false);
            setTitleErrorMessage(null);
            setInvalidUrl(false);
            setUrlErrorMessage(null);
          }}
          confirmLabel="Add"
          isConfirmDisabled={
            invalidTitle || invalidUrl || !tmpPlayList.title || !tmpPlayList.url
          }
          shouldCloseOnOverlayClick={false}
        >
          <TextInputField
            label="Title"
            required
            isInvalid={invalidTitle}
            validationMessage={titleErrorMessage}
            onChange={(e: BaseSyntheticEvent) => {
              const { value } = e.target;
              if (value.trim() === '') {
                setInvalidTitle(true);
                setTitleErrorMessage('This field is required');
              } else {
                setTmpPlayList({
                  ...tmpPlayList,
                  title: e.target.value,
                });
                setInvalidTitle(false);
                setTitleErrorMessage(null);
              }
            }}
          />
          <TextInputField
            label="URL"
            hint="Eg. https://iptv.io/index.m3u"
            required
            isInvalid={invalidUrl}
            validationMessage={urlErrorMessage}
            onChange={(e: BaseSyntheticEvent) => {
              const { value } = e.target;
              if (value.trim() === '') {
                setInvalidUrl(true);
                setUrlErrorMessage('This field is required');
              } else if (!value.match(/^https?:\/\/.*\.m3u8?/g)) {
                setInvalidUrl(true);
                setUrlErrorMessage('Invalid format');
              } else {
                setTmpPlayList({
                  ...tmpPlayList,
                  url: e.target.value,
                });
                setInvalidUrl(false);
                setUrlErrorMessage(null);
              }
            }}
          />
        </Dialog>
      </Pane>
      <Pane alignContent="center">
        <Dialog
          isShown={showEditPlaylistModal}
          title="Edit playlist"
          onConfirm={() => {
            savePlaylistEdit();
          }}
          onCancel={() => {
            setTmpPlayList({
              title: null,
              url: null,
            });
            setShowEditPlaylistModal(false);
            setInvalidTitle(false);
            setTitleErrorMessage(null);
            setInvalidUrl(false);
            setUrlErrorMessage(null);
          }}
          confirmLabel="Save"
          isConfirmDisabled={
            invalidTitle || invalidUrl || !tmpPlayList.title || !tmpPlayList.url
          }
          shouldCloseOnOverlayClick={false}
        >
          <TextInputField
            label="Title"
            required
            isInvalid={invalidTitle}
            value={tmpPlayList.title || ''}
            validationMessage={titleErrorMessage}
            onChange={(e: BaseSyntheticEvent) => {
              const { value } = e.target;
              if (value.trim() === '') {
                setInvalidTitle(true);
                setTitleErrorMessage('This field is required');
              } else {
                setInvalidTitle(false);
                setTitleErrorMessage(null);
              }
              setTmpPlayList({
                ...tmpPlayList,
                title: e.target.value,
              });
            }}
          />
          <TextInputField
            label="URL"
            hint="Eg. https://iptv.io/index.m3u"
            required
            isInvalid={invalidUrl}
            validationMessage={urlErrorMessage}
            value={tmpPlayList.url || ''}
            onChange={(e: BaseSyntheticEvent) => {
              const { value } = e.target;
              if (value.trim() === '') {
                setInvalidUrl(true);
                setUrlErrorMessage('This field is required');
              } else if (!value.match(/^https?:\/\/.*\.m3u8?/g)) {
                setInvalidUrl(true);
                setUrlErrorMessage('Invalid format');
              } else {
                setInvalidUrl(false);
                setUrlErrorMessage(null);
              }
              setTmpPlayList({
                ...tmpPlayList,
                url: e.target.value,
              });
            }}
          />
        </Dialog>
      </Pane>
    </div>
  );
}

export default Home;
