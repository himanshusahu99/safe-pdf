import { useState, useCallback } from 'react';
import ToolLayout from '../../components/ToolLayout/ToolLayout';
import FileUploader from '../../components/FileUploader/FileUploader';
import ProcessingLoader from '../../components/ProcessingLoader/ProcessingLoader';
import DownloadButton from '../../components/DownloadButton/DownloadButton';
import PdfPreviewSidebar from '../../components/PdfPreviewSidebar/PdfPreviewSidebar';
import ToolExplanation from '../../components/ToolExplanation/ToolExplanation';
import styles from '../shared/ToolShared.module.css';

export default function UnlockPdf() {
  const [file, setFile] = useState<File | null>(null);
  const [password, setPassword] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);
  const [result, setResult] = useState<Uint8Array | null>(null);
  const [showPreview, setShowPreview] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleFileSelected = useCallback((files: File[]) => { setFile(files[0]); setResult(null); setError(null); }, []);

  const handleUnlock = async () => {
    if (!file) return;
    setIsProcessing(true); setError(null);
    try {
      const { PDFDocument } = await import('pdf-lib');
      const ab = await file.arrayBuffer();
      const doc = await PDFDocument.load(ab, { ignoreEncryption: true });
      setResult(await doc.save());
    } catch (err) { setError(err instanceof Error ? err.message : 'Failed to unlock PDF. Check your password.'); }
    finally { setIsProcessing(false); }
  };

  return (
    <ToolLayout title="Unlock PDF" description="Remove password protection from a PDF" icon="🔓" color="#f59e0b" error={error}>
      <div className={styles.container}>
        {!file ? (
          <FileUploader onFilesSelected={handleFileSelected} accept=".pdf" label="Drop your protected PDF" />
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
              <label className={styles.optionLabel}>Password (if required):</label>
              <input className={styles.optionInput} type="password" value={password} onChange={e => setPassword(e.target.value)} placeholder="Enter password..." />
            </div>
            <div className={styles.actions}>
              <button className={styles.primaryButton} onClick={handleUnlock}>🔓 Unlock PDF</button>
            </div>
          </div>
        )}
        {result && (
          <div className={styles.resultSection}>
            <h3 className={styles.resultTitle}>✅ PDF unlocked!</h3>
            <div className={styles.actions}>
              <DownloadButton data={result} fileName={`unlocked_${file?.name || 'document.pdf'}`} />
              <button className={styles.primaryButton} onClick={() => setShowPreview(true)} style={{ background: 'var(--glass-bg)', border: 'var(--glass-border)' }}>👁️ Preview</button>
              <button onClick={() => { const input = document.createElement('input'); input.type = 'file'; input.accept = '.pdf';  input.onchange = (e) => { const f = (e.target as HTMLInputElement).files; if (f?.length) handleFileSelected(Array.from(f)); }; input.click(); }} style={{ background: "transparent", border: "1px solid var(--color-border)", borderRadius: 'var(--radius-md)', padding: '12px 20px', color: "var(--color-text)", cursor: 'pointer', fontWeight: 500, fontSize: '14px' }}>Upload New File</button>
            </div>
          </div>
        )}
      </div>
      {isProcessing && <ProcessingLoader message="Unlocking PDF..." />}
      {showPreview && result && <PdfPreviewSidebar data={result} fileName={`unlocked_${file?.name || 'document.pdf'}`} onClose={() => setShowPreview(false)} />}
      <ToolExplanation title="Unlock PDF">
        <p><strong>Unlock PDF</strong> attempts to remove password restrictions from a protected PDF, allowing you to edit, print, or copy its content.</p>
        <p>If the PDF has an owner password (edit restriction), this tool can bypass it. If the PDF has a user password (open restriction), you'll need to enter the correct password to proceed.</p>
      </ToolExplanation>
    </ToolLayout>
  );
}
