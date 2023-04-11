import { NODE_ICON_SIZE } from '../render/renderNode';
import { TreeNode, TreeNodeWithLayout } from './getTreeLayout';

const isCoordinateInRectangle = (
  coordinateX: number,
  coordinateY: number,
  x: number,
  y: number,
  width: number,
  height: number,
) => {
  return coordinateX >= x && coordinateX <= x + width && coordinateY >= y && coordinateY <= y + height;
};

export const findTreeNodeAtCoordinate = (
  x: number,
  y: number,
  node: TreeNodeWithLayout,
): { node: TreeNodeWithLayout | undefined, hoverIcon: boolean } => {
  let hoverIcon = false
  // Check current node for match
  if (isCoordinateInRectangle(x, y, node.x, node.y, node.width, node.height)) {
    if (x > node.x + node.width - NODE_ICON_SIZE)
      hoverIcon = true
    return { node, hoverIcon };
  }

  // Check all children
  for (let i = 0; i < node.nodes.length; i++) {
    const match = findTreeNodeAtCoordinate(x, y, node.nodes[i]);
    if (match.node) return match;
  }

  return { node: undefined, hoverIcon: false }
};

export const findTreeNodeById = (tree: TreeNode, nodeId: any): TreeNode | null => {
  if (tree.id == nodeId)
    return tree

  if (tree.nodes)
    for (const nd of tree.nodes) {
      const match = findTreeNodeById(nd, nodeId)
      if (match) return match
    }
  return null
}
