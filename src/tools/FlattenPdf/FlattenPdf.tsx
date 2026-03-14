import { useState, useCallback } from 'react';
import ToolLayout from '../../components/ToolLayout/ToolLayout';
import FileUploader from '../../components/FileUploader/FileUploader';
import ProcessingLoader from '../../components/ProcessingLoader/ProcessingLoader';
import DownloadButton from '../../components/DownloadButton/DownloadButton';
import PdfPreviewSidebar from '../../components/PdfPreviewSidebar/PdfPreviewSidebar';
import ToolExplanation from '../../components/ToolExplanation/ToolExplanation';
import { flattenPdf } from '../../utils/pdfUtils';
import styles from '../shared/ToolShared.module.css';

export default function FlattenPdf() {
  const [file, setFile] = useState<File | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [result, setResult] = useState<Uint8Array | null>(null);
  const [showPreview, setShowPreview] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleFileSelected = useCallback((files: File[]) => { setFile(files[0]); setResult(null); setError(null); }, []);

  const handleFlatten = async () => {
    if (!file) return;
    setIsProcessing(true); setError(null);
    try {
      const flattened = await flattenPdf(file);
      setResult(flattened);
    } catch (err) { setError(err instanceof Error ? err.message : 'Failed to flatten PDF'); }
    finally { setIsProcessing(false); }
  };

  return (
    <ToolLayout title="Flatten PDF" description="Flatten form fields and annotations" icon="📋" color="#0ea5e9" error={error}>
      <div className={styles.container}>
        {!file ? (
          <FileUploader onFilesSelected={handleFileSelected} accept=".pdf" label="Drop your PDF to flatten" />
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
            <div className={styles.actions}>
              <button className={styles.primaryButton} onClick={handleFlatten}>📋 Flatten PDF</button>
            </div>
          </div>
        )}
        {result && (
          <div className={styles.resultSection}>
            <h3 className={styles.resultTitle}>✅ PDF flattened!</h3>
            <div className={styles.actions}>
              <DownloadButton data={result} fileName={`flattened_${file?.name || 'document.pdf'}`} />
              <button className={styles.primaryButton} onClick={() => setShowPreview(true)} style={{ background: 'var(--glass-bg)', border: 'var(--glass-border)' }}>👁️ Preview</button>
              <button onClick={() => { const input = document.createElement('input'); input.type = 'file'; input.accept = '.pdf';  input.onchange = (e) => { const f = (e.target as HTMLInputElement).files; if (f?.length) handleFileSelected(Array.from(f)); }; input.click(); }} style={{ background: "transparent", border: "1px solid var(--color-border)", borderRadius: 'var(--radius-md)', padding: '12px 20px', color: "var(--color-text)", cursor: 'pointer', fontWeight: 500, fontSize: '14px' }}>Upload New File</button>
            </div>
          </div>
        )}
      </div>
      {isProcessing && <ProcessingLoader message="Flattening PDF..." />}
      {showPreview && result && <PdfPreviewSidebar data={result} fileName={`flattened_${file?.name || 'document.pdf'}`} onClose={() => setShowPreview(false)} />}
      <ToolExplanation title="Flatten PDF">
        <p><strong>Flatten PDF</strong> converts interactive form fields and annotations into static content that becomes part of the page.</p>
        <p>After flattening, text fields, checkboxes, dropdowns, and other form elements are "baked in" and can no longer be edited. This is useful when finalizing a form for submission, ensuring the content cannot be modified by the recipient.</p>
      </ToolExplanation>
    </ToolLayout>
  );
}
