import React, { useEffect, useRef, useState } from "react";
import styled from "styled-components";
import { ClickModifiers, TreeNode } from "../mm";
import Mindmap, { NodeClickActions } from "../mm/components/Mindmap";
import { ExtTreeNode, generate } from "../data";
import Dashboard from "../partials/Dashboard";
import { useDialog } from "./PromptBox";
import { Header } from "../HomePage";
import { Container } from "react-bootstrap";

const Wrapper = styled.div`
  display: relative;
`;

interface Props {
  section: string;
  title: string;
}

export default function RoadMap(props: Props) {
  const [showDashboard, setShowDlgInfo] = useState(false);
  const [targetNode, setTargetNode] = useState<ExtTreeNode | undefined>(
    undefined
  );
  const [jsonData, setJsonData] = useState<ExtTreeNode>(generate(props.title));
  const mmRef = React.createRef<Mindmap>();
  const dialog = useDialog();
  const [editMode, setEditMode] = useState(false);

  useEffect(() => {
    let dataPtr: any = null;
    if (props.section) {
      dataPtr = JSON.parse(window.localStorage.getItem(props.section) || "{}");
      if (!dataPtr?.id) dataPtr = generate(props.title); // not a valid root id
    } else dataPtr = generate(props.title);
    setJsonData(dataPtr);
  }, [props.section]);

  function handleNodeClick(
    node: TreeNode,
    modifiers: ClickModifiers,
    actions: NodeClickActions
  ): void {
    if (node) {
      setTargetNode(node);
      setShowDlgInfo(true);
    }
  }

  function handleMindmapEdit(data: ExtTreeNode) {
    window.localStorage.setItem(props.section, JSON.stringify(data));
    dialog.showMessageBox("Save", "Saved changes successfully!");
  }

  function handleDashboardEdit() {
    mmRef.current && mmRef.current.updateRender();
    window.localStorage.setItem(props.section, JSON.stringify(jsonData));
  }

  return (
    <Wrapper>
      <Container>
        <Header />
      </Container>
      <Mindmap
        ref={mmRef}
        json={jsonData}
        onNodeClick={handleNodeClick}
        onChange={handleMindmapEdit}
        onEditMode={(enable) => setEditMode(enable)}
        style={{ maxHeight: "50vh" }}
      />
      <Dashboard
        node={targetNode}
        editMode={editMode}
        show={showDashboard}
        onClose={() => setShowDlgInfo(false)}
        onUpdate={handleDashboardEdit}
      />
    </Wrapper>
  );
}
