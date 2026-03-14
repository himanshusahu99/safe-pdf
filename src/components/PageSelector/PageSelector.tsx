import { useEffect, useState } from 'react';
import { renderPageToCanvas } from '../../utils/renderUtils';
import styles from './PageSelector.module.css';

interface PageAction {
  icon: string;
  title: string;
  onClick: (pageNumber: number) => void;
}

interface PageSelectorProps {
  file: File;
  pageCount: number;
  selectedPages: number[];
  onTogglePage: (pageNumber: number) => void;
  onSelectAll: () => void;
  onDeselectAll: () => void;
  actions?: PageAction[];
  pageRotations?: Record<number, number>;
}

export default function PageSelector({
  file,
  pageCount,
  selectedPages,
  onTogglePage,
  onSelectAll,
  onDeselectAll,
  actions,
  pageRotations,
}: PageSelectorProps) {
  return (
    <div>
      <div className={styles.toolbar}>
        <button className={styles.selectAll} onClick={onSelectAll}>☑️ Select All</button>
        <button className={styles.deselectAll} onClick={onDeselectAll}>☐ Deselect All</button>
        <span className={styles.count}>{selectedPages.length} of {pageCount} selected</span>
      </div>
      <div className={styles.grid}>
        {Array.from({ length: pageCount }, (_, i) => i + 1).map(pageNum => (
          <PageCard
            key={pageNum}
            file={file}
            pageNumber={pageNum}
            selected={selectedPages.includes(pageNum)}
            onToggle={() => onTogglePage(pageNum)}
            actions={actions}
            rotation={pageRotations?.[pageNum]}
          />
        ))}
      </div>
    </div>
  );
}

interface PageCardProps {
  file: File;
  pageNumber: number;
  selected: boolean;
  onToggle: () => void;
  actions?: PageAction[];
  rotation?: number;
}

function PageCard({ file, pageNumber, selected, onToggle, actions, rotation }: PageCardProps) {
  const [thumbnail, setThumbnail] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    renderPageToCanvas(file, pageNumber, 0.4).then(url => {
      if (!cancelled) setThumbnail(url);
    }).catch(() => {});
    return () => { cancelled = true; };
  }, [file, pageNumber]);

  return (
    <div
      className={`${styles.pageCard} ${selected ? styles.selected : styles.unselected}`}
      onClick={onToggle}
    >
      {thumbnail ? (
        <img
          src={thumbnail}
          alt={`Page ${pageNumber}`}
          className={styles.thumbnail}
          style={rotation ? { transform: `rotate(${rotation}deg)` } : undefined}
        />
      ) : (
        <div className={styles.placeholder}>Loading...</div>
      )}
      <span className={styles.pageNumber}>{pageNumber}</span>
      {selected && <div className={styles.checkmark}>✓</div>}
      {actions && actions.length > 0 && (
        <div className={styles.actionOverlay}>
          {actions.map((action, i) => (
            <button
              key={i}
              className={styles.actionButton}
              title={action.title}
              onClick={(e) => { e.stopPropagation(); action.onClick(pageNumber); }}
            >
              {action.icon}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
