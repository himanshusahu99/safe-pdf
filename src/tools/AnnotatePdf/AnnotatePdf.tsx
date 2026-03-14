import { useState, useCallback } from 'react';
import ToolLayout from '../../components/ToolLayout/ToolLayout';
import FileUploader from '../../components/FileUploader/FileUploader';
import ProcessingLoader from '../../components/ProcessingLoader/ProcessingLoader';
import DownloadButton from '../../components/DownloadButton/DownloadButton';
import PdfPreviewSidebar from '../../components/PdfPreviewSidebar/PdfPreviewSidebar';
import CanvasEditor from '../../components/CanvasEditor/CanvasEditor';
import ToolExplanation from '../../components/ToolExplanation/ToolExplanation';
import { renderPageToCanvas, getPageCount } from '../../utils/renderUtils';
import styles from '../shared/ToolShared.module.css';

export default function AnnotatePdf() {
  const [file, setFile] = useState<File | null>(null);
  const [pageCount, setPageCount] = useState(0);
  const [annotatePage, setAnnotatePage] = useState(1);
  const [pageBg, setPageBg] = useState<string | null>(null);
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
      const bg = await renderPageToCanvas(f, 1, 1.0);
      setPageBg(bg);
    } catch {}
  }, []);

  const handlePageChange = async (page: number) => {
    setAnnotatePage(page);
    if (file) {
      try {
        const bg = await renderPageToCanvas(file, page, 1.0);
        setPageBg(bg);
      } catch {}
    }
  };

  const handleExport = async (dataUrl: string) => {
    if (!file) return;
    setIsProcessing(true);
    setError(null);
    try {
      const { PDFDocument } = await import('pdf-lib');
      const ab = await file.arrayBuffer();
      const doc = await PDFDocument.load(ab, { ignoreEncryption: true });

      const annotBytes = await fetch(dataUrl).then(r => r.arrayBuffer());
      const annotImage = await doc.embedPng(new Uint8Array(annotBytes));

      const page = doc.getPage(Math.min(annotatePage - 1, doc.getPageCount() - 1));
      const { width, height } = page.getSize();

      // Overlay the annotation image over the entire page
      page.drawImage(annotImage, { x: 0, y: 0, width, height });

      setResult(await doc.save());
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to annotate PDF');
    } finally { setIsProcessing(false); }
  };

  return (
    <ToolLayout title="Annotate PDF" description="Draw, write, and annotate your PDF" icon="📝" color="#f43f5e" error={error}>
      <div className={styles.container}>
        {!file ? (
          <FileUploader onFilesSelected={handleFileSelected} accept=".pdf" label="Drop your PDF to annotate" />
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
                <label className={styles.optionLabel}>Annotate page:</label>
                <select
                  className={styles.optionInput}
                  value={annotatePage}
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
              Use the toolbar to draw, write text, change colors, or adjust brush size. Your annotations overlay on the PDF page.
            </p>
            <CanvasEditor
              width={600}
              height={850}
              backgroundImage={pageBg || undefined}
              onExport={handleExport}
              showTyping={true}
            />
          </div>
        )}
        {result && (
          <div className={styles.resultSection}>
            <h3 className={styles.resultTitle}>✅ Annotation added!</h3>
            <div className={styles.actions}>
              <DownloadButton data={result} fileName={`annotated_${file?.name || 'document.pdf'}`} />
              <button className={styles.primaryButton} onClick={() => setShowPreview(true)} style={{ background: 'var(--glass-bg)', border: 'var(--glass-border)' }}>👁️ Preview</button>
              <button onClick={() => { const input = document.createElement('input'); input.type = 'file'; input.accept = '.pdf';  input.onchange = (e) => { const f = (e.target as HTMLInputElement).files; if (f?.length) handleFileSelected(Array.from(f)); }; input.click(); }} style={{ background: "transparent", border: "1px solid var(--color-border)", borderRadius: 'var(--radius-md)', padding: '12px 20px', color: "var(--color-text)", cursor: 'pointer', fontWeight: 500, fontSize: '14px' }}>Upload New File</button>
            </div>
          </div>
        )}
      </div>
      {isProcessing && <ProcessingLoader message="Adding annotation..." />}
      {showPreview && result && <PdfPreviewSidebar data={result} fileName={`annotated_${file?.name || 'document.pdf'}`} onClose={() => setShowPreview(false)} />}
      <ToolExplanation title="Annotate PDF">
        <p><strong>Annotate PDF</strong> provides a full drawing and text editor overlaid on your PDF page. You can highlight, underline, circle, or draw attention to specific areas.</p>
        <p>The toolbar includes a pen tool, eraser, color picker, brush size slider, text input, and undo/clear buttons. Annotations are permanently embedded into the PDF when you apply them.</p>
      </ToolExplanation>
    </ToolLayout>
  );
}
