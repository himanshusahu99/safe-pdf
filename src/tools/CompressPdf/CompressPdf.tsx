import { useState, useCallback } from 'react';
import ToolLayout from '../../components/ToolLayout/ToolLayout';
import FileUploader from '../../components/FileUploader/FileUploader';
import ProcessingLoader from '../../components/ProcessingLoader/ProcessingLoader';
import DownloadButton from '../../components/DownloadButton/DownloadButton';
import PdfPreviewSidebar from '../../components/PdfPreviewSidebar/PdfPreviewSidebar';
import ToolExplanation from '../../components/ToolExplanation/ToolExplanation';
import { formatFileSize } from '../../utils/fileUtils';
import styles from '../shared/ToolShared.module.css';

export default function CompressPdf() {
  const [file, setFile] = useState<File | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [result, setResult] = useState<Uint8Array | null>(null);
  const [showPreview, setShowPreview] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleFileSelected = useCallback((files: File[]) => { setFile(files[0]); setResult(null); setError(null); }, []);

  const handleCompress = async () => {
    if (!file) return;
    setIsProcessing(true); setError(null);
    try {
      const { PDFDocument } = await import('pdf-lib');
      const ab = await file.arrayBuffer();
      const doc = await PDFDocument.load(ab, { ignoreEncryption: true });
      
      // pdf-lib's save() only removes unused objects and deduplicates.
      // It CANNOT downsample images or compress object streams in the browser.
      const saved = await doc.save({ useObjectStreams: false }); 
      setResult(saved);
      
      // If the file didn't get smaller, we need to tell them why
      if (saved.byteLength >= file.size) {
        setError("Note: This PDF is already highly optimized or contains large images that cannot be further compressed purely in your web browser. A backend server is required to shrink images.");
      }
      
    } catch (err) { setError(err instanceof Error ? err.message : 'Failed to compress PDF'); }
    finally { setIsProcessing(false); }
  };

  const savings = result ? Math.max(0, file!.size - result.byteLength) : 0;

  return (
    <ToolLayout title="Compress PDF" description="Reduce PDF file size while maintaining quality" icon="📦" color="#22c55e" error={error}>
      <div className={styles.container}>
        {!file ? (
          <FileUploader onFilesSelected={handleFileSelected} accept=".pdf" label="Drop your PDF to compress" />
        ) : (
          <div className={styles.fileSection}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
              <h3 className={styles.sectionTitle}>{file.name} — {formatFileSize(file.size)}</h3>
              <button 
                onClick={() => { const input = document.createElement('input'); input.type = 'file'; input.accept = '.pdf';  input.onchange = (e) => { const f = (e.target as HTMLInputElement).files; if (f?.length) handleFileSelected(Array.from(f)); }; input.click(); }} 
                style={{ background: 'transparent', border: '1px solid var(--color-border)', borderRadius: '6px', padding: '4px 12px', fontSize: '12px', color: 'var(--color-text-muted)', cursor: 'pointer' }}
              >
                Change File
              </button>
            </div>
            <div className={styles.actions}>
              <button className={styles.primaryButton} onClick={handleCompress}>📦 Compress PDF</button>
            </div>
          </div>
        )}
        {result && (
          <div className={styles.resultSection}>
            <h3 className={styles.resultTitle}>
              {savings > 0 ? `✅ Compressed! Saved ${formatFileSize(savings)}` : `✅ Processing Complete`}
            </h3>
            <p style={{ fontSize: '13px', color: 'var(--color-text-dim)', marginBottom: '8px' }}>
              Original: {formatFileSize(file!.size)} → Output: {formatFileSize(result.byteLength)}
            </p>
            <div className={styles.actions}>
              <DownloadButton data={result} fileName={`compressed_${file?.name || 'document.pdf'}`} />
              <button className={styles.primaryButton} onClick={() => setShowPreview(true)} style={{ background: 'var(--glass-bg)', border: 'var(--glass-border)' }}>👁️ Preview</button>
              <button onClick={() => { const input = document.createElement('input'); input.type = 'file'; input.accept = '.pdf';  input.onchange = (e) => { const f = (e.target as HTMLInputElement).files; if (f?.length) handleFileSelected(Array.from(f)); }; input.click(); }} style={{ background: "transparent", border: "1px solid var(--color-border)", borderRadius: 'var(--radius-md)', padding: '12px 20px', color: "var(--color-text)", cursor: 'pointer', fontWeight: 500, fontSize: '14px' }}>Upload New File</button>
            </div>
          </div>
        )}
      </div>
      {isProcessing && <ProcessingLoader message="Compressing PDF..." />}
      {showPreview && result && <PdfPreviewSidebar data={result} fileName={`compressed_${file?.name || 'document.pdf'}`} onClose={() => setShowPreview(false)} />}
      <ToolExplanation title="Compress PDF">
        <p><strong>Compress PDF</strong> attempts to reduce the file size of your document by executing garbage collection and deduplicating objects 100% locally in your browser.</p>
        <p><strong>Important Limitation:</strong> Because this runs securely on your device without uploading to a server, it <em>cannot</em> downsample high-resolution images or rewrite complex font streams. If your PDF is mostly large photos, the file size will not decrease meaningfully.</p>
      </ToolExplanation>
    </ToolLayout>
  );
}
