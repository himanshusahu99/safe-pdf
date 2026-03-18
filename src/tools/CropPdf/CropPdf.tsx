import { useState, useCallback } from 'react';
import ToolLayout from '../../components/ToolLayout/ToolLayout';
import FileUploader from '../../components/FileUploader/FileUploader';
import ProcessingLoader from '../../components/ProcessingLoader/ProcessingLoader';
import DownloadButton from '../../components/DownloadButton/DownloadButton';
import PdfPreviewSidebar from '../../components/PdfPreviewSidebar/PdfPreviewSidebar';
import ToolExplanation from '../../components/ToolExplanation/ToolExplanation';
import PageSelector from '../../components/PageSelector/PageSelector';
import { cropPdf } from '../../utils/pdfUtils';
import { renderPageToCanvas } from '../../utils/renderUtils';
import styles from '../shared/ToolShared.module.css';
import AccordionSection from '../../components/AccordionSection/AccordionSection';

export default function CropPdf() {
  const [file, setFile] = useState<File | null>(null);
  const [pageCount, setPageCount] = useState(0);
  const [selectedPages, setSelectedPages] = useState<number[]>([]);
  const [previewBg, setPreviewBg] = useState<string | null>(null);
  const [top, setTop] = useState(0);
  const [right, setRight] = useState(0);
  const [bottom, setBottom] = useState(0);
  const [left, setLeft] = useState(0);
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
      const { PDFDocument } = await import('pdf-lib');
      const ab = await f.arrayBuffer();
      const doc = await PDFDocument.load(ab, { ignoreEncryption: true });
      const count = doc.getPageCount();
      setPageCount(count);
      setSelectedPages(Array.from({ length: count }, (_, i) => i + 1));
      const thumb = await renderPageToCanvas(f, 1, 0.6);
      setPreviewBg(thumb);
    } catch {}
  }, []);

  const handleCrop = async () => {
    if (!file) return;
    setIsProcessing(true);
    setError(null);
    try {
      const pageIndices = selectedPages.length === pageCount
        ? undefined
        : selectedPages.map(p => p - 1);
      const cropped = await cropPdf(file, { top, right, bottom, left }, pageIndices);
      setResult(cropped);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to crop PDF');
    } finally { setIsProcessing(false); }
  };

  // Visual crop preview percentages
  const maxMargin = 100;
  const topPct = Math.min((top / maxMargin) * 30, 45);
  const rightPct = Math.min((right / maxMargin) * 30, 45);
  const bottomPct = Math.min((bottom / maxMargin) * 30, 45);
  const leftPct = Math.min((left / maxMargin) * 30, 45);

  return (
    <ToolLayout title="Crop PDF" description="Crop margins from every page" icon="✂️" color="#6366f1" error={error}>
      <div className={styles.container}>
        {!file ? (
          <FileUploader onFilesSelected={handleFileSelected} accept=".pdf" label="Drop your PDF to crop" />
        ) : (
          <div className={styles.fileSection}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
              <h3 className={styles.sectionTitle}>{file.name}</h3>
              <button
                onClick={() => { const input = document.createElement('input'); input.type = 'file'; input.accept = '.pdf'; input.onchange = (e) => { const f = (e.target as HTMLInputElement).files; if (f?.length) handleFileSelected(Array.from(f)); }; input.click(); }}
                style={{ background: 'transparent', border: '1px solid var(--color-border)', borderRadius: '6px', padding: '4px 12px', fontSize: '12px', color: 'var(--color-text-muted)', cursor: 'pointer' }}
              >
                Change File
              </button>
            </div>

            {/* Visual crop preview */}
            {previewBg && (
              <div style={{ position: 'relative', width: '100%', maxWidth: '350px', margin: '0 auto 24px', borderRadius: '8px', overflow: 'hidden', border: '1px solid var(--color-border)' }}>
                <img src={previewBg} alt="Preview" style={{ width: '100%', display: 'block' }} />
                <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: `${topPct}%`, background: 'rgba(239, 68, 68, 0.25)', borderBottom: '2px dashed #ef4444', transition: 'all 0.2s' }} />
                <div style={{ position: 'absolute', bottom: 0, left: 0, right: 0, height: `${bottomPct}%`, background: 'rgba(239, 68, 68, 0.25)', borderTop: '2px dashed #ef4444', transition: 'all 0.2s' }} />
                <div style={{ position: 'absolute', top: `${topPct}%`, bottom: `${bottomPct}%`, left: 0, width: `${leftPct}%`, background: 'rgba(239, 68, 68, 0.25)', borderRight: '2px dashed #ef4444', transition: 'all 0.2s' }} />
                <div style={{ position: 'absolute', top: `${topPct}%`, bottom: `${bottomPct}%`, right: 0, width: `${rightPct}%`, background: 'rgba(239, 68, 68, 0.25)', borderLeft: '2px dashed #ef4444', transition: 'all 0.2s' }} />
              </div>
            )}

            {/* Margin sliders */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
              <div className={styles.optionGroup}>
                <label className={styles.optionLabel}>Top: {top}pts</label>
                <input type="range" min={0} max={100} value={top} onChange={e => setTop(Number(e.target.value))} style={{ width: '100%', accentColor: 'var(--color-accent)' }} />
              </div>
              <div className={styles.optionGroup}>
                <label className={styles.optionLabel}>Right: {right}pts</label>
                <input type="range" min={0} max={100} value={right} onChange={e => setRight(Number(e.target.value))} style={{ width: '100%', accentColor: 'var(--color-accent)' }} />
              </div>
              <div className={styles.optionGroup}>
                <label className={styles.optionLabel}>Bottom: {bottom}pts</label>
                <input type="range" min={0} max={100} value={bottom} onChange={e => setBottom(Number(e.target.value))} style={{ width: '100%', accentColor: 'var(--color-accent)' }} />
              </div>
              <div className={styles.optionGroup}>
                <label className={styles.optionLabel}>Left: {left}pts</label>
                <input type="range" min={0} max={100} value={left} onChange={e => setLeft(Number(e.target.value))} style={{ width: '100%', accentColor: 'var(--color-accent)' }} />
              </div>
            </div>

            {/* Page selection */}
            {pageCount > 1 && (
              <AccordionSection 
                title="Select Pages" 
                defaultOpen={false}
                summaryText={selectedPages.length === pageCount ? "All Pages" : `${selectedPages.length} selected`}
              >
                <PageSelector
                  file={file}
                  pageCount={pageCount}
                  selectedPages={selectedPages}
                  onTogglePage={p => setSelectedPages(prev => prev.includes(p) ? prev.filter(x => x !== p) : [...prev, p])}
                  onSelectAll={() => setSelectedPages(Array.from({ length: pageCount }, (_, i) => i + 1))}
                  onDeselectAll={() => setSelectedPages([])}
                />
              </AccordionSection>
            )}

            <div className={styles.actions} style={{ marginTop: '16px' }}>
              <button className={styles.primaryButton} onClick={handleCrop} disabled={selectedPages.length === 0}>✂️ Crop PDF</button>
            </div>
          </div>
        )}
        {result && (
          <div className={styles.resultSection}>
            <h3 className={styles.resultTitle}>✅ PDF cropped!</h3>
            <div className={styles.actions}>
              <DownloadButton data={result} fileName={`cropped_${file?.name || 'document.pdf'}`} />
              <button className={styles.primaryButton} onClick={() => setShowPreview(true)} style={{ background: 'var(--glass-bg)', border: 'var(--glass-border)' }}>👁️ Preview</button>
              <button onClick={() => { const input = document.createElement('input'); input.type = 'file'; input.accept = '.pdf'; input.onchange = (e) => { const f = (e.target as HTMLInputElement).files; if (f?.length) handleFileSelected(Array.from(f)); }; input.click(); }} style={{ background: 'transparent', border: '1px solid var(--color-border)', borderRadius: 'var(--radius-md)', padding: '12px 20px', color: 'var(--color-text)', cursor: 'pointer', fontWeight: 500, fontSize: '14px' }}>Upload New File</button>
            </div>
          </div>
        )}
      </div>
      {isProcessing && <ProcessingLoader message="Cropping PDF..." />}
      {showPreview && result && <PdfPreviewSidebar data={result} fileName={`cropped_${file?.name || 'document.pdf'}`} onClose={() => setShowPreview(false)} />}
      <ToolExplanation title="Crop PDF">
        <p><strong>Crop PDF</strong> trims margins from selected pages of your document. The red overlay shows areas that will be removed.</p>
        <p>Use the sliders and <strong>page selection</strong> to crop only the pages you want — useful for removing headers from just the first page, or trimming only body pages.</p>
      </ToolExplanation>
    </ToolLayout>
  );
}
