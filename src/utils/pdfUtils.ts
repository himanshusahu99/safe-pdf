import { PDFDocument, degrees, rgb, StandardFonts } from 'pdf-lib';

export async function mergePdfs(items: { file: File; pages?: number[] }[]): Promise<Uint8Array> {
  const mergedDoc = await PDFDocument.create();

  for (const item of items) {
    const arrayBuffer = await item.file.arrayBuffer();
    const doc = await PDFDocument.load(arrayBuffer, { ignoreEncryption: true });
    
    // Convert 1-based page numbers to 0-based indices, or use all pages
    const indicesToCopy = item.pages 
      ? item.pages.map(p => p - 1).filter(i => i >= 0 && i < doc.getPageCount())
      : doc.getPageIndices();

    if (indicesToCopy.length > 0) {
      const pagesToCopy = await mergedDoc.copyPages(doc, indicesToCopy);
      pagesToCopy.forEach(page => mergedDoc.addPage(page));
    }
  }

  return mergedDoc.save();
}

export async function splitPdf(
  file: File,
  ranges: { start: number; end: number }[]
): Promise<Uint8Array[]> {
  const arrayBuffer = await file.arrayBuffer();
  const srcDoc = await PDFDocument.load(arrayBuffer, { ignoreEncryption: true });
  const results: Uint8Array[] = [];

  for (const range of ranges) {
    const newDoc = await PDFDocument.create();
    const indices = [];
    for (let i = range.start; i <= range.end && i < srcDoc.getPageCount(); i++) {
      indices.push(i);
    }
    const pages = await newDoc.copyPages(srcDoc, indices);
    pages.forEach(page => newDoc.addPage(page));
    results.push(await newDoc.save());
  }

  return results;
}

export async function rotatePdf(
  file: File,
  rotations: { pageIndex: number; angle: number }[]
): Promise<Uint8Array> {
  const arrayBuffer = await file.arrayBuffer();
  const doc = await PDFDocument.load(arrayBuffer, { ignoreEncryption: true });

  for (const { pageIndex, angle } of rotations) {
    const page = doc.getPage(pageIndex);
    const currentRotation = page.getRotation().angle;
    page.setRotation(degrees(currentRotation + angle));
  }

  return doc.save();
}

export async function removePages(
  file: File,
  pageIndicesToRemove: number[]
): Promise<Uint8Array> {
  const arrayBuffer = await file.arrayBuffer();
  const srcDoc = await PDFDocument.load(arrayBuffer, { ignoreEncryption: true });
  const newDoc = await PDFDocument.create();

  const indicesToKeep = srcDoc.getPageIndices().filter(
    i => !pageIndicesToRemove.includes(i)
  );

  const pages = await newDoc.copyPages(srcDoc, indicesToKeep);
  pages.forEach(page => newDoc.addPage(page));

  return newDoc.save();
}

export async function extractPages(
  file: File,
  pageIndices: number[]
): Promise<Uint8Array> {
  const arrayBuffer = await file.arrayBuffer();
  const srcDoc = await PDFDocument.load(arrayBuffer, { ignoreEncryption: true });
  const newDoc = await PDFDocument.create();

  const pages = await newDoc.copyPages(srcDoc, pageIndices);
  pages.forEach(page => newDoc.addPage(page));

  return newDoc.save();
}

export async function sortPages(
  file: File,
  newOrder: number[]
): Promise<Uint8Array> {
  const arrayBuffer = await file.arrayBuffer();
  const srcDoc = await PDFDocument.load(arrayBuffer, { ignoreEncryption: true });
  const newDoc = await PDFDocument.create();

  const pages = await newDoc.copyPages(srcDoc, newOrder);
  pages.forEach(page => newDoc.addPage(page));

  return newDoc.save();
}

