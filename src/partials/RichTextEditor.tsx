import React, { Component } from "react";
import { ContentState, EditorState, convertToRaw } from "draft-js";
import { Editor } from "react-draft-wysiwyg";
import draftToHtml from "draftjs-to-html";
import htmlToDraft from "html-to-draftjs";

interface State {
  editorState: EditorState;
  html: string | undefined;
}

interface Props {
  html: string | undefined;
}

export default class RichTextEditor extends Component<Props, State> {
  constructor(props: Props) {
    super(props);

    let editorState = EditorState.createEmpty();
    if (props.html) {
      const contentBlock = htmlToDraft(props.html || "");
      const contentState = ContentState.createFromBlockArray(
        contentBlock.contentBlocks
      );
      editorState = EditorState.createWithContent(contentState);
    }
    this.state = {
      editorState,
      html: props.html || "",
    };
  }

  onEditorStateChange(editorState: any) {
    this.setState({
      editorState,
      html: draftToHtml(convertToRaw(editorState.getCurrentContent())),
    });
  }

  getHtml() {
    return this.state.html;
  }

  render() {
    const { editorState } = this.state;
    return (
      <Editor
        editorState={editorState}
        wrapperClassName="demo-wrapper"
        editorClassName="demo-editor"
        onEditorStateChange={(e) => this.onEditorStateChange(e)}
      />
    );
  }
}
