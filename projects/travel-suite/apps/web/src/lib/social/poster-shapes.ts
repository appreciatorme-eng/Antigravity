/**
 * SVG shape generators for multi-layer poster composition.
 * Creates masks, dividers, and decorative shapes as SVG buffers
 * compatible with Sharp's composite API.
 */

const XMLNS = 'xmlns="http://www.w3.org/2000/svg"';

export function createRoundedRectMask(
  width: number,
  height: number,
  radius: number
): Buffer {
  return Buffer.from(
    `<svg width="${width}" height="${height}" ${XMLNS}>` +
    `<rect x="0" y="0" width="${width}" height="${height}" rx="${radius}" ry="${radius}" fill="white"/>` +
    `</svg>`
  );
}

export function createCircleMask(diameter: number): Buffer {
  const r = diameter / 2;
  return Buffer.from(
    `<svg width="${diameter}" height="${diameter}" ${XMLNS}>` +
    `<circle cx="${r}" cy="${r}" r="${r}" fill="white"/>` +
    `</svg>`
  );
}

export function createWaveBottomMask(
  width: number,
  height: number,
  waveDepth: number = 60
): Buffer {
  const cy = height - waveDepth;
  const cp1x = Math.round(width * 0.28);
  const cp1y = cy + Math.round(waveDepth * 1.4);
  const cp2x = Math.round(width * 0.72);
  const cp2y = cy - Math.round(waveDepth * 0.4);
  return Buffer.from(
    `<svg width="${width}" height="${height}" ${XMLNS}>` +
    `<path d="M0,0 L${width},0 L${width},${cy} ` +
    `C${cp2x},${cp1y} ${cp1x},${cp2y} 0,${cy} Z" fill="white"/>` +
    `</svg>`
  );
}

export function createWaveDivider(
  width: number,
  height: number,
  color: string,
  position: "top" | "bottom" = "bottom"
): Buffer {
  if (position === "top") {
    const h = Math.round(height * 0.45);
    return Buffer.from(
      `<svg width="${width}" height="${height}" ${XMLNS}>` +
      `<path d="M0,0 L${width},0 L${width},${h} ` +
      `C${Math.round(width * 0.7)},${h + 30} ${Math.round(width * 0.3)},${h - 20} 0,${h} Z" ` +
      `fill="${color}"/>` +
      `</svg>`
    );
  }
  const startY = Math.round(height * 0.55);
  return Buffer.from(
    `<svg width="${width}" height="${height}" ${XMLNS}>` +
    `<path d="M0,${startY} ` +
    `C${Math.round(width * 0.3)},${startY - 30} ${Math.round(width * 0.7)},${startY + 30} ${width},${startY} ` +
    `L${width},${height} L0,${height} Z" ` +
    `fill="${color}"/>` +
    `</svg>`
  );
}

export function createDiagonalMask(
  width: number,
  height: number,
  direction: "left" | "right" = "right"
): Buffer {
  const cutH = Math.round(height * 0.75);
  const path =
    direction === "right"
      ? `M0,0 L${width},0 L${width},${cutH} L0,${height} Z`
      : `M0,0 L${width},0 L${width},${height} L0,${cutH} Z`;
  return Buffer.from(
    `<svg width="${width}" height="${height}" ${XMLNS}>` +
    `<path d="${path}" fill="white"/>` +
    `</svg>`
  );
}

export function createGradientBlock(
  width: number,
  height: number,
  startColor: string,
  endColor: string,
  direction: "horizontal" | "vertical" | "diagonal" = "vertical"
): Buffer {
  const [x1, y1, x2, y2] =
    direction === "horizontal" ? ["0%", "0%", "100%", "0%"] :
    direction === "diagonal" ? ["0%", "0%", "100%", "100%"] :
    ["0%", "0%", "0%", "100%"];
  return Buffer.from(
    `<svg width="${width}" height="${height}" ${XMLNS}>` +
    `<defs><linearGradient id="g" x1="${x1}" y1="${y1}" x2="${x2}" y2="${y2}">` +
    `<stop offset="0%" stop-color="${startColor}"/>` +
    `<stop offset="100%" stop-color="${endColor}"/>` +
    `</linearGradient></defs>` +
    `<rect width="${width}" height="${height}" fill="url(#g)"/>` +
    `</svg>`
  );
}

export function createSolidBlock(
  width: number,
  height: number,
  color: string
): Buffer {
  return Buffer.from(
    `<svg width="${width}" height="${height}" ${XMLNS}>` +
    `<rect width="${width}" height="${height}" fill="${color}"/>` +
    `</svg>`
  );
}

export function createDropShadow(
  width: number,
  height: number,
  borderRadius: number,
  shadowColor: string = "rgba(0,0,0,0.15)",
  blur: number = 20,
  offsetY: number = 8
): Buffer {
  return Buffer.from(
    `<svg width="${width + blur * 2}" height="${height + blur * 2}" ${XMLNS}>` +
    `<defs><filter id="s"><feGaussianBlur in="SourceGraphic" stdDeviation="${blur / 2}"/></filter></defs>` +
    `<rect x="${blur}" y="${blur + offsetY}" width="${width}" height="${height}" ` +
    `rx="${borderRadius}" ry="${borderRadius}" fill="${shadowColor}" filter="url(#s)"/>` +
    `</svg>`
  );
}
