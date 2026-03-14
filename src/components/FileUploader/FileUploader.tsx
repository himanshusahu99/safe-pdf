import { useCallback, useRef, useState } from 'react';
import { SecurityNotice, NoAccountBadge } from '../SecurityNotice/SecurityNotice';
import styles from './FileUploader.module.css';

interface FileUploaderProps {
  onFilesSelected: (files: File[]) => void;
  accept?: string;
  multiple?: boolean;
  label?: string;
}

export default function FileUploader({
  onFilesSelected,
  accept = '.pdf',
  multiple = false,
  label = 'Drop your PDF files here',
}: FileUploaderProps) {
  const [isDragActive, setIsDragActive] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragActive(true);
  }, []);

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragActive(false);
  }, []);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragActive(false);
    const droppedFiles = Array.from(e.dataTransfer.files);
    if (droppedFiles.length > 0) {
      onFilesSelected(droppedFiles);
    }
  }, [onFilesSelected]);

  const handleClick = () => {
    inputRef.current?.click();
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selected = Array.from(e.target.files || []);
    if (selected.length > 0) {
      onFilesSelected(selected);
    }
    // Reset input so the same file can be re-selected
    e.target.value = '';
  };

  return (
    <div
      className={`${styles.dropzone} ${isDragActive ? styles.active : ''}`}
      onDragOver={handleDragOver}
      onDragLeave={handleDragLeave}
      onDrop={handleDrop}
      onClick={handleClick}
    >
      <span className={styles.icon}>📁</span>
      <p className={styles.title}>{label}</p>
      <p className={styles.subtitle}>
        or <span className={styles.browseLink}>browse files</span>
      </p>
      <p className={styles.formats}>
        {accept === '.pdf' ? 'Supported: PDF files' : `Supported: ${accept}`}
      </p>
      <input
        ref={inputRef}
        type="file"
        accept={accept}
        multiple={multiple}
        onChange={handleFileChange}
        className={styles.hiddenInput}
      />
      
      <NoAccountBadge />
      
      <div style={{ marginTop: 'var(--space-md)' }}>
        <SecurityNotice />
      </div>
    </div>
  );
}
