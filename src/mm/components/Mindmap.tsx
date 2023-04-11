import React, {
  CSSProperties,
  useCallback,
  useEffect,
  useReducer,
  useRef,
  useState,
} from "react";
import styled from "styled-components";
import {
  CANVAS_SCALE_FACTOR,
  DEFAULT_FONT,
} from "../constants/render.constants";
import { debugLog } from "../helpers/debugLog";
import {
  findTreeNodeAtCoordinate,
  findTreeNodeById,
} from "../helpers/findTreeNodeAtCoordinate";
import { getTreeAndToggleNodeCollapse } from "../helpers/getTreeAndToggleNodeCollapse";
import {
  getTreeLayout,
  TreeNode,
  TreeNodeWithLayout,
} from "../helpers/getTreeLayout";
import { getTreeWithSearchTextFilter } from "../helpers/getTreeWithSearchTextFilter";
import { getVisibleCanvasBounds } from "../helpers/getVisibleBounds";
import { getWindowPointOnCanvas } from "../helpers/getWindowPointOnCanvas";
import { renderGrid } from "../render/renderGrid";
import { renderTree } from "../render/renderTree";
import Input from "./Input";
import UserInput, { ClickModifiers } from "./UserInput";
import { v4 as uuidv4 } from "uuid";
import { Button, ListGroup } from "react-bootstrap";

const FillCanvas = styled.canvas`
  height: 100%;
  width: 100%;
`;

const InputContainer = styled.div`
  position: absolute;
  display: flex;
  flex-direction: row;
  top: 16px;
  right: 16px;
  gap: 5px;
`;

const PopupMenu = styled.div`
  position: fixed;
  z-index: 999;
`;

export interface NodeClickActions {
  toggleCollapse: () => void;
}

export interface MindmapProps {
  json: TreeNode;
  onNodeClick?: (
    node: TreeNode,
    modifiers: ClickModifiers,
    actions: NodeClickActions
  ) => void;
  onChange?: (root: TreeNode) => void;
  onEditMode?: (enable: boolean) => void;
  style?: CSSProperties;
}

interface MouseCoords {
  x: number;
  y: number;
}

interface ZoomLevel {
  val: number;
}

interface CanvasInstance {
  canvas: HTMLCanvasElement;
  context2D: CanvasRenderingContext2D;
  width: number;
  height: number;
}

const coordsReducer = (state: MouseCoords, action: MouseCoords) => {
  return {
    x: state.x + action.x,
    y: state.y + action.y,
  };
};

const zoomReducer = (state: ZoomLevel, action: ZoomLevel) => {
  return {
    val: Math.max(0.1, state.val + action.val * 0.001),
  };
};

