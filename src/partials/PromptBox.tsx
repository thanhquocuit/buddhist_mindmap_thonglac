import React, { createRef, useRef } from "react";
import { Button, Form, Modal } from "react-bootstrap";
import styled from "styled-components";

const Overlay = styled.div`
  position: absolute;
  background-color: black;
  opacity: 0.5;
  top: 0;
  left: 0;
  width: 100vw;
  height: 100vh;
`;

interface State {
  display: boolean;
  title: string;
  content: string;
  inputMode: boolean;
  inputURL: string;
  inputTitle: string;
}

interface Result {
  ok: boolean;
  url: string;
  title: string;
}

class PromptBox extends React.Component {
  state: State = {
    display: false,
    title: "Message",
    content: "...",
    inputMode: false,
    inputURL: "",
    inputTitle: "",
  };

  okFunc: ((value: Result | PromiseLike<Result>) => void) | null;

  constructor(props: any) {
    super(props);
    this.okFunc = null;
  }

  async showMessageBox(
    title: string,
    content: string | { url: string; title: string }
  ): Promise<Result> {
    return new Promise<Result>((okFunc, reject) => {
      if (typeof content == "string")
        this.setState({
          display: true,
          title,
          content,
          inputMode: false,
        });
      else
        this.setState({
          display: true,
          title,
          content: "",
          inputMode: true,
          inputURL: content.url,
          inputTitle: content.title,
        });
      this.okFunc = okFunc;
    });
  }

  render(): React.ReactNode {
    if (!this.state.display) return <></>;
    return (
      <div
        className="modal show"
        style={{ display: "block", position: "fixed" }}
      >
        <Overlay />
        <Modal.Dialog>
          <Modal.Header
            closeButton
            onHide={() => {
              this.state.display = false;
              this.setState(this.state);
              if (this.okFunc)
                this.okFunc({
                  ok: false,
                  url: this.state.inputURL,
                  title: this.state.inputTitle,
                });
            }}
          >
            <Modal.Title>{this.state.title}</Modal.Title>
          </Modal.Header>
          <Modal.Body>
            {this.state.inputMode ? (
              <Form>
                <Form.Group className="mb-3" controlId="ctrl-1">
                  <Form.Label>Title</Form.Label>
                  <Form.Control
                    type="text"
                    autoFocus
                    defaultValue={this.state.inputTitle}
                    onChange={(e) => {
                      this.state.inputTitle = e.target.value;
                      this.setState(this.state);
                    }}
                  />
                </Form.Group>
                <Form.Group className="mb-3" controlId="ctrl-2">
                  <Form.Label>Media URL</Form.Label>
                  <Form.Control
                    type="text"
                    autoFocus
                    defaultValue={this.state.inputURL}
                    onChange={(e) => {
                      this.state.inputURL = e.target.value;
                      this.setState(this.state);
                    }}
                  />
                </Form.Group>
              </Form>
            ) : (
              <p>{this.state.content}</p>
            )}
          </Modal.Body>

          <Modal.Footer>
            <Button
              variant="secondary"
              style={{ minWidth: "100px" }}
              onClick={() => {
                this.state.display = false;
                this.setState(this.state);
                if (this.okFunc)
                  this.okFunc({
                    ok: false,
                    url: this.state.inputURL,
                    title: this.state.inputTitle,
                  });
              }}
            >
              Cancel
            </Button>
            <Button
              variant="primary"
              style={{ minWidth: "100px" }}
              onClick={() => {
                this.state.display = false;
                this.setState(this.state);
                if (this.okFunc)
                  this.okFunc({
                    ok: true,
                    url: this.state.inputURL,
                    title: this.state.inputTitle,
                  });
              }}
            >
              OK
            </Button>
          </Modal.Footer>
        </Modal.Dialog>
      </div>
    );
  }
}

const dialogRef = React.createRef<PromptBox>();

export function useDialog(): PromptBox {
  if (!dialogRef.current) return new PromptBox({});
  return dialogRef.current;
}

export default function PromptBoxWrapper() {
  return <PromptBox ref={dialogRef} />;
}
