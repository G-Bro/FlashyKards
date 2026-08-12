import { toPng } from 'html-to-image';

export async function exportElementToPng(element: HTMLElement, filename: string): Promise<void> {
  const dataUrl = await toPng(element, {
    cacheBust: true,
    pixelRatio: 2,
    backgroundColor: '#ffffff',
  });

  const link = document.createElement('a');
  link.download = filename;
  link.href = dataUrl;
  link.click();
}

export async function copyElementToClipboard(element: HTMLElement): Promise<boolean> {
  try {
    const dataUrl = await toPng(element, { cacheBust: true, pixelRatio: 2, backgroundColor: '#ffffff' });
    const response = await fetch(dataUrl);
    const blob = await response.blob();
    await navigator.clipboard.write([new ClipboardItem({ 'image/png': blob })]);
    return true;
  } catch {
    return false;
  }
}

export async function shareElement(element: HTMLElement, title: string): Promise<boolean> {
  try {
    const dataUrl = await toPng(element, { cacheBust: true, pixelRatio: 2, backgroundColor: '#ffffff' });
    const response = await fetch(dataUrl);
    const blob = await response.blob();
    const file = new File([blob], `${title.replace(/\s+/g, '-').toLowerCase()}.png`, { type: 'image/png' });
    if (navigator.share && navigator.canShare?.({ files: [file] })) {
      await navigator.share({ title, files: [file] });
      return true;
    }
    return false;
  } catch {
    return false;
  }
}
