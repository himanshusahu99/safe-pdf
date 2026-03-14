import { useEffect, useState } from 'react';
import { renderPageToCanvas } from '../../utils/renderUtils';
import styles from './PagePreview.module.css';

interface PagePreviewProps {
  file: File;
  pageNumber: number;
  selected?: boolean;
  onSelect?: (pageNumber: number) => void;
  scale?: number;
}

export function PagePreview({ file, pageNumber, selected = false, onSelect, scale = 0.4 }: PagePreviewProps) {
  const [thumbnail, setThumbnail] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    renderPageToCanvas(file, pageNumber, scale).then(dataUrl => {
      if (!cancelled) setThumbnail(dataUrl);
    }).catch(() => {});
    return () => { cancelled = true; };
  }, [file, pageNumber, scale]);

  return (
    <div
      className={`${styles.page} ${selected ? styles.selected : ''}`}
      onClick={() => onSelect?.(pageNumber)}
    >
      {thumbnail ? (
        <img src={thumbnail} alt={`Page ${pageNumber}`} className={styles.thumbnail} />
      ) : (
        <div className={styles.placeholder}>Loading...</div>
      )}
      <span className={styles.pageNumber}>{pageNumber}</span>
      {selected && (
        <div className={styles.checkmark}>✓</div>
      )}
      <div className={styles.overlay} />
    </div>
  );
}

interface PagePreviewGridProps {
  file: File;
  pageCount: number;
  selectedPages?: number[];
  onSelectPage?: (pageNumber: number) => void;
}

export function PagePreviewGrid({ file, pageCount, selectedPages = [], onSelectPage }: PagePreviewGridProps) {
  return (
    <div className={styles.grid}>
      {Array.from({ length: pageCount }, (_, i) => i + 1).map(pageNum => (
        <PagePreview
          key={pageNum}
          file={file}
          pageNumber={pageNum}
          selected={selectedPages.includes(pageNum)}
          onSelect={onSelectPage}
        />
      ))}
    </div>
  );
}