const Mindmap = ({
  json,
  onNodeClick,
  onChange,
  onEditMode,
  style,
}: MindmapProps) => {
  const [canvas, setCanvas] = useState<HTMLCanvasElement>();
  const [context2D, setContext2D] = useState<CanvasRenderingContext2D>();
  const [searchValue, setSearchValue] = useState("");
  const [editMode, setEditMode] = useState(false);
  const popupMenuCtx = useRef<any>({
    show: false,
    left: "0",
    top: "0",
    nodeId: "",
  });
  const renameDialog = useRef<any>({
    show: false,
    nodeId: "",
    text: "",
  });

  // Instance that is used for drawing to ensure that everything re-renders on window size change
  const drawingInstance = useRef<CanvasInstance>();
  const treeLayout = useRef<TreeNodeWithLayout>();
  const mouseOverNode = useRef<TreeNodeWithLayout>();
  const [tree, setTree] = useState<TreeNode>();

  const [refesher, setRefesher] = useState(0);
  const [coords, dispatchPan] = useReducer(coordsReducer, { x: 0, y: 0 });
  const [zoom, dispatchZoom] = useReducer(zoomReducer, { val: 1 });
  const [canvasSize, setCanvasSize] = useState({ width: 0, height: 0 });

  // default props
  let styleObj: CSSProperties = JSON.parse(JSON.stringify(style));
  styleObj.backgroundColor = styleObj.backgroundColor || "#424448";
  styleObj.position = styleObj.position || "relative";

  function UpdateCanvasSize(_canvas: HTMLCanvasElement): any {
    if (!_canvas) return { width: 0, height: 0 };
    let w = window.innerWidth,
      h = window.innerHeight;
    if (_canvas.parentElement) {
      w = _canvas.parentElement.clientWidth;
      h = _canvas.parentElement.clientHeight;
    }
    // Set the height of the canvas
    _canvas.width = w * CANVAS_SCALE_FACTOR;
    _canvas.height = h * CANVAS_SCALE_FACTOR;

    return { width: w, height: h };
  }

  function AutoFill(json: TreeNode): TreeNode {
    if (!json.id) json.id = uuidv4();

    json.nodes = json.nodes || [];
    for (const nd of json.nodes) {
      nd.parent = json.id;
      AutoFill(nd);
    }
    return json;
  }

  /**
   * Whenever the JSON changes re-bind to the tree.
   * This state is used so that elsewhere in the app we can change the tree state to trigger re-renderes
   * Probably not the best solution since any json changes will wipe away our changes. Need to use a transform function or something instead
   * TODO: Use a transform function
   */
  useEffect(() => {
    setTree(AutoFill(json));
  }, [json]);

  /**
   * Search the tree based on the term whenever the term changes
   */
  useEffect(() => {
    debugLog("Searching tree");
    const pruned = getTreeWithSearchTextFilter(AutoFill(json), searchValue);
    setTree(pruned);
  }, [json, searchValue]);

  /**
   * Hook that is responsible for binding to the canvas element, setting initial size, and persisting to state
   */
  const canvasRef = useCallback(
    (_canvas: HTMLCanvasElement) => {
      const { width, height } = UpdateCanvasSize(_canvas);
      // Set to state
      setCanvas(_canvas);
      setCanvasSize({ width, height });
    },
    [setCanvas]
  );

  /**
   * Hook that is responsible for getting and configuring the 2d drawing instance
   */
  useEffect(() => {
    if (!canvas) return;

    // Set the dimensions of the canvas
    const { width, height } = UpdateCanvasSize(canvas);
    setCanvasSize({ width, height });

    // Get the context
    const _context2D = canvas?.getContext("2d");

    if (!_context2D) {
      return;
    }

    // Configure the context
    _context2D.font = DEFAULT_FONT;
    _context2D.textBaseline = "top";

    // Set the context
    setContext2D(_context2D);

    // Set to state
    drawingInstance.current = {
      canvas,
      context2D: _context2D,
      width,
      height,
    };
  }, [canvas, setContext2D]);

  /**
   * Re-evaluate the tree layout whenever the tree or 2d canvas changes
   */
  useEffect(() => {
    if (!context2D || !tree) {
      return;
    }

    debugLog("Laying out tree");
    treeLayout.current = getTreeLayout(context2D, tree, 800, 32, canvasSize);
    setRefesher(Math.random());
  }, [tree, context2D, canvasSize]);

  /**
   * Hook to run each time the zoom or pan changes and re-render the tree
   */
  useEffect(() => {
    if (!drawingInstance.current || !treeLayout.current) {
      return;
    }

    debugLog("Drawing tree");

    // Set transforms
    drawingInstance.current.context2D.setTransform(1, 0, 0, 1, 0, 0);
    drawingInstance.current.context2D.scale(zoom.val, zoom.val);
    drawingInstance.current.context2D.translate(coords.x, coords.y);

    // Get the visible area and clear
    const visibleBounds = getVisibleCanvasBounds(
      drawingInstance.current.context2D
    );
    drawingInstance.current.context2D.clearRect(
      visibleBounds.x,
      visibleBounds.y,
      visibleBounds.width,
      visibleBounds.height
    );

    // Draw a grid for the visible area
    renderGrid(
      drawingInstance.current.context2D,
      visibleBounds.x,
      visibleBounds.y,
      visibleBounds.width,
      visibleBounds.height
    );

    // Draw the tree
    const hoverNode: TreeNodeWithLayout | undefined = mouseOverNode.current;
    const hoverIcon =
      hoverNode && hoverNode.nodes?.length
        ? hoverNode?.display?.collapsed
          ? "\uF067"
          : "\uF068"
        : undefined;

    renderTree(
      drawingInstance.current.context2D,
      treeLayout.current,
      searchValue,
      hoverNode,
      hoverIcon
    );
  }, [coords, zoom, searchValue, treeLayout, refesher]);

  ///////////////////////////////////
  // All handlers for input events //

  const handleClick = useCallback(
    (x: number, y: number, modifiers: ClickModifiers) => {
      if (!drawingInstance.current || !treeLayout.current || !tree) {
        return;
      }

      const point = getWindowPointOnCanvas(
        drawingInstance.current.context2D,
        x,
        y
      );
      const { node, hoverIcon } = findTreeNodeAtCoordinate(
        point.x,
        point.y,
        treeLayout.current
      );

      // If no node was clicked, then do nothing
      if (!node) return;

      const toggleCollapseNode = () => {
        if (treeLayout.current && node.id) {
          const _updatedTree = getTreeAndToggleNodeCollapse(
            treeLayout.current,
            node.id
          );
          setTree(_updatedTree);
          if (mouseOverNode.current && mouseOverNode.current.id == node.id) {
            if (mouseOverNode.current.display)
              mouseOverNode.current.display.collapsed =
                !node.display?.collapsed;
          }

          setRefesher(Math.random());
        }
      };

      // If there is no handler just collapse
      if (hoverIcon) {
        toggleCollapseNode();
        return;
      }

      // Call the click handler
      if (onNodeClick)
        onNodeClick(node, modifiers, { toggleCollapse: toggleCollapseNode });
    },
    [onNodeClick, tree]
  );

  const handleRightClick = useCallback(
    (x: number, y: number, modifiers: ClickModifiers) => {
      if (!drawingInstance.current || !treeLayout.current || !tree || !editMode)
        return;

      const point = getWindowPointOnCanvas(
        drawingInstance.current.context2D,
        x,
        y
      );
      const { node, hoverIcon } = findTreeNodeAtCoordinate(
        point.x,
        point.y,
        treeLayout.current
      );

      // If no node was clicked, then do nothing
      if (!node) return;

      popupMenuCtx.current = {
        show: true,
        left: `${modifiers.event.x}px`,
        top: `${modifiers.event.y}px`,
        nodeId: node.id,
      };
      setRefesher(Math.random());
    },
    [tree, editMode]
  );

  const handleDClick = useCallback(
    (x: number, y: number, modifiers: ClickModifiers) => {
      if (!drawingInstance.current || !treeLayout.current || !tree || !editMode)
        return;

      const point = getWindowPointOnCanvas(
        drawingInstance.current.context2D,
        x,
        y
      );
      const { node, hoverIcon } = findTreeNodeAtCoordinate(
        point.x,
        point.y,
        treeLayout.current
      );

      // If no node was clicked, then do nothing
      if (node) {
        renameDialog.current.show = true;
        renameDialog.current.nodeId = node.id;
        renameDialog.current.text = node.text;
        setRefesher(Math.random());
      }
    },
    [tree, editMode, setEditMode]
  );

  const handlePan = useCallback(
    (deltaX: number, deltaY: number) => {
      const xDiff = (deltaX * CANVAS_SCALE_FACTOR) / zoom.val;
      const yDiff = (deltaY * CANVAS_SCALE_FACTOR) / zoom.val;

      dispatchPan({ x: xDiff, y: yDiff });
    },
    [dispatchPan, zoom]
  );

  /*
  const handleScroll = useCallback(
    (deltaX: number, deltaY: number) => {
      const diffX = (deltaX * -1.5) / zoom.val;
      const diffY = (deltaY * -1.5) / zoom.val;

      dispatchPan({ x: diffX, y: diffY });
    },
    [zoom, dispatchPan]
  );
  */

  const handleScale = useCallback(
    (deltaScale: number) => {
      dispatchZoom({ val: deltaScale });
    },
    [dispatchZoom]
  );

  const handleMouseMove = useCallback(
    (x: number, y: number, modifiers: ClickModifiers) => {
      if (!drawingInstance.current || !treeLayout.current) return;

      const point = getWindowPointOnCanvas(
        drawingInstance.current.context2D,
        x,
        y
      );
      const { node } = findTreeNodeAtCoordinate(
        point.x,
        point.y,
        treeLayout.current
      );
      if (mouseOverNode.current?.id !== node?.id) {
        setRefesher(Math.random());
      }
      mouseOverNode.current = node;
    },
    [drawingInstance.current, treeLayout.current]
  );

  const handleMouseUp = useCallback(
    (x: number, y: number, modifiers: ClickModifiers) => {
      if (popupMenuCtx.current.show) {
        // give a change for other callbacks get into invoked
        setTimeout(() => {
          popupMenuCtx.current.show = false;
          setRefesher(Math.random());
        }, 100);
      }
    },
    []
  );

  function handleDlgRename(value: string) {
    renameDialog.current.show = false;

    // rebuild the tree

    if (value && context2D && tree) {
      const nd: TreeNode | null = findTreeNodeById(
        tree,
        renameDialog.current.nodeId
      );
      if (nd) {
        nd.text = value;
        treeLayout.current = getTreeLayout(
          context2D,
          tree,
          800,
          32,
          canvasSize
        );
      }
    }

    setRefesher(Math.random());
  }

  return (
    <div style={styleObj}>
      <UserInput
        onClick={handleClick}
        onRightClick={handleRightClick}
        onPan={handlePan}
        onDClick={handleDClick}
        //onScroll={handleScroll}
        onScale={handleScale}
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
      />
      <FillCanvas ref={canvasRef} />
      <InputContainer>
        <Input
          value={searchValue}
          onChange={setSearchValue}
          placeholder="Search for nodes"
        />
        {editMode ? (
          <>
            <a id="downloadAnchorElem" style={{ display: "none" }}></a>
            <Button
              size="sm"
              variant="info"
              title="Save Changes"
              onClick={() => {
                var dataStr =
                  "data:text/json;charset=utf-8," +
                  encodeURIComponent(JSON.stringify(treeLayout.current));
                var dlAnchorElem =
                  document.getElementById("downloadAnchorElem");
                if (dlAnchorElem) {
                  dlAnchorElem.setAttribute("href", dataStr);
                  dlAnchorElem.setAttribute("download", "data.json");
                  dlAnchorElem.click();
                }
              }}
            >
              <i className="fas fa-download"></i>
            </Button>
            <Button
              size="sm"
              variant="danger"
              title="Save Changes"
              onClick={() => {
                onChange && treeLayout.current && onChange(treeLayout.current);
              }}
            >
              <i className="fas fa-floppy-disk"></i>
            </Button>
            <Button
              size="sm"
              title="Close"
              onClick={() => {
                setEditMode(() => false);
                onEditMode && onEditMode(false);
              }}
            >
              <i className="fas fa-window-close"></i>
            </Button>
          </>
        ) : (
          <Button
            size="sm"
            title="Edit Mode"
            onClick={() => {
              setEditMode(() => true);
              onEditMode && onEditMode(true);
            }}
          >
            <i className="fas fa-cog"></i>
          </Button>
        )}
      </InputContainer>
      {
        /* context menu */
        popupMenuCtx.current.show && (
          <PopupMenu
            style={{
              left: popupMenuCtx.current.left,
              top: popupMenuCtx.current.top,
            }}
          >
            <ListGroup>
              <ListGroup.Item
                action
                onClick={() => {
                  const nd =
                    tree && findTreeNodeById(tree, popupMenuCtx.current.nodeId);
                  if (nd) {
                    renameDialog.current.show = true;
                    renameDialog.current.nodeId = nd.id;
                    renameDialog.current.text = nd.text;
                  }
                }}
              >
                Rename
              </ListGroup.Item>
              <ListGroup.Item
                action
                onClick={() => {
                  const nd: TreeNode | any =
                    tree && findTreeNodeById(tree, popupMenuCtx.current.nodeId);
                  if (nd && context2D && tree) {
                    const parent: TreeNode | any = findTreeNodeById(
                      tree,
                      nd.parent
                    );
                    if (parent) {
                      const ids: string[] = parent.nodes.map((a: any) => a.id);
                      const idx = ids.indexOf(nd.id);
                      parent.nodes.splice(idx, 1);
                      parent.nodes.splice(Math.max(idx - 1, 0), 0, nd);
                      treeLayout.current = getTreeLayout(
                        context2D,
                        tree,
                        800,
                        32,
                        canvasSize
                      );
                      setRefesher(Math.random());
                    }
                  }
                }}
              >
                Move Up
              </ListGroup.Item>
              <ListGroup.Item
                action
                onClick={() => {
                  const nd: TreeNode | any =
                    tree && findTreeNodeById(tree, popupMenuCtx.current.nodeId);
                  if (nd && context2D && tree) {
                    const parent: TreeNode | any = findTreeNodeById(
                      tree,
                      nd.parent
                    );
                    if (parent) {
                      const ids: string[] = parent.nodes.map((a: any) => a.id);
                      const idx = ids.indexOf(nd.id);
                      parent.nodes.splice(idx, 1);
                      parent.nodes.splice(
                        Math.max(idx + 1, parent.nodes.length - 1),
                        0,
                        nd
                      );
                      treeLayout.current = getTreeLayout(
                        context2D,
                        tree,
                        800,
                        32,
                        canvasSize
                      );
                      setRefesher(Math.random());
                    }
                  }
                }}
              >
                Move Down
              </ListGroup.Item>
              <ListGroup.Item
                action
                onClick={() => {
                  const nd: TreeNode | any =
                    tree && findTreeNodeById(tree, popupMenuCtx.current.nodeId);
                  if (nd && context2D && tree) {
                    if (!nd.nodes) nd.nodes = [];
                    nd.nodes.push({
                      id: uuidv4(),
                      parent: nd.id,
                      text: "Untitle Node",
                    });
                    treeLayout.current = getTreeLayout(
                      context2D,
                      tree,
                      800,
                      32,
                      canvasSize
                    );
                    setRefesher(Math.random());
                  }
                }}
              >
                Add Child Node
              </ListGroup.Item>
              <ListGroup.Item
                action
                onClick={() => {
                  const nd: TreeNode | any =
                    tree && findTreeNodeById(tree, popupMenuCtx.current.nodeId);
                  if (nd && context2D && tree) {
                    const parent: TreeNode | any = findTreeNodeById(
                      tree,
                      nd.parent
                    );
                    if (parent) {
                      const ids: string[] = parent.nodes.map((a: any) => a.id);
                      const idx = ids.indexOf(nd.id);
                      parent.nodes.splice(idx, 1);

                      treeLayout.current = getTreeLayout(
                        context2D,
                        tree,
                        800,
                        32,
                        canvasSize
                      );
                      setRefesher(Math.random());
                    }
                  }
                }}
              >
                Remove Current Node
              </ListGroup.Item>
            </ListGroup>
          </PopupMenu>
        )
      }
      {
        /* Dialog */
        renameDialog.current.show && (
          <RenameDialog cb={handleDlgRename} str={renameDialog.current.text} />
        )
      }
    </div>
  );
};

