import { BLOCK_NODE_PADDING } from '../constants/render.constants';
import { themeColors } from '../constants/theme';
import { TreeNodeDisplay, TreeNodeWithLayout } from '../helpers/getTreeLayout';
import { renderNodeCounter } from './renderNodeCounter';
import { renderRounderRect } from './renderRoundedRect';
import { renderText } from './renderText';

const getTextColor = (display: TreeNodeDisplay) => {
  if (display?.block) {
    return '#191919';
  }

  if (display?.faded) {
    return '#adabab';
  }

  return '#e2e2e2';
};

const getBlockColor = (display: TreeNodeDisplay) => {
  if (!display?.block) {
    return '#e2e2e2';
  }

  switch (display?.blockStyle) {
    case 'info':
      return themeColors.statusInfo.main;
    case 'success':
      return themeColors.statusSuccess.main;
    case 'warn':
      return themeColors.statusWarn.main;
    case 'danger':
      return themeColors.statusDanger.main;
    case 'default':
    default:
      return '#e2e2e2';
  }
};

export const NODE_ICON_SIZE = 32;

export type IconType = '\uF067' | '\uF068'

export function renderIcon(context: CanvasRenderingContext2D, x: number, y: number, width: number, height: number, icon?: IconType) {
  if (!icon)
    return
  // set the canvas context's font-size and font-face
  context.font = `900 ${NODE_ICON_SIZE}px 'Font Awesome 5 Free'`;

  // specify the desired character code with the Unicode prefix (\u)
  const _x = x + width - NODE_ICON_SIZE
  const _y = y + (height - NODE_ICON_SIZE) * 0.5
  context.fillStyle = '#ffffff'
  context.fillRect(_x, _y, NODE_ICON_SIZE, NODE_ICON_SIZE)
  context.fillStyle = '#444444'
  context.fillText(icon, _x + 3, _y)
}

export const renderNode = (canvas2D: CanvasRenderingContext2D, node: TreeNodeWithLayout, underline: boolean, searchTerm: string) => {
  const { display = {} } = node;

  // draw debug rect
  //renderRounderRect(canvas2D, node.x, node.y, node.width, node.height, 0, '#ff0000')

  // If we're at a block node, render the block and adjust coords
  const nodeX = display.block ? node.x + BLOCK_NODE_PADDING : node.x;
  const nodeY = display.block ? node.y + BLOCK_NODE_PADDING : node.y;
  if (display.block) {
    renderRounderRect(canvas2D, node.x, node.y + 3, node.width, node.height, 10, getBlockColor(display));
  }

  // Render the main node
  renderText(canvas2D, node.lines, nodeX, nodeY, node.width, getTextColor(display), underline, searchTerm);

  // If this node is collapsed, we want to render a counter and no children
  if (display.collapsed) {
    renderNodeCounter(canvas2D, node);
    return;
  }
};
