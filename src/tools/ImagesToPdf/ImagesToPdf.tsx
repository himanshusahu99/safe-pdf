import { useState, useCallback } from 'react';
import ToolLayout from '../../components/ToolLayout/ToolLayout';
import FileUploader from '../../components/FileUploader/FileUploader';
import ProcessingLoader from '../../components/ProcessingLoader/ProcessingLoader';
import DownloadButton from '../../components/DownloadButton/DownloadButton';
import PdfPreviewSidebar from '../../components/PdfPreviewSidebar/PdfPreviewSidebar';
import ToolExplanation from '../../components/ToolExplanation/ToolExplanation';
import { imagesToPdf } from '../../utils/pdfUtils';
import styles from '../shared/ToolShared.module.css';

export default function ImagesToPdf() {
  const [files, setFiles] = useState<File[]>([]);
  const [isProcessing, setIsProcessing] = useState(false);
  const [result, setResult] = useState<Uint8Array | null>(null);
  const [showPreview, setShowPreview] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleFilesSelected = useCallback((newFiles: File[]) => {
    setFiles(prev => [...prev, ...newFiles]);
    setResult(null);
    setError(null);
  }, []);

  const handleConvert = async () => {
    if (files.length === 0) return;
    setIsProcessing(true); setError(null);
    try {
      const pdf = await imagesToPdf(files);
      setResult(pdf);
    } catch (err) { setError(err instanceof Error ? err.message : 'Failed to convert images to PDF'); }
    finally { setIsProcessing(false); }
  };

  return (
    <ToolLayout title="Images to PDF" description="Convert images to a single PDF document" icon="🖼️" color="#6366f1" error={error}>
      <div className={styles.container}>
        {files.length === 0 ? (
          <FileUploader onFilesSelected={handleFilesSelected} accept=".jpg,.jpeg,.png,.webp" multiple label="Drop your images here" />
        ) : (
          <div className={styles.fileSection}>
            <h3 className={styles.sectionTitle}>{files.length} image{files.length !== 1 ? 's' : ''} selected</h3>
            <div className={styles.pageGrid}>
              {files.map((f, i) => (
                <div key={i} style={{ borderRadius: '8px', overflow: 'hidden', border: '1px solid var(--color-border)', position: 'relative' }}>
                  <img src={URL.createObjectURL(f)} alt={f.name} style={{ width: '100%', display: 'block', aspectRatio: '1', objectFit: 'cover' }} />
                  <button
                    onClick={() => setFiles(prev => prev.filter((_, j) => j !== i))}
                    style={{ position: 'absolute', top: '4px', right: '4px', width: '22px', height: '22px', borderRadius: '50%', background: 'rgba(239,68,68,0.9)', color: 'white', border: 'none', fontSize: '12px', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
                  >✕</button>
                  <div style={{ padding: '4px 6px', fontSize: '10px', color: 'var(--color-text-muted)', background: 'var(--glass-bg)', textOverflow: 'ellipsis', overflow: 'hidden', whiteSpace: 'nowrap' }}>{f.name}</div>
                </div>
              ))}
            </div>
            <div className={styles.actions}>
              <button className={styles.primaryButton} onClick={handleConvert}>🖼️ Convert to PDF</button>
            </div>
          </div>
        )}
        {result && (
          <div className={styles.resultSection}>
            <h3 className={styles.resultTitle}>✅ PDF created from {files.length} images!</h3>
            <div className={styles.actions}>
              <DownloadButton data={result} fileName="images_to_pdf.pdf" />
              <button className={styles.primaryButton} onClick={() => setShowPreview(true)} style={{ background: 'var(--glass-bg)', border: 'var(--glass-border)' }}>👁️ Preview</button>
              <button onClick={() => { const input = document.createElement('input'); input.type = 'file'; input.accept = '.jpg,.jpeg,.png,.webp'; input.multiple = true; input.onchange = (e) => { const f = (e.target as HTMLInputElement).files; if (f?.length) handleFilesSelected(Array.from(f)); }; input.click(); }} style={{ background: "transparent", border: "1px solid var(--color-border)", borderRadius: 'var(--radius-md)', padding: '12px 20px', color: "var(--color-text)", cursor: 'pointer', fontWeight: 500, fontSize: '14px' }}>Upload New File</button>
            </div>
          </div>
        )}
      </div>
      {isProcessing && <ProcessingLoader message="Converting images to PDF..." />}
      {showPreview && result && <PdfPreviewSidebar data={result} fileName="images_to_pdf.pdf" onClose={() => setShowPreview(false)} />}
      <ToolExplanation title="Images to PDF">
        <p><strong>Images to PDF</strong> converts your images (JPG, PNG, WebP) into a single PDF document where each image becomes a full page.</p>
        <p>Great for combining photos of documents, creating a portfolio, or bundling screenshots. Each image retains its original dimensions and quality.</p>
      </ToolExplanation>
    </ToolLayout>
  );
}
