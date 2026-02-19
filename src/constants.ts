// Port layout
export const PORT_SPACING = 20;
export const PORT_RADIUS = 3;
export const PORT_OFFSET = 35;
export const PORT_INSET = 0;

// Content layout
export const ELEMENT_HEIGHT = 30;
export const CONTENT_GAP = 5;
export const CONTENT_PADDING = 5;

// Header height based on max port count
export function headerHeight(maxPorts: number): number {
  return maxPorts > 0
    ? PORT_OFFSET + (maxPorts - 1) * PORT_SPACING + CONTENT_GAP + 5
    : PORT_OFFSET;
}

// Calculate total node height from port count and UI element count
export function calcNodeHeight(maxPorts: number, elementCount: number): number {
  const header = headerHeight(maxPorts);
  if (elementCount === 0) return header;
  return (
    header +
    CONTENT_PADDING * 2 +
    elementCount * ELEMENT_HEIGHT +
    Math.max(0, elementCount - 1) * CONTENT_GAP
  );
}
