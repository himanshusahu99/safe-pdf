import { useState, useCallback } from 'react';
import ToolLayout from '../../components/ToolLayout/ToolLayout';
import FileUploader from '../../components/FileUploader/FileUploader';
import ProcessingLoader from '../../components/ProcessingLoader/ProcessingLoader';
import DownloadButton from '../../components/DownloadButton/DownloadButton';
import PdfPreviewSidebar from '../../components/PdfPreviewSidebar/PdfPreviewSidebar';
import PageSelector from '../../components/PageSelector/PageSelector';
import ToolExplanation from '../../components/ToolExplanation/ToolExplanation';
import { getPageCount } from '../../utils/renderUtils';
import styles from '../shared/ToolShared.module.css';

export default function RotatePdf() {
  const [file, setFile] = useState<File | null>(null);
  const [pageCount, setPageCount] = useState(0);
  const [selectedPages, setSelectedPages] = useState<number[]>([]);
  const [pageRotations, setPageRotations] = useState<Record<number, number>>({});
  const [isProcessing, setIsProcessing] = useState(false);
  const [result, setResult] = useState<Uint8Array | null>(null);
  const [showPreview, setShowPreview] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleFileSelected = useCallback(async (files: File[]) => {
    const f = files[0];
    setFile(f);
    setResult(null);
    setError(null);
    setPageRotations({});
    try {
      const count = await getPageCount(f);
      setPageCount(count);
      setSelectedPages(Array.from({ length: count }, (_, i) => i + 1));
    } catch { setPageCount(0); }
  }, []);

  const rotatePageCW = (pageNumber: number) => {
    setPageRotations(prev => ({ ...prev, [pageNumber]: ((prev[pageNumber] || 0) + 90) % 360 }));
  };

  const rotatePageCCW = (pageNumber: number) => {
    setPageRotations(prev => ({ ...prev, [pageNumber]: ((prev[pageNumber] || 0) - 90 + 360) % 360 }));
  };

  const rotateSelectedCW = () => {
    setPageRotations(prev => {
      const updated = { ...prev };
      selectedPages.forEach(p => { updated[p] = ((updated[p] || 0) + 90) % 360; });
      return updated;
    });
  };

  const handleRotate = async () => {
    if (!file) return;
    setIsProcessing(true);
    setError(null);
    try {
      const { PDFDocument, degrees } = await import('pdf-lib');
      const ab = await file.arrayBuffer();
      const doc = await PDFDocument.load(ab, { ignoreEncryption: true });

      for (let i = 0; i < doc.getPageCount(); i++) {
        const rotation = pageRotations[i + 1];
        if (rotation) {
          const page = doc.getPage(i);
          page.setRotation(degrees(page.getRotation().angle + rotation));
        }
      }

      setResult(await doc.save());
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to rotate PDF');
    } finally { setIsProcessing(false); }
  };

  const hasRotations = Object.values(pageRotations).some(r => r !== 0);

  return (
    <ToolLayout title="Rotate PDF" description="Rotate individual or all pages in your PDF" icon="🔄" color="#f59e0b" error={error}>
      <div className={styles.container}>
        {!file ? (
          <FileUploader onFilesSelected={handleFileSelected} accept=".pdf" label="Drop your PDF to rotate pages" />
        ) : (
          <div className={styles.fileSection}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
              <h3 className={styles.sectionTitle}>{file.name} — {pageCount} pages</h3>
              <button 
                onClick={() => { const input = document.createElement('input'); input.type = 'file'; input.accept = '.pdf';  input.onchange = (e) => { const f = (e.target as HTMLInputElement).files; if (f?.length) handleFileSelected(Array.from(f)); }; input.click(); }} 
                style={{ background: 'transparent', border: '1px solid var(--color-border)', borderRadius: '6px', padding: '4px 12px', fontSize: '12px', color: 'var(--color-text-muted)', cursor: 'pointer' }}
              >
                Change File
              </button>
            </div>
            <p style={{ fontSize: '13px', color: 'var(--color-text-dim)', marginBottom: '8px' }}>
              Hover over a page and use the ↻ ↺ buttons to rotate individual pages, or select pages and rotate them together.
            </p>
            <div className={styles.actions} style={{ marginBottom: '16px' }}>
              <button className={styles.primaryButton} onClick={rotateSelectedCW} style={{ background: 'var(--glass-bg)', border: 'var(--glass-border)', fontSize: '13px' }}>
                ↻ Rotate selected 90° CW
              </button>
            </div>
            <PageSelector
              file={file}
              pageCount={pageCount}
              selectedPages={selectedPages}
              onTogglePage={p => setSelectedPages(prev => prev.includes(p) ? prev.filter(x => x !== p) : [...prev, p])}
              onSelectAll={() => setSelectedPages(Array.from({ length: pageCount }, (_, i) => i + 1))}
              onDeselectAll={() => setSelectedPages([])}
              actions={[
                { icon: '↻', title: 'Rotate 90° CW', onClick: rotatePageCW },
                { icon: '↺', title: 'Rotate 90° CCW', onClick: rotatePageCCW },
              ]}
              pageRotations={pageRotations}
            />
            <div className={styles.actions} style={{ marginTop: '16px' }}>
              <button className={styles.primaryButton} onClick={handleRotate} disabled={!hasRotations}>🔄 Apply Rotations</button>
            </div>
          </div>
        )}
        {result && (
          <div className={styles.resultSection}>
            <h3 className={styles.resultTitle}>✅ Pages rotated!</h3>
            <div className={styles.actions}>
              <DownloadButton data={result} fileName={`rotated_${file?.name || 'document.pdf'}`} />
              <button className={styles.primaryButton} onClick={() => setShowPreview(true)} style={{ background: 'var(--glass-bg)', border: 'var(--glass-border)' }}>👁️ Preview</button>
              <button onClick={() => { const input = document.createElement('input'); input.type = 'file'; input.accept = '.pdf';  input.onchange = (e) => { const f = (e.target as HTMLInputElement).files; if (f?.length) handleFileSelected(Array.from(f)); }; input.click(); }} style={{ background: "transparent", border: "1px solid var(--color-border)", borderRadius: 'var(--radius-md)', padding: '12px 20px', color: "var(--color-text)", cursor: 'pointer', fontWeight: 500, fontSize: '14px' }}>Upload New File</button>
            </div>
          </div>
        )}
      </div>
      {isProcessing && <ProcessingLoader message="Rotating pages..." />}
      {showPreview && result && <PdfPreviewSidebar data={result} fileName={`rotated_${file?.name || 'document.pdf'}`} onClose={() => setShowPreview(false)} />}
      <ToolExplanation title="Rotate PDF">
        <p><strong>Rotate PDF</strong> lets you rotate individual pages or a selection of pages in your PDF document by 90°, 180°, or 270°.</p>
        <p>Hover over any page card to see rotation buttons (↻ ↺) for quick per-page rotation. You can also select multiple pages and rotate them all at once. Great for fixing scanned pages that are sideways or upside down.</p>
      </ToolExplanation>
    </ToolLayout>
  );
}