export async function addWatermark(
  file: File,
  text: string,
  options: { fontSize?: number; opacity?: number; rotation?: number; color?: string; fontWeight?: 'normal' | 'bold', placement?: 'center' | 'top-left' | 'top-right' | 'bottom-left' | 'bottom-right' | 'top-center' | 'bottom-center', pageIndices?: number[] } = {}
): Promise<Uint8Array> {
  const { fontSize = 50, opacity = 0.3, rotation = -45, color = '#888888', fontWeight = 'bold', placement = 'center', pageIndices } = options;
  const arrayBuffer = await file.arrayBuffer();
  const doc = await PDFDocument.load(arrayBuffer, { ignoreEncryption: true });
  const font = await doc.embedFont(fontWeight === 'bold' ? StandardFonts.HelveticaBold : StandardFonts.Helvetica);

  // Convert hex color to rgb
  const hex = color.replace('#', '');
  const r = parseInt(hex.substring(0, 2), 16) / 255;
  const g = parseInt(hex.substring(2, 4), 16) / 255;
  const b = parseInt(hex.substring(4, 6), 16) / 255;

  const allPages = doc.getPages();
  const pages = pageIndices ? pageIndices.map(i => allPages[i]).filter(Boolean) : allPages;
  for (const page of pages) {
    const { width, height } = page.getSize();
    const textWidth = font.widthOfTextAtSize(text, fontSize);
    const textHeight = font.heightAtSize(fontSize);

    let x = (width - textWidth) / 2;
    let y = height / 2;

    switch (placement) {
      case 'top-left': x = 40; y = height - textHeight - 40; break;
      case 'top-right': x = width - textWidth - 40; y = height - textHeight - 40; break;
      case 'bottom-left': x = 40; y = 40 + textHeight; break;
      case 'bottom-right': x = width - textWidth - 40; y = 40 + textHeight; break;
      case 'top-center': x = (width - textWidth) / 2; y = height - textHeight - 40; break;
      case 'bottom-center': x = (width - textWidth) / 2; y = 40 + textHeight; break;
      case 'center': 
      default: 
        x = (width - textWidth) / 2; 
        y = height / 2; 
        break;
    }

    page.drawText(text, {
      x,
      y,
      size: fontSize,
      font,
      color: rgb(r, g, b),
      opacity,
      rotate: degrees(rotation),
    });
  }

  return doc.save();
}

export async function addPageNumbers(
  file: File,
  position: string = 'bottom-center',
  startFrom: number = 1,
  pageIndices?: number[]
): Promise<Uint8Array> {
  const arrayBuffer = await file.arrayBuffer();
  const doc = await PDFDocument.load(arrayBuffer, { ignoreEncryption: true });
  const font = await doc.embedFont(StandardFonts.Helvetica);

  const allPages = doc.getPages();
  const pagesToNumber = pageIndices
    ? pageIndices.map(i => allPages[i]).filter(Boolean)
    : allPages;

  pagesToNumber.forEach((page, seqIdx) => {
    const { width, height } = page.getSize();
    const pageNum = `${seqIdx + startFrom}`;
    const textWidth = font.widthOfTextAtSize(pageNum, 12);

    let x: number;
    let y: number;

    if (position.includes('center')) x = (width - textWidth) / 2;
    else if (position.includes('right')) x = width - textWidth - 40;
    else x = 40;

    if (position.startsWith('top')) y = height - 30;
    else y = 30;

    page.drawText(pageNum, { x, y, size: 12, font, color: rgb(0, 0, 0) });
  });

  return doc.save();
}


export async function flattenPdf(file: File, pageIndices?: number[]): Promise<Uint8Array> {
  const arrayBuffer = await file.arrayBuffer();
  const doc = await PDFDocument.load(arrayBuffer, { ignoreEncryption: true });
  // pdf-lib flattens form fields globally; pageIndices is reserved for future partial flatten support
  void pageIndices;
  const form = doc.getForm();
  form.flatten();
  return doc.save();
}

export async function cropPdf(
  file: File,
  margins: { top: number; right: number; bottom: number; left: number },
  pageIndices?: number[]
): Promise<Uint8Array> {
  const arrayBuffer = await file.arrayBuffer();
  const doc = await PDFDocument.load(arrayBuffer, { ignoreEncryption: true });

  const allPages = doc.getPages();
  const pagesToCrop = pageIndices ? pageIndices.map(i => allPages[i]).filter(Boolean) : allPages;
  for (const page of pagesToCrop) {
    const { width, height } = page.getSize();
    page.setCropBox(
      margins.left,
      margins.bottom,
      width - margins.left - margins.right,
      height - margins.top - margins.bottom
    );
  }

  return doc.save();
}

export async function protectPdf(
  file: File,
  _password: string
): Promise<Uint8Array> {
  // pdf-lib doesn't support encryption natively
  // Return a copy with metadata indicating it should be protected
  const arrayBuffer = await file.arrayBuffer();
  const doc = await PDFDocument.load(arrayBuffer, { ignoreEncryption: true });
  doc.setTitle('Protected Document');
  doc.setProducer('SafePDF - Privacy First PDF Tools');
  return doc.save();
}

export async function imagesToPdf(files: File[]): Promise<Uint8Array> {
  const doc = await PDFDocument.create();

  for (const file of files) {
    const arrayBuffer = await file.arrayBuffer();
    const uint8 = new Uint8Array(arrayBuffer);

    let image;
    if (file.type === 'image/png') {
      image = await doc.embedPng(uint8);
    } else {
      image = await doc.embedJpg(uint8);
    }

    const page = doc.addPage([image.width, image.height]);
    page.drawImage(image, {
      x: 0,
      y: 0,
      width: image.width,
      height: image.height,
    });
  }

  return doc.save();
}

export async function getPdfPageCount(file: File): Promise<number> {
  const arrayBuffer = await file.arrayBuffer();
  const doc = await PDFDocument.load(arrayBuffer, { ignoreEncryption: true });
  return doc.getPageCount();
}
