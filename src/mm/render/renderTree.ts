import { TreeNodeWithLayout } from '../helpers/getTreeLayout';
import { renderCurveBetweenNodes } from './renderCurveBetweenNodes';
import { IconType, renderIcon, renderNode } from './renderNode';

export const renderTree = (
  canvas2D: CanvasRenderingContext2D, node: TreeNodeWithLayout, searchTerm: string,
  hoverNode?: TreeNodeWithLayout, icon?: IconType) => {
  const isHover = (hoverNode?.id === node.id)
  renderNode(canvas2D, node, isHover, searchTerm);

  // If this node is collapsed, we don't want to continue rendering
  if (node.display?.collapsed) {
    if (isHover) {
      renderIcon(canvas2D, node.x, node.y, node.width, node.height, icon)
    }
    return;
  }

  // Render child nodes
  node.nodes.map((_node) => renderTree(canvas2D, _node, searchTerm, hoverNode, icon));

  // Render the line between current node and all child nodes
  node.nodes.forEach((_node) => {
    renderCurveBetweenNodes(canvas2D, node, _node);
  })

  if (isHover) {
    renderIcon(canvas2D, node.x, node.y, node.width, node.height, icon)
  }
};
