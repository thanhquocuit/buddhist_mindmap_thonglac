import { Button, Card, ListGroup } from "react-bootstrap";
import ReactPlayer from "react-player";
import styled from "styled-components";
import soundGif from "./sound.gif";
import { createRef, useEffect, useState } from "react";
import { ExtTreeNode, MediaURL } from "../data";
import { useDialog } from "./PromptBox";
import RichTextEditor from "./RichTextEditor";

const InfoPanel = styled.div`
  height: calc(50vh - 64px);
  width: 100%;
  background: white;
  position: relative;

  .btn-close {
    position: absolute;
    right: 0;
    top: -32px;
    cursor: pointer;
    z-index: 1;
  }
  .ls-item {
    display: flex;
    justify-content: space-between;
    height: 38px;
    padding-top: 2px;

    p {
      padding-top: 5px;
    }

    img {
      width: 24px;
      height: 24px;
    }
  }
`;

interface Props {
  show: boolean;
  onClose: () => void;
  onUpdate: (item: MediaURL | ExtTreeNode) => void;
  node?: ExtTreeNode;
  editMode?: boolean;
}

export default function Dashboard({
  show,
  onClose,
  onUpdate,
  node,
  editMode,
}: Props) {
  const [isPlay, setPlay] = useState(false);
  const [playingURL, setPlayingURL] = useState("");
  const [targetItem, setTargetItem] = useState<MediaURL>();
  const dialog = useDialog();
  const [, setRefresher] = useState(0);
  const richTxtEditor = createRef<RichTextEditor>();

  useEffect(() => {
    setPlayingURL("");
  }, [node]);

  function togglePlayMedia(url: string) {
    if (playingURL != url) {
      setPlayingURL(url);
      setPlay(true);
    } else setPlay(!isPlay);
  }

  async function deletePlaylistItem(item: MediaURL, idx: number) {
    const { ok } = await dialog.showMessageBox(
      `Remove Item`,
      `Do you want to remove the item: ${item.title}?`
    );

    if (ok && node) {
      node.playlist?.splice(idx, 1);
      onUpdate(item);
      setRefresher(Math.random());
    }
  }

  async function editPlaylistItemLink(item: MediaURL) {
    const { ok, title, url } = await dialog.showMessageBox(`Update Media URL`, {
      url: item.playURL,
      title: item.title,
    });
    if (ok && node) {
      item.playURL = url;
      item.title = title;
      onUpdate(item);
      setRefresher(Math.random());
    }
  }

  function editPlaylistItemContent(item: MediaURL) {
    setTargetItem(item);
  }

  async function handleAddPlaylistItem() {
    const { ok, title, url } = await dialog.showMessageBox(
      `Add New Playlist Item`,
      { url: "", title: "" }
    );

    if (ok && node) {
      if (!node.playlist) node.playlist = [];
      node.playlist.push({
        title,
        playURL: url,
        content: "",
      });
      onUpdate(node.playlist[node.playlist.length - 1]);
      setRefresher(Math.random());
    }
  }

  return (
    <>
      {show && (
        <InfoPanel>
          <span className="btn-close" onClick={() => onClose()} />
          <div className="d-flex h-100">
            {playingURL && (
              <div style={{ backgroundColor: "black" }}>
                <ReactPlayer
                  url={playingURL}
                  controls={true}
                  playing={isPlay}
                />
              </div>
            )}

            {/** Playlist column */}
            <Card style={{ flex: 1 }}>
              <Card.Header
                style={{ display: "flex", justifyContent: "space-between" }}
              >
                Playlist
                {editMode && (
                  <Button
                    size="sm"
                    variant="danger"
                    onClick={handleAddPlaylistItem}
                  >
                    <i className="fas fa-plus" />
                  </Button>
                )}
              </Card.Header>
              <ListGroup
                variant="flush"
                style={{ overflowY: "scroll", height: "50vh" }}
              >
                {node?.playlist?.map((v, k) => (
                  <div
                    title={v.playURL}
                    className="ls-item list-group-item list-group-item-action"
                    key={k}
                  >
                    <p
                      className="w-100 h-100"
                      onClick={() => togglePlayMedia(v.playURL)}
                    >
                      {k + 1}. {v.title}
                    </p>

                    {/** Icons and buttons */}
                    <div className="d-flex gap-1">
                      {isPlay && playingURL == v.playURL && (
                        <img src={soundGif} alt="playing..." />
                      )}

                      {
                        /** Editor buttons */
                        editMode && (
                          <>
                            <Button size="sm">
                              <i
                                className="fas fa-link"
                                onClick={() => editPlaylistItemLink(v)}
                              />
                            </Button>
                            <Button
                              size="sm"
                              onClick={() => editPlaylistItemContent(v)}
                            >
                              <i className="fas fa-edit" />
                            </Button>
                            <Button
                              size="sm"
                              variant="danger"
                              onClick={() => deletePlaylistItem(v, k)}
                            >
                              <i className="fas fa-trash" />
                            </Button>
                          </>
                        )
                      }
                    </div>
                  </div>
                ))}
              </ListGroup>
            </Card>

            {/** Node description */}
            {targetItem ? (
              <Card style={{ flex: 1 }}>
                <Card.Header
                  style={{ display: "flex", justifyContent: "space-between" }}
                >
                  {targetItem.title}
                  {editMode && (
                    <Button
                      size="sm"
                      variant="danger"
                      onClick={() => {
                        const html = richTxtEditor.current?.getHtml();
                        targetItem.content = html || "";
                        setTargetItem(undefined);
                      }}
                    >
                      <i className="fas fa-floppy-disk" />
                    </Button>
                  )}
                </Card.Header>
                <Card.Body>
                  <RichTextEditor
                    ref={richTxtEditor}
                    html={targetItem.content}
                  />
                </Card.Body>
              </Card>
            ) : (
              <Card style={{ flex: 1 }}>
                <Card.Header
                  style={{ display: "flex", justifyContent: "space-between" }}
                >
                  {node?.text}
                  {editMode && (
                    <Button size="sm" variant="danger">
                      <i className="fas fa-floppy-disk" />
                    </Button>
                  )}
                </Card.Header>
                <Card.Body>
                  <Card.Text>{node?.description || ""}</Card.Text>
                </Card.Body>
              </Card>
            )}
          </div>
        </InfoPanel>
      )}
    </>
  );
}
