import { toPng } from 'html-to-image';

export interface ExportImageOptions {
  fileName: string;
  backgroundColor?: string;
}

function sanitizeFileName(name: string): string {
  const cleaned = name
    .replace(/[\\/:*?"<>|]/g, '_')
    .replace(/\s+/g, ' ')
    .trim();
  return cleaned || 'blankspace-template';
}

export async function exportElementAsPng(
  element: HTMLElement,
  { fileName, backgroundColor }: ExportImageOptions
): Promise<void> {
  const isDark = document.documentElement.classList.contains('dark');
  const computedBg = window.getComputedStyle(element).backgroundColor;
  const resolvedBg =
    backgroundColor ||
    (computedBg && computedBg !== 'rgba(0, 0, 0, 0)' && computedBg !== 'transparent'
      ? computedBg
      : isDark
        ? '#15151C'
        : '#FFFFFF');

  const width = Math.max(element.scrollWidth, element.clientWidth, element.offsetWidth);
  const height = Math.max(element.scrollHeight, element.clientHeight, element.offsetHeight);

  const dataUrl = await toPng(element, {
    cacheBust: true,
    pixelRatio: 2,
    backgroundColor: resolvedBg,
    width,
    height,
    style: {
      transform: 'scale(1)',
      transformOrigin: 'top left',
      margin: '0',
    },
    filter: (node) => {
      if (node instanceof HTMLElement && node.dataset?.exportIgnore === 'true') {
        return false;
      }
      return true;
    },
  });

  const link = document.createElement('a');
  link.download = `${sanitizeFileName(fileName)}.png`;
  link.href = dataUrl;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
}
