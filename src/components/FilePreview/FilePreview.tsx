import { formatFileSize } from '../../utils/fileUtils';
import styles from './FilePreview.module.css';

interface FilePreviewItem {
  id: string;
  name: string;
  size: number;
  pageCount?: number;
}

interface FilePreviewProps {
  files: FilePreviewItem[];
  onRemove: (id: string) => void;
  onReorder?: (fromIndex: number, toIndex: number) => void;
  showDragHandle?: boolean;
}

export default function FilePreview({ files, onRemove, onReorder, showDragHandle = false }: FilePreviewProps) {
  const handleDragStart = (e: React.DragEvent, index: number) => {
    e.dataTransfer.setData('text/plain', index.toString());
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
  };

  const handleDrop = (e: React.DragEvent, toIndex: number) => {
    e.preventDefault();
    const fromIndex = parseInt(e.dataTransfer.getData('text/plain'), 10);
    if (fromIndex !== toIndex && onReorder) {
      onReorder(fromIndex, toIndex);
    }
  };

  return (
    <div className={styles.fileList}>
      {files.map((file, index) => (
        <div
          key={file.id}
          className={styles.fileItem}
          draggable={showDragHandle}
          onDragStart={(e) => handleDragStart(e, index)}
          onDragOver={handleDragOver}
          onDrop={(e) => handleDrop(e, index)}
        >
          {showDragHandle && (
            <span className={styles.dragHandle}>⠿</span>
          )}
          <div className={styles.fileIcon}>📄</div>
          <div className={styles.fileInfo}>
            <p className={styles.fileName}>{file.name}</p>
            <p className={styles.fileMeta}>
              {formatFileSize(file.size)}
              {file.pageCount ? ` · ${file.pageCount} pages` : ''}
            </p>
          </div>
          <button
            className={styles.removeButton}
            onClick={() => onRemove(file.id)}
            title="Remove file"
          >
            ✕
          </button>
        </div>
      ))}
    </div>
  );
}
