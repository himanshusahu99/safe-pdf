import { useState, useCallback } from 'react';
import ToolLayout from '../../components/ToolLayout/ToolLayout';
import FileUploader from '../../components/FileUploader/FileUploader';
import ProcessingLoader from '../../components/ProcessingLoader/ProcessingLoader';
import DownloadButton from '../../components/DownloadButton/DownloadButton';
import PdfPreviewSidebar from '../../components/PdfPreviewSidebar/PdfPreviewSidebar';
import CanvasEditor from '../../components/CanvasEditor/CanvasEditor';
import ToolExplanation from '../../components/ToolExplanation/ToolExplanation';
import { getPageCount } from '../../utils/renderUtils';
import styles from '../shared/ToolShared.module.css';

export default function SignPdf() {
  const [file, setFile] = useState<File | null>(null);
  const [pageCount, setPageCount] = useState(0);
  const [signPage, setSignPage] = useState(1);

  const [isProcessing, setIsProcessing] = useState(false);
  const [result, setResult] = useState<Uint8Array | null>(null);
  const [showPreview, setShowPreview] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleFileSelected = useCallback(async (files: File[]) => {
    const f = files[0];
    setFile(f);
    setResult(null);
    setError(null);
    try {
      const count = await getPageCount(f);
      setPageCount(count);
    } catch {}
  }, []);

  const handlePageChange = async (page: number) => {
    setSignPage(page);
  };

  const handleExport = async (dataUrl: string) => {
    if (!file) return;
    setIsProcessing(true);
    setError(null);
    try {
      const { PDFDocument } = await import('pdf-lib');
      const ab = await file.arrayBuffer();
      const doc = await PDFDocument.load(ab, { ignoreEncryption: true });
      const sigBytes = await fetch(dataUrl).then(r => r.arrayBuffer());
      const sigImage = await doc.embedPng(new Uint8Array(sigBytes));
      const page = doc.getPage(Math.min(signPage - 1, doc.getPageCount() - 1));
      const { width } = page.getSize();
      const sigWidth = 180;
      const sigHeight = (sigImage.height / sigImage.width) * sigWidth;
      page.drawImage(sigImage, { x: width - sigWidth - 40, y: 40, width: sigWidth, height: sigHeight });
      setResult(await doc.save());
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to sign PDF');
    } finally { setIsProcessing(false); }
  };

  return (
    <ToolLayout title="Sign PDF" description="Add your signature to a PDF" icon="✍️" color="#6366f1" error={error}>
      <div className={styles.container}>
        {!file ? (
          <FileUploader onFilesSelected={handleFileSelected} accept=".pdf" label="Drop your PDF to sign" />
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
            {pageCount > 1 && (
              <div className={styles.optionGroup}>
                <label className={styles.optionLabel}>Sign on page:</label>
                <select
                  className={styles.optionInput}
                  value={signPage}
                  onChange={e => handlePageChange(Number(e.target.value))}
                  style={{ maxWidth: '120px' }}
                >
                  {Array.from({ length: pageCount }, (_, i) => (
                    <option key={i} value={i + 1}>Page {i + 1}</option>
                  ))}
                </select>
              </div>
            )}
            <p style={{ fontSize: '13px', color: 'var(--color-text-dim)', marginBottom: '8px' }}>
              Draw your signature or type it using a script font. The signature will be placed on the bottom-right of page {signPage}.
            </p>
            <CanvasEditor
              width={500}
              height={200}
              onExport={handleExport}
              showTyping={true}
            />
          </div>
        )}
        {result && (
          <div className={styles.resultSection}>
            <h3 className={styles.resultTitle}>✅ PDF signed!</h3>
            <div className={styles.actions}>
              <DownloadButton data={result} fileName={`signed_${file?.name || 'document.pdf'}`} />
              <button className={styles.primaryButton} onClick={() => setShowPreview(true)} style={{ background: 'var(--glass-bg)', border: 'var(--glass-border)' }}>👁️ Preview</button>
              <button onClick={() => { const input = document.createElement('input'); input.type = 'file'; input.accept = '.pdf';  input.onchange = (e) => { const f = (e.target as HTMLInputElement).files; if (f?.length) handleFileSelected(Array.from(f)); }; input.click(); }} style={{ background: "transparent", border: "1px solid var(--color-border)", borderRadius: 'var(--radius-md)', padding: '12px 20px', color: "var(--color-text)", cursor: 'pointer', fontWeight: 500, fontSize: '14px' }}>Upload New File</button>
            </div>
          </div>
        )}
      </div>
      {isProcessing && <ProcessingLoader message="Signing PDF..." />}
      {showPreview && result && <PdfPreviewSidebar data={result} fileName={`signed_${file?.name || 'document.pdf'}`} onClose={() => setShowPreview(false)} />}
      <ToolExplanation title="Sign PDF">
        <p><strong>Sign PDF</strong> lets you add a personal signature to any page of your PDF document.</p>
        <p>You can either <strong>draw</strong> your signature using a pen/mouse with customizable color and brush size, or <strong>type</strong> your name and choose from several script fonts for a professional look. The signature is embedded directly into the PDF as an image.</p>
      </ToolExplanation>
    </ToolLayout>
  );
}
