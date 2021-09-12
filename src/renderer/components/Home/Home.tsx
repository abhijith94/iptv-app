import React from 'react';
import {
  PlusIcon,
  IconButton,
  Table,
  Pane,
  TrashIcon,
  RefreshIcon,
  EditIcon,
} from 'evergreen-ui';
import styles from './Home.scss';
import tvsvg from '../../../../assets/live_tv_white_24dp.svg';

function Home() {
  const date = `${new Date()
    .toDateString()
    .split(' ')
    .slice(1, 3)
    .join(' ')}, ${new Date().getFullYear()}`;

  const playlist = [
    {
      id: 1,
      name: 'index.m3u',
      channels: 2247,
      createdAt: date,
      updatedAt: date,
    },
    {
      id: 2,
      name: 'index.m3u',
      channels: 3657,
      createdAt: date,
      updatedAt: date,
    },
  ];

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
    </div>
  );
}

export default Home;
