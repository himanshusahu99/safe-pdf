import { useState, useCallback } from 'react';
import ToolLayout from '../../components/ToolLayout/ToolLayout';
import FileUploader from '../../components/FileUploader/FileUploader';
import ProcessingLoader from '../../components/ProcessingLoader/ProcessingLoader';
import DownloadButton from '../../components/DownloadButton/DownloadButton';
import PdfPreviewSidebar from '../../components/PdfPreviewSidebar/PdfPreviewSidebar';
import ToolExplanation from '../../components/ToolExplanation/ToolExplanation';
import { cropPdf } from '../../utils/pdfUtils';
import { renderPageToCanvas } from '../../utils/renderUtils';
import styles from '../shared/ToolShared.module.css';

export default function CropPdf() {
  const [file, setFile] = useState<File | null>(null);
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
      const thumb = await renderPageToCanvas(f, 1, 0.6);
      setPreviewBg(thumb);
    } catch {}
  }, []);

  const handleCrop = async () => {
    if (!file) return;
    setIsProcessing(true);
    setError(null);
    try {
      const cropped = await cropPdf(file, { top, right, bottom, left });
      setResult(cropped);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to crop PDF');
    } finally { setIsProcessing(false); }
  };

  // Calculate overlay percentages for preview
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
                onClick={() => { const input = document.createElement('input'); input.type = 'file'; input.accept = '.pdf';  input.onchange = (e) => { const f = (e.target as HTMLInputElement).files; if (f?.length) handleFileSelected(Array.from(f)); }; input.click(); }} 
                style={{ background: 'transparent', border: '1px solid var(--color-border)', borderRadius: '6px', padding: '4px 12px', fontSize: '12px', color: 'var(--color-text-muted)', cursor: 'pointer' }}
              >
                Change File
              </button>
            </div>

            {/* Visual crop preview */}
            {previewBg && (
              <div style={{
                position: 'relative',
                width: '100%',
                maxWidth: '350px',
                margin: '0 auto 24px',
                borderRadius: '8px',
                overflow: 'hidden',
                border: '1px solid var(--color-border)',
              }}>
                <img src={previewBg} alt="Preview" style={{ width: '100%', display: 'block' }} />
                {/* Grayed out overlays for cropped areas */}
                {/* Top */}
                <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: `${topPct}%`, background: 'rgba(239, 68, 68, 0.25)', borderBottom: '2px dashed #ef4444', transition: 'all 0.2s' }} />
                {/* Bottom */}
                <div style={{ position: 'absolute', bottom: 0, left: 0, right: 0, height: `${bottomPct}%`, background: 'rgba(239, 68, 68, 0.25)', borderTop: '2px dashed #ef4444', transition: 'all 0.2s' }} />
                {/* Left */}
                <div style={{ position: 'absolute', top: `${topPct}%`, bottom: `${bottomPct}%`, left: 0, width: `${leftPct}%`, background: 'rgba(239, 68, 68, 0.25)', borderRight: '2px dashed #ef4444', transition: 'all 0.2s' }} />
                {/* Right */}
                <div style={{ position: 'absolute', top: `${topPct}%`, bottom: `${bottomPct}%`, right: 0, width: `${rightPct}%`, background: 'rgba(239, 68, 68, 0.25)', borderLeft: '2px dashed #ef4444', transition: 'all 0.2s' }} />
              </div>
            )}

            {/* Margin controls */}
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
            <div className={styles.actions}>
              <button className={styles.primaryButton} onClick={handleCrop}>✂️ Crop PDF</button>
            </div>
          </div>
        )}
        {result && (
          <div className={styles.resultSection}>
            <h3 className={styles.resultTitle}>✅ PDF cropped!</h3>
            <div className={styles.actions}>
              <DownloadButton data={result} fileName={`cropped_${file?.name || 'document.pdf'}`} />
              <button className={styles.primaryButton} onClick={() => setShowPreview(true)} style={{ background: 'var(--glass-bg)', border: 'var(--glass-border)' }}>👁️ Preview</button>
              <button onClick={() => { const input = document.createElement('input'); input.type = 'file'; input.accept = '.pdf';  input.onchange = (e) => { const f = (e.target as HTMLInputElement).files; if (f?.length) handleFileSelected(Array.from(f)); }; input.click(); }} style={{ background: "transparent", border: "1px solid var(--color-border)", borderRadius: 'var(--radius-md)', padding: '12px 20px', color: "var(--color-text)", cursor: 'pointer', fontWeight: 500, fontSize: '14px' }}>Upload New File</button>
            </div>
          </div>
        )}
      </div>
      {isProcessing && <ProcessingLoader message="Cropping PDF..." />}
      {showPreview && result && <PdfPreviewSidebar data={result} fileName={`cropped_${file?.name || 'document.pdf'}`} onClose={() => setShowPreview(false)} />}
      <ToolExplanation title="Crop PDF">
        <p><strong>Crop PDF</strong> trims margins from every page of your document. The red overlay in the preview shows the areas that will be removed.</p>
        <p>Use the sliders to adjust how much to crop from each side. This is useful for removing whitespace, eliminating headers/footers, or fitting content to a different page size.</p>
      </ToolExplanation>
    </ToolLayout>
  );
}
