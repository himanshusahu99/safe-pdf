import { useEffect, useState } from 'react';
import { renderPageToCanvas } from '../../utils/renderUtils';
import styles from './PageSelector.module.css';

const CHUNK_SIZE = 10;

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
  // Central thumbnail map: null = loading, string = data URL
  const [thumbnails, setThumbnails] = useState<Record<number, string | null>>(() => {
    const initial: Record<number, string | null> = {};
    for (let i = 1; i <= pageCount; i++) initial[i] = null;
    return initial;
  });

  useEffect(() => {
    let cancelled = false;
    const allPages = Array.from({ length: pageCount }, (_, i) => i + 1);

    const loadChunk = async (chunk: number[]) => {
      for (const pageNum of chunk) {
        if (cancelled) return;
        try {
          const url = await renderPageToCanvas(file, pageNum, 0.4);
          if (!cancelled) {
            setThumbnails(prev => ({ ...prev, [pageNum]: url }));
          }
        } catch {
          if (!cancelled) {
            setThumbnails(prev => ({ ...prev, [pageNum]: '' }));
          }
        }
      }
    };

    const runAll = async () => {
      for (let i = 0; i < allPages.length; i += CHUNK_SIZE) {
        if (cancelled) return;
        const chunk = allPages.slice(i, i + CHUNK_SIZE);
        await loadChunk(chunk);
      }
    };

    runAll();
    return () => { cancelled = true; };
  }, [file, pageCount]);

  return (
    <div>
      <div className={styles.toolbar}>
        {selectedPages.length === pageCount ? (
          <button className={styles.deselectAll} onClick={onDeselectAll}>☐ Deselect All</button>
        ) : (
          <button className={styles.selectAll} onClick={onSelectAll}>☑️ Select All</button>
        )}
        <span className={styles.count}>{selectedPages.length} of {pageCount} selected</span>
      </div>
      <div className={styles.grid}>
        {Array.from({ length: pageCount }, (_, i) => i + 1).map(pageNum => (
          <PageCard
            key={pageNum}
            pageNumber={pageNum}
            thumbnail={thumbnails[pageNum]}
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
  pageNumber: number;
  thumbnail: string | null | undefined;
  selected: boolean;
  onToggle: () => void;
  actions?: PageAction[];
  rotation?: number;
}

function PageCard({ pageNumber, thumbnail, selected, onToggle, actions, rotation }: PageCardProps) {
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
        <div className={styles.placeholder}>
          {thumbnail === '' ? 'Error' : 'Loading…'}
        </div>
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
