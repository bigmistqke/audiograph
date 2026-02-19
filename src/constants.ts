// Grid
export const GRID = 10;

// Port layout
export const PORT_SPACING = 20;
export const PORT_RADIUS = 3;
export const PORT_INSET = 0;

export const TITLE_HEIGHT = 35;
export const HEADING_PADDING_BLOCK = 7.5;
export const HEADING_PADDING_INLINE = 7.5;

// Content layout
export const ELEMENT_HEIGHT = 30;
export const GAP = 5;
export const CONTENT_PADDING_BLOCK = 5;
export const CONTENT_PADDING_INLINE = 5;

// Header height based on max port count
export function headerHeight(maxPorts: number): number {
  return (
    (maxPorts > 0
      ? TITLE_HEIGHT + (maxPorts - 1) * PORT_SPACING
      : TITLE_HEIGHT) +
    HEADING_PADDING_BLOCK * 2
  );
}

// Calculate total node height from port count and UI element count
export function calcNodeHeight(
  maxPorts: number,
  elementCount: number,
  debug?: boolean,
): number {
  const header = headerHeight(maxPorts);

  if (debug) {
    console.log(
      header,
      CONTENT_PADDING_BLOCK * 2,
      elementCount * ELEMENT_HEIGHT,
      Math.max(0, elementCount - 1) * GAP,
    );
  }

  if (elementCount === 0) return header;

  return (
    header +
    CONTENT_PADDING_BLOCK * 2 +
    elementCount * ELEMENT_HEIGHT +
    Math.max(0, elementCount - 1) * GAP
  );
}

/** Round a value to the nearest grid line. */
export function snapToGrid(value: number): number {
  return Math.round(value / GRID) * GRID;
}
