import { useEffect, useState } from 'react';
import * as pdfjsLib from 'pdfjs-dist';

pdfjsLib.GlobalWorkerOptions.workerSrc = new URL(
  'pdfjs-dist/build/pdf.worker.min.mjs',
  import.meta.url
).toString();
import { downloadBlob } from '../../utils/fileUtils';
import styles from './PdfPreviewSidebar.module.css';

interface PdfPreviewSidebarProps {
  data: Uint8Array;
  fileName: string;
  onClose: () => void;
}

export default function PdfPreviewSidebar({ data, fileName, onClose }: PdfPreviewSidebarProps) {
  const [pages, setPages] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const [customName, setCustomName] = useState(fileName);

  useEffect(() => {
    let cancelled = false;
    async function render() {
      try {
        const buffer = data.buffer.slice(data.byteOffset, data.byteOffset + data.byteLength);
        const pdf = await pdfjsLib.getDocument({ data: buffer as ArrayBuffer }).promise;
        const rendered: string[] = [];
        for (let i = 1; i <= pdf.numPages; i++) {
          const page = await pdf.getPage(i);
          const viewport = page.getViewport({ scale: 1.0 });
          const canvas = document.createElement('canvas');
          canvas.width = viewport.width;
          canvas.height = viewport.height;
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          await page.render({ canvas: canvas as any, viewport } as any).promise;
          rendered.push(canvas.toDataURL('image/png'));
          if (cancelled) return;
        }
        setPages(rendered);
        pdf.destroy();
      } catch {
        // Silently fail
      } finally {
        if (!cancelled) setLoading(false);
      }
    }
    render();
    return () => { cancelled = true; };
  }, [data]);

  const handleDownload = () => {
    let finalName = customName.trim() || 'document.pdf';
    if (!finalName.toLowerCase().endsWith('.pdf') && !finalName.toLowerCase().endsWith('.zip')) {
      const ext = fileName.includes('.zip') ? '.zip' : '.pdf';
      finalName += ext;
    }
    downloadBlob(data, finalName);
  };

  return (
    <>
      <div className={styles.backdrop} onClick={onClose} />
      <div className={styles.overlay}>
        <div className={styles.header}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flex: 1, position: 'relative' }}>
            <span style={{ fontSize: '16px', fontWeight: 600, color: 'var(--color-text-dim)' }}>Preview —</span>
            <div style={{ position: 'relative', flex: 1, maxWidth: '300px' }}>
              <input
                type="text"
                value={customName}
                onChange={e => setCustomName(e.target.value)}
                style={{
                  background: 'transparent',
                  border: 'none',
                  borderBottom: '1px dashed var(--color-border)',
                  padding: '2px 24px 2px 2px',
                  color: 'var(--color-text)',
                  fontSize: '16px',
                  fontWeight: 600,
                  width: '100%',
                  outline: 'none',
                }}
                placeholder="Filename..."
              />
              <span 
                style={{ 
                  position: 'absolute', 
                  right: '4px', 
                  top: '50%',
                  transform: 'translateY(-50%)',
                  fontSize: '14px', 
                  color: 'var(--color-text-dim)',
                  pointerEvents: 'none'
                }}
              >
                ✏️
              </span>
            </div>
          </div>
          <button className={styles.closeButton} onClick={onClose}>✕</button>
        </div>
        <div className={styles.pages}>
          {loading ? (
            <div className={styles.pagePlaceholder}>Loading preview...</div>
          ) : (
            pages.map((src, i) => (
              <div key={i}>
                <img src={src} alt={`Page ${i + 1}`} className={styles.pageImage} />
                <p className={styles.pageLabel}>Page {i + 1}</p>
              </div>
            ))
          )}
        </div>
        <div className={styles.footer}>
          <button className={styles.downloadButton} onClick={handleDownload}>
            ⬇️ Download {customName}
          </button>
        </div>
      </div>
    </>
  );
}
