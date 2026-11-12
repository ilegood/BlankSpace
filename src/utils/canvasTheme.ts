/** Returns a display-only darkened color while leaving the saved user value untouched. */
export function blendCanvasColorForDarkMode(color: string, darkBaseStrength = 0.82): string {
  const match = color.match(/^#([\da-f]{6})$/i);
  if (!match) return color;

  const base = [30, 30, 39];
  const rgb = match[1].match(/[\da-f]{2}/gi)?.map((value) => parseInt(value, 16));
  if (!rgb || rgb.length !== 3) return color;

  return `#${rgb
    .map((value, index) => Math.round(base[index] * darkBaseStrength + value * (1 - darkBaseStrength)).toString(16).padStart(2, '0'))
    .join('')}`;
}

export function getCanvasSurfaceColor(color: string | undefined, isDark: boolean): string {
  const surface = color || '#FFFFFF';
  return isDark ? blendCanvasColorForDarkMode(surface) : surface;
}
