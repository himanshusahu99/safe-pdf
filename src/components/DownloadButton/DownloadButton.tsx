import { useState, useEffect } from 'react';
import { downloadBlob } from '../../utils/fileUtils';
import styles from './DownloadButton.module.css';

interface DownloadButtonProps {
  data: Uint8Array | null;
  fileName: string;
  label?: string;
  disabled?: boolean;
}

export default function DownloadButton({ data, fileName, label = 'Download PDF', disabled = false }: DownloadButtonProps) {
  const [customName, setCustomName] = useState(fileName);

  // Update input if the prop changes
  useEffect(() => {
    setCustomName(fileName);
  }, [fileName]);

  const handleDownload = () => {
    if (data) {
      let finalName = customName.trim() || 'document.pdf';
      if (!finalName.toLowerCase().endsWith('.pdf') && !finalName.toLowerCase().endsWith('.zip')) {
        const ext = fileName.includes('.zip') ? '.zip' : '.pdf';
        finalName += ext;
      }
      downloadBlob(data, finalName);
    }
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'row', gap: '12px', alignItems: 'center', flexWrap: 'wrap' }}>
      <div style={{ display: 'flex', alignItems: 'center', position: 'relative', width: '240px', minHeight: '42px' }}>
        <input
          type="text"
          value={customName}
          onChange={(e) => setCustomName(e.target.value)}
          disabled={disabled || !data}
          style={{
            background: 'transparent',
            border: 'none',
            borderBottom: '1px dashed var(--color-border)',
            borderRadius: '0',
            padding: '4px 28px 4px 4px',
            color: 'var(--color-text)',
            fontSize: '14px',
            fontWeight: 500,
            width: '100%',
            outline: 'none',
          }}
          placeholder="Filename..."
        />
        <span 
          style={{ 
            position: 'absolute', 
            right: '8px', 
            fontSize: '14px', 
            color: 'var(--color-text-dim)',
            pointerEvents: 'none',
            opacity: (disabled || !data) ? 0.5 : 1
          }}
        >
          ✏️
        </span>
      </div>
      <button
        className={`${styles.button} ${styles.success} ${disabled || !data ? styles.disabled : ''}`}
        onClick={handleDownload}
        disabled={disabled || !data}
      >
        <span className={styles.icon}>⬇️</span>
        {label}
      </button>
    </div>
  );
}
