import { toPng } from 'html-to-image';

export interface ExportImageOptions {
  fileName?: string;
  backgroundColor?: string;
  quality?: number;
}

export async function exportElementAsPng(
  element: HTMLElement,
  options: ExportImageOptions = {}
): Promise<void> {
  const {
    fileName = `blankspace-export-${Date.now()}`,
    backgroundColor = '#FFFFFF',
    quality = 0.95,
  } = options;

  try {
    const dataUrl = await toPng(element, {
      backgroundColor,
      quality,
      pixelRatio: 2, // crisp high resolution
      filter: (node) => {
        // Exclude UI controls that should not appear in the exported image
        if (node instanceof HTMLElement) {
          if (node.dataset.exportIgnore === 'true') {
            return false;
          }
        }
        return true;
      },
    });

    const link = document.createElement('a');
    link.download = `${fileName.replace(/[/\\?%*:|"<>]/g, '_')}.png`;
    link.href = dataUrl;
    link.click();
  } catch (error) {
    console.error('Failed to export element as PNG:', error);
    throw error;
  }
}

