import { useState, useCallback } from 'react';
import ToolLayout from '../../components/ToolLayout/ToolLayout';
import FileUploader from '../../components/FileUploader/FileUploader';
import ProcessingLoader from '../../components/ProcessingLoader/ProcessingLoader';
import DownloadButton from '../../components/DownloadButton/DownloadButton';
import PdfPreviewSidebar from '../../components/PdfPreviewSidebar/PdfPreviewSidebar';
import ToolExplanation from '../../components/ToolExplanation/ToolExplanation';
import PageSelector from '../../components/PageSelector/PageSelector';
import { addWatermark } from '../../utils/pdfUtils';
import { renderPageToCanvas } from '../../utils/renderUtils';
import styles from '../shared/ToolShared.module.css';
import AccordionSection from '../../components/AccordionSection/AccordionSection';

export default function AddWatermark() {
  const [file, setFile] = useState<File | null>(null);
  const [pageCount, setPageCount] = useState(0);
  const [selectedPages, setSelectedPages] = useState<number[]>([]);
  const [text, setText] = useState('CONFIDENTIAL');
  const [fontSize, setFontSize] = useState(50);
  const [opacity, setOpacity] = useState(0.3);
  const [angle, setAngle] = useState(-45);
  const [color, setColor] = useState('#888888');
  const [fontWeight, setFontWeight] = useState<'normal' | 'bold'>('normal');
  const [placement, setPlacement] = useState<'center' | 'top-left' | 'top-right' | 'bottom-left' | 'bottom-right' | 'top-center' | 'bottom-center'>('center');
  const [previewBg, setPreviewBg] = useState<string | null>(null);
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

  const handleAddWatermark = async () => {
    if (!file || !text.trim()) return;
    setIsProcessing(true);
    setError(null);
    try {
      // Convert 1-based selectedPages to 0-based indices; if all selected pass undefined (all pages)
      const pageIndices = selectedPages.length === pageCount
        ? undefined
        : selectedPages.map(p => p - 1);
      const watermarked = await addWatermark(file, text, { fontSize, opacity, rotation: angle, color, fontWeight, placement, pageIndices });
      setResult(watermarked);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to add watermark');
    } finally { setIsProcessing(false); }
  };

  // Convert hex to rgba with opacity
  const hexToRgba = (hex: string, alpha: number) => {
    const r = parseInt(hex.slice(1, 3), 16);
    const g = parseInt(hex.slice(3, 5), 16);
    const b = parseInt(hex.slice(5, 7), 16);
    return `rgba(${r}, ${g}, ${b}, ${alpha})`;
  };

  return (
    <ToolLayout title="Add Watermark" description="Add text watermarks to your PDF" icon="💧" color="#06b6d4" error={error}>
      <div className={styles.container}>
        {!file ? (
          <FileUploader onFilesSelected={handleFileSelected} accept=".pdf" label="Drop your PDF to add watermark" />
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

            {/* Live preview */}
            <div style={{
              position: 'relative',
              width: '100%',
              maxWidth: '400px',
              margin: '0 auto 24px',
              borderRadius: '8px',
              overflow: 'hidden',
              border: '1px solid var(--color-border)',
              background: '#f5f5f5',
            }}>
              {previewBg && <img src={previewBg} alt="Preview" style={{ width: '100%', display: 'block' }} />}
              <div style={{
                position: 'absolute',
                inset: 0,
                padding: '20px',
                display: 'flex',
                alignItems: placement.includes('top') ? 'flex-start' : placement.includes('bottom') ? 'flex-end' : 'center',
                justifyContent: placement.includes('left') ? 'flex-start' : placement.includes('right') ? 'flex-end' : 'center',
                pointerEvents: 'none',
              }}>
                <span style={{
                  fontSize: `${fontSize * 0.6}px`,
                  fontWeight: fontWeight === 'bold' ? 700 : 400,
                  color: hexToRgba(color, opacity),
                  transform: `rotate(${angle}deg)`,
                  transformOrigin: 'center',
                  whiteSpace: 'nowrap',
                  userSelect: 'none',
                  letterSpacing: '2px',
                }}>
                  {text}
                </span>
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

            {/* Controls */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', marginBottom: '12px' }}>
              <div className={styles.optionGroup} style={{ margin: 0 }}>
                <label className={styles.optionLabel}>Watermark text:</label>
                <input className={styles.optionInput} value={text} onChange={e => setText(e.target.value)} />
              </div>
              <div className={styles.optionGroup} style={{ margin: 0 }}>
                <label className={styles.optionLabel}>Placement:</label>
                <select value={placement} onChange={e => setPlacement(e.target.value as any)} className={styles.optionInput}>
                  <option value="center">Center</option>
                  <option value="top-left">Top Left</option>
                  <option value="top-center">Top Center</option>
                  <option value="top-right">Top Right</option>
                  <option value="bottom-left">Bottom Left</option>
                  <option value="bottom-center">Bottom Center</option>
                  <option value="bottom-right">Bottom Right</option>
                </select>
              </div>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
              <div className={styles.optionGroup}>
                <label className={styles.optionLabel}>Font size: {fontSize}px</label>
                <input type="range" min={10} max={120} value={fontSize} onChange={e => setFontSize(Number(e.target.value))} style={{ width: '100%', accentColor: 'var(--color-accent)' }} />
              </div>
              <div className={styles.optionGroup}>
                <label className={styles.optionLabel}>Opacity: {Math.round(opacity * 100)}%</label>
                <input type="range" min={5} max={100} value={opacity * 100} onChange={e => setOpacity(Number(e.target.value) / 100)} style={{ width: '100%', accentColor: 'var(--color-accent)' }} />
              </div>
              <div className={styles.optionGroup}>
                <label className={styles.optionLabel}>Angle: {angle}°</label>
                <input type="range" min={-180} max={180} value={angle} onChange={e => setAngle(Number(e.target.value))} style={{ width: '100%', accentColor: 'var(--color-accent)' }} />
                <div style={{ display: 'flex', gap: '8px', marginTop: '8px' }}>
                  <button onClick={() => setAngle(0)} style={{ flex: 1, padding: '4px', fontSize: '12px', background: 'transparent', border: '1px solid var(--color-border)', borderRadius: '4px', cursor: 'pointer', color: angle === 0 ? 'var(--color-primary)' : 'var(--color-text)' }}>Horizontal</button>
                  <button onClick={() => setAngle(-45)} style={{ flex: 1, padding: '4px', fontSize: '12px', background: 'transparent', border: '1px solid var(--color-border)', borderRadius: '4px', cursor: 'pointer', color: angle === -45 ? 'var(--color-primary)' : 'var(--color-text)' }}>Diagonal</button>
                </div>
              </div>
              <div className={styles.optionGroup}>
                <label className={styles.optionLabel}>Color:</label>
                <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                  <input type="color" value={color} onChange={e => setColor(e.target.value)} style={{ width: '40px', height: '32px', border: 'none', borderRadius: '4px', cursor: 'pointer' }} />
                  <select
                    value={fontWeight}
                    onChange={e => setFontWeight(e.target.value as 'normal' | 'bold')}
                    style={{ background: 'var(--color-bg-input)', border: 'var(--glass-border)', borderRadius: '6px', padding: '6px 10px', color: 'var(--color-text)', fontSize: '13px' }}
                  >
                    <option value="normal">Normal</option>
                    <option value="bold">Bold</option>
                  </select>
                </div>
              </div>
            </div>

            <div className={styles.actions}>
              <button className={styles.primaryButton} onClick={handleAddWatermark} disabled={!text.trim()}>💧 Add Watermark</button>
            </div>
          </div>
        )}
        {result && (
          <div className={styles.resultSection}>
            <h3 className={styles.resultTitle}>✅ Watermark added!</h3>
            <div className={styles.actions}>
              <DownloadButton data={result} fileName={`watermarked_${file?.name || 'document.pdf'}`} />
              <button className={styles.primaryButton} onClick={() => setShowPreview(true)} style={{ background: 'var(--glass-bg)', border: 'var(--glass-border)' }}>👁️ Preview</button>
              <button onClick={() => { const input = document.createElement('input'); input.type = 'file'; input.accept = '.pdf';  input.onchange = (e) => { const f = (e.target as HTMLInputElement).files; if (f?.length) handleFileSelected(Array.from(f)); }; input.click(); }} style={{ background: "transparent", border: "1px solid var(--color-border)", borderRadius: 'var(--radius-md)', padding: '12px 20px', color: "var(--color-text)", cursor: 'pointer', fontWeight: 500, fontSize: '14px' }}>Upload New File</button>
            </div>
          </div>
        )}
      </div>
      {isProcessing && <ProcessingLoader message="Adding watermark..." />}
      {showPreview && result && <PdfPreviewSidebar data={result} fileName={`watermarked_${file?.name || 'document.pdf'}`} onClose={() => setShowPreview(false)} />}
      <ToolExplanation title="Add Watermark">
        <p><strong>Add Watermark</strong> overlays text across every page of your PDF. Use it to mark documents as confidential, draft, or with your company name.</p>
        <p>You can customize the watermark text, font size, opacity, rotation angle, color, and weight. The live preview shows exactly how your watermark will look on the first page before applying.</p>
      </ToolExplanation>
    </ToolLayout>
  );
}