interface RenameDialogProps {
  cb: (val: string) => void;
  str: string;
}

const RenameDialogDiv = styled.div`
  position: fixed;
  min-width: 400px;
  min-height: 100px;
  left: 0;
  top: 0;
  background: white;
  border: 1px solid lightgray;
  border-radius: 5px;
  margin-top: calc(20vh - 50px);
  margin-left: calc(50vw - 200px);

  > .header {
    background: lightgrey;
    padding: 0.1rem 0.5rem;
    > span {
      float: right;
      cursor: pointer;
    }
  }

  > .body {
    margin 1rem;

    > div:first-child {
      margin-top: 0.5rem;
    }

    > input {
      width: 100%;
    }

    > button {
      width: 100px;
      border: none;
      border-radius: 5px;
      margin: 0.5rem  0;
      color: white;
      background-color: #0d6efd;
      height: 32px;
      float: right;
    }

    > button:hover {
      background-color: #0b5ed7;
    }
  }
`;

function RenameDialog({ cb, str }: RenameDialogProps) {
  const [text, setText] = useState(str);

  return (
    <RenameDialogDiv>
      <div className="header">
        Prompt
        <span onClick={() => cb(str)}>&#10006;</span>
      </div>
      <div className="body">
        <div>Input Node Name:</div>
        <input
          type="text"
          onChange={(event) => setText(event.target.value)}
          value={text}
        />
        <button onClick={() => cb(text)}>OK</button>
      </div>
    </RenameDialogDiv>
  );
}

export default class MindmapWrapper extends React.Component<MindmapProps> {
  state = {
    refresher: 0,
  };

  constructor(props: MindmapProps) {
    super(props);
    this.state = { refresher: 0 };
  }

  updateRender() {
    this.setState({ refresher: Math.random() });
  }

  render() {
    return (
      <Mindmap
        json={this.props.json}
        onNodeClick={this.props.onNodeClick}
        onChange={this.props.onChange}
        onEditMode={this.props.onEditMode}
        style={this.props.style}
      />
    );
  }
}
