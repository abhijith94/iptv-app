import React, { BaseSyntheticEvent, useState } from 'react';
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
} from 'evergreen-ui';
import styles from './Home.scss';
import tvsvg from '../../../../assets/live_tv_white_24dp.svg';

declare global {
  interface Window {
    // eslint-disable-next-line
    electron: any;
  }
}

function Home() {
  const { ipcRenderer } = window.electron; // eslint-disable-next-line

  const date = `${new Date()
    .toDateString()
    .split(' ')
    .slice(1, 3)
    .join(' ')}, ${new Date().getFullYear()}`;

  const playlist = [
    {
      id: 1,
      name: 'index.m3u',
      url: '',
      channels: 2247,
      createdAt: date,
      updatedAt: date,
    },
  ];

  const [showAddPlaylistModal, setShowAddPlaylistModal] = useState(false);
  const [tmpPlayList, setTmpPlayList] = useState({
    name: null,
    url: null,
    channels: 0,
  });

  const addNewPlaylist = () => {
    ipcRenderer
      .invoke('add-new-playlist', tmpPlayList.url || '')
      .then((data: string) => console.log(data))
      .catch((e: Error) => console.log(e));
  };

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
                <Table.TextCell>{p.name}</Table.TextCell>
                <Table.TextCell>{p.channels}</Table.TextCell>
                <Table.TextCell>{p.createdAt}</Table.TextCell>
                <Table.TextCell>{p.updatedAt}</Table.TextCell>
                <Table.TextCell>
                  <Pane display="flex" alignItems="center">
                    <IconButton
                      icon={RefreshIcon}
                      intent="success"
                      marginRight="13px"
                    />
                    <IconButton
                      icon={EditIcon}
                      intent="warning"
                      marginRight="13px"
                    />
                    <IconButton
                      icon={TrashIcon}
                      intent="danger"
                      marginRight="13px"
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
          onCloseComplete={() => {
            setShowAddPlaylistModal(false);
            addNewPlaylist();
          }}
          onCancel={() => {
            setTmpPlayList({
              name: null,
              url: null,
              channels: 0,
            });
            setShowAddPlaylistModal(false);
          }}
          confirmLabel="Add"
        >
          <TextInputField
            label="Title"
            required
            isInvalid={false}
            onChange={(e: BaseSyntheticEvent) => {
              setTmpPlayList({
                ...tmpPlayList,
                name: e.target.value,
              });
            }}
          />
          <TextInputField
            label="URL"
            hint="Eg. https://iptv.io/index.m3u"
            required
            isInvalid={false}
            onChange={(e: BaseSyntheticEvent) => {
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
