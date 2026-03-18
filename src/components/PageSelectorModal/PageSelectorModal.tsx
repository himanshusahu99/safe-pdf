import { useState } from 'react';
import PageSelector from '../PageSelector/PageSelector';
import styles from './PageSelectorModal.module.css';

interface PageSelectorModalProps {
  file: File;
  pageCount: number;
  initialSelectedPages?: number[];
  onSave: (selectedPages: number[]) => void;
  onClose: () => void;
}

export default function PageSelectorModal({ file, pageCount, initialSelectedPages, onSave, onClose }: PageSelectorModalProps) {
  const [selectedPages, setSelectedPages] = useState<number[]>(
    initialSelectedPages || Array.from({ length: pageCount }, (_, i) => i + 1)
  );

  const handleToggle = (p: number) =>
    setSelectedPages(prev => prev.includes(p) ? prev.filter(x => x !== p) : [...prev, p]);

  return (
    <div className={styles.overlay}>
      <div className={styles.modal}>
        <div className={styles.header}>
          <div>
            <h3 className={styles.title}>Select Pages to Include</h3>
            <p className={styles.subtitle}>{file.name}</p>
          </div>
          <button className={styles.closeBtn} onClick={onClose} title="Close">✕</button>
        </div>

        <div className={styles.body}>
          <PageSelector
            file={file}
            pageCount={pageCount}
            selectedPages={selectedPages}
            onTogglePage={handleToggle}
            onSelectAll={() => setSelectedPages(Array.from({ length: pageCount }, (_, i) => i + 1))}
            onDeselectAll={() => setSelectedPages([])}
          />
        </div>

        <div className={styles.footer}>
          <button className={styles.cancelBtn} onClick={onClose}>Cancel</button>
          <button
            className={styles.saveBtn}
            onClick={() => onSave(selectedPages)}
            disabled={selectedPages.length === 0}
          >
            Apply — {selectedPages.length} page{selectedPages.length !== 1 ? 's' : ''}
          </button>
        </div>
      </div>
    </div>
  );
}
