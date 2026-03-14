import { useState, useCallback } from 'react';
import ToolLayout from '../../components/ToolLayout/ToolLayout';
import FileUploader from '../../components/FileUploader/FileUploader';
import ProcessingLoader from '../../components/ProcessingLoader/ProcessingLoader';
import DownloadButton from '../../components/DownloadButton/DownloadButton';
import PdfPreviewSidebar from '../../components/PdfPreviewSidebar/PdfPreviewSidebar';
import ToolExplanation from '../../components/ToolExplanation/ToolExplanation';
import { addPageNumbers } from '../../utils/pdfUtils';
import styles from '../shared/ToolShared.module.css';

const POSITIONS = [
  { value: 'bottom-center', label: 'Bottom Center' },
  { value: 'bottom-left', label: 'Bottom Left' },
  { value: 'bottom-right', label: 'Bottom Right' },
  { value: 'top-center', label: 'Top Center' },
  { value: 'top-left', label: 'Top Left' },
  { value: 'top-right', label: 'Top Right' },
];

export default function AddPageNumbers() {
  const [file, setFile] = useState<File | null>(null);
  const [position, setPosition] = useState('bottom-center');
  const [startNumber, setStartNumber] = useState(1);
  const [isProcessing, setIsProcessing] = useState(false);
  const [result, setResult] = useState<Uint8Array | null>(null);
  const [showPreview, setShowPreview] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleFileSelected = useCallback((files: File[]) => {
    setFile(files[0]);
    setResult(null);
    setError(null);
  }, []);

  const handleAddNumbers = async () => {
    if (!file) return;
    setIsProcessing(true);
    setError(null);
    try {
      const numbered = await addPageNumbers(file, position, startNumber);
      setResult(numbered);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to add page numbers');
    } finally { setIsProcessing(false); }
  };

  return (
    <ToolLayout title="Add Page Numbers" description="Number the pages of your PDF" icon="🔢" color="#8b5cf6" error={error}>
      <div className={styles.container}>
        {!file ? (
          <FileUploader onFilesSelected={handleFileSelected} accept=".pdf" label="Drop your PDF to add page numbers" />
        ) : (
          <div className={styles.fileSection}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
              <h3 className={styles.sectionTitle}>{file.name}</h3>
              <button 
                onClick={() => { const input = document.createElement('input'); input.type = 'file'; input.accept = '.pdf';  input.onchange = (e) => { const f = (e.target as HTMLInputElement).files; if (f?.length) handleFileSelected(Array.from(f)); }; input.click(); }} 
                style={{ background: 'transparent', border: '1px solid var(--color-border)', borderRadius: '6px', padding: '4px 12px', fontSize: '12px', color: 'var(--color-text-muted)', cursor: 'pointer' }}
              >
                Change File
              </button>
            </div>
            <div className={styles.optionGroup}>
              <label className={styles.optionLabel}>Position:</label>
              <select
                className={styles.optionInput}
                value={position}
                onChange={e => setPosition(e.target.value)}
              >
                {POSITIONS.map(p => (
                  <option key={p.value} value={p.value}>{p.label}</option>
                ))}
              </select>
            </div>
            <div className={styles.optionGroup}>
              <label className={styles.optionLabel}>Start from number:</label>
              <input className={styles.optionInput} type="number" min={1} value={startNumber} onChange={e => setStartNumber(Number(e.target.value))} />
            </div>
            <div className={styles.actions}>
              <button className={styles.primaryButton} onClick={handleAddNumbers}>🔢 Add Page Numbers</button>
            </div>
          </div>
        )}
        {result && (
          <div className={styles.resultSection}>
            <h3 className={styles.resultTitle}>✅ Page numbers added!</h3>
            <div className={styles.actions}>
              <DownloadButton data={result} fileName={`numbered_${file?.name || 'document.pdf'}`} />
              <button className={styles.primaryButton} onClick={() => setShowPreview(true)} style={{ background: 'var(--glass-bg)', border: 'var(--glass-border)' }}>👁️ Preview</button>
              <button onClick={() => { const input = document.createElement('input'); input.type = 'file'; input.accept = '.pdf';  input.onchange = (e) => { const f = (e.target as HTMLInputElement).files; if (f?.length) handleFileSelected(Array.from(f)); }; input.click(); }} style={{ background: "transparent", border: "1px solid var(--color-border)", borderRadius: 'var(--radius-md)', padding: '12px 20px', color: "var(--color-text)", cursor: 'pointer', fontWeight: 500, fontSize: '14px' }}>Upload New File</button>
            </div>
          </div>
        )}
      </div>
      {isProcessing && <ProcessingLoader message="Adding page numbers..." />}
      {showPreview && result && <PdfPreviewSidebar data={result} fileName={`numbered_${file?.name || 'document.pdf'}`} onClose={() => setShowPreview(false)} />}
      <ToolExplanation title="Add Page Numbers">
        <p><strong>Add Page Numbers</strong> inserts sequential page numbers on every page of your PDF.</p>
        <p>Choose from 6 positions: top-left, top-center, top-right, bottom-left, bottom-center, or bottom-right. You can also set a custom starting number if your document doesn't start from page 1.</p>
      </ToolExplanation>
    </ToolLayout>
  );
}
