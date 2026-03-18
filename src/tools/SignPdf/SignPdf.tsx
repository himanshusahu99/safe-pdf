import { useState, useCallback, useRef, useEffect } from 'react';
import ToolLayout from '../../components/ToolLayout/ToolLayout';
import FileUploader from '../../components/FileUploader/FileUploader';
import ProcessingLoader from '../../components/ProcessingLoader/ProcessingLoader';
import DownloadButton from '../../components/DownloadButton/DownloadButton';
import PdfPreviewSidebar from '../../components/PdfPreviewSidebar/PdfPreviewSidebar';
import CanvasEditor from '../../components/CanvasEditor/CanvasEditor';
import ToolExplanation from '../../components/ToolExplanation/ToolExplanation';
import { getPageCount, renderPageToCanvas } from '../../utils/renderUtils';
import styles from '../shared/ToolShared.module.css';

const MAX_PREVIEW = 8;

/** Resolve apply scope to a list of 1-based page numbers */
function resolvePages(
  scope: 'current' | 'all' | 'custom',
  currentPage: number,
  pageCount: number,
  customRange: string
): number[] {
  if (scope === 'current') return [currentPage];
  if (scope === 'all') return Array.from({ length: pageCount }, (_, i) => i + 1);
  // custom
  const result: number[] = [];
  for (const part of customRange.split(',')) {
    const t = part.trim();
    if (!t) continue;
    if (t.includes('-')) {
      const [a, b] = t.split('-').map(Number);
      if (!isNaN(a) && !isNaN(b)) {
        for (let i = Math.max(1, a); i <= Math.min(pageCount, b); i++) {
          if (!result.includes(i)) result.push(i);
        }
      }
    } else {
      const p = Number(t);
      if (!isNaN(p) && p >= 1 && p <= pageCount && !result.includes(p)) result.push(p);
    }
  }
  return result.sort((a, b) => a - b);
}

/** Compact thumbnail strip for the resolved page scope */
function ScopePagePreview({
  file, pages,
}: { file: File; pages: number[] }) {
  const [thumbs, setThumbs] = useState<Record<number, string>>({});
  const visible = pages.slice(0, MAX_PREVIEW);
  const overflow = pages.length - visible.length;

  useEffect(() => {
    let cancelled = false;
    setThumbs({});
    (async () => {
      for (const p of visible) {
        if (cancelled) return;
        try {
          const url = await renderPageToCanvas(file, p, 0.25);
          if (!cancelled) setThumbs(prev => ({ ...prev, [p]: url }));
        } catch {}
      }
    })();
    return () => { cancelled = true; };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [file, pages.join(',')]);

  if (pages.length === 0) return (
    <p style={{ fontSize: 12, color: 'var(--color-danger)', margin: '6px 0 0' }}>No valid pages in range.</p>
  );

  return (
    <div style={{ marginTop: 10 }}>
      <p style={{ fontSize: 12, color: 'var(--color-text-dim)', marginBottom: 6 }}>
        Signature will be applied to <strong>{pages.length}</strong> page{pages.length !== 1 ? 's' : ''}:
      </p>
      <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', alignItems: 'flex-end' }}>
        {visible.map(p => (
          <div key={p} style={{ textAlign: 'center' }}>
            {thumbs[p] ? (
              <img
                src={thumbs[p]}
                alt={`Page ${p}`}
                style={{ width: 52, height: 74, objectFit: 'cover', borderRadius: 4, border: '2px solid var(--color-accent)', display: 'block' }}
              />
            ) : (
              <div style={{ width: 52, height: 74, borderRadius: 4, background: '#e5e7eb', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 10, color: '#9ca3af' }}>…</div>
            )}
            <span style={{ fontSize: 10, color: 'var(--color-text-muted)', display: 'block', marginTop: 2 }}>{p}</span>
          </div>
        ))}
        {overflow > 0 && (
          <div style={{ width: 52, height: 74, borderRadius: 4, background: 'var(--glass-bg)', border: 'var(--glass-border)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 13, fontWeight: 600, color: 'var(--color-text-muted)' }}>
            +{overflow}
          </div>
        )}
      </div>
    </div>
  );
}

export default function SignPdf() {
  const [file, setFile] = useState<File | null>(null);
  const [pageCount, setPageCount] = useState(0);
  const [signPage, setSignPage] = useState(1);
  const [signatureDataUrl, setSignatureDataUrl] = useState<string | null>(null);
  const [pagePreview, setPagePreview] = useState<string | null>(null);
  const [sigPosition, setSigPosition] = useState({ x: 50, y: 50 });
  const [isDragging, setIsDragging] = useState(false);
  const dragRef = useRef({ startX: 0, startY: 0, initialPosX: 0, initialPosY: 0 });

  const [applyScope, setApplyScope] = useState<'current' | 'all' | 'custom'>('current');
  const [customRange, setCustomRange] = useState('');

  const [isProcessing, setIsProcessing] = useState(false);
  const [result, setResult] = useState<Uint8Array | null>(null);
  const [showPreview, setShowPreview] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleFileSelected = useCallback(async (files: File[]) => {
    const f = files[0];
    setFile(f);
    setResult(null);
    setError(null);
    setSignatureDataUrl(null);
    setPagePreview(null);
    try {
      const count = await getPageCount(f);
      setPageCount(count);
    } catch {}
  }, []);

  const handlePageChange = async (page: number) => {
    setSignPage(page);
    if (file && signatureDataUrl) {
      import('../../utils/renderUtils').then(({ renderPageToCanvas }) => {
        renderPageToCanvas(file!, page, 1.0).then(setPagePreview);
      });
    }
  };

  const handleExportSignature = (dataUrl: string) => {
    setSignatureDataUrl(dataUrl);
    import('../../utils/renderUtils').then(({ renderPageToCanvas }) => {
      renderPageToCanvas(file!, signPage, 1.0).then(setPagePreview);
    });
  };

  const handleApplySignature = async () => {
    if (!file || !signatureDataUrl) return;
    setIsProcessing(true);
    setError(null);
    try {
      const { PDFDocument } = await import('pdf-lib');
      const ab = await file.arrayBuffer();
      const doc = await PDFDocument.load(ab, { ignoreEncryption: true });
      const sigBytes = await fetch(signatureDataUrl).then(r => r.arrayBuffer());
      const sigImage = await doc.embedPng(new Uint8Array(sigBytes));
      
      const container = document.getElementById('pdf-preview-container');
      if (!container) throw new Error('Preview container not found');

      const totalDocPages = doc.getPageCount();
      let pagesToSign: number[] = [];

      if (applyScope === 'current') {
        pagesToSign = [signPage];
      } else if (applyScope === 'all') {
        pagesToSign = Array.from({ length: totalDocPages }, (_, i) => i + 1);
      } else if (applyScope === 'custom') {
        const parts = customRange.split(',');
        for (const part of parts) {
          const trimmed = part.trim();
          if (!trimmed) continue;
          if (trimmed.includes('-')) {
            const [startStr, endStr] = trimmed.split('-');
            const start = parseInt(startStr, 10);
            const end = parseInt(endStr, 10);
            if (!isNaN(start) && !isNaN(end)) {
              for (let i = Math.max(1, start); i <= Math.min(totalDocPages, end); i++) {
                if (!pagesToSign.includes(i)) pagesToSign.push(i);
              }
            }
          } else {
            const p = parseInt(trimmed, 10);
            if (!isNaN(p) && p >= 1 && p <= totalDocPages) {
              if (!pagesToSign.includes(p)) pagesToSign.push(p);
            }
          }
        }
        pagesToSign.sort((a, b) => a - b);
        if (pagesToSign.length === 0) throw new Error('Invalid custom page range.');
      }
      // Calculate position as percentages from the preview container
      const previewSigWidth = 150; 
      const clampedX = Math.max(0, Math.min(sigPosition.x, container.offsetWidth - previewSigWidth));
      const clampedY = Math.max(0, Math.min(sigPosition.y, container.offsetHeight - (previewSigWidth * (sigImage.height / sigImage.width))));
      
      const xPercent = clampedX / container.offsetWidth;
      const yPercent = clampedY / container.offsetHeight;
      const widthPercent = previewSigWidth / container.offsetWidth;

      for (const pNum of pagesToSign) {
        const pageIndex = Math.min(pNum - 1, totalDocPages - 1);
        const page = doc.getPage(pageIndex);
        const { width, height } = page.getSize();
        
        const targetWidth = widthPercent * width;
        const targetHeight = targetWidth * (sigImage.height / sigImage.width);

        const targetX = xPercent * width;
        const targetY = height - (yPercent * height) - targetHeight;

        page.drawImage(sigImage, { x: targetX, y: targetY, width: targetWidth, height: targetHeight });
      }
      
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
            
            {result ? (
              <div className={styles.resultSection}>
                <h3 className={styles.resultTitle}>✅ PDF signed!</h3>
                <div className={styles.actions}>
                  <DownloadButton data={result} fileName={`signed_${file?.name || 'document.pdf'}`} />
                  <button className={styles.primaryButton} onClick={() => setShowPreview(true)} style={{ background: 'var(--glass-bg)', border: 'var(--glass-border)' }}>👁️ Preview</button>
                  <button onClick={() => { const input = document.createElement('input'); input.type = 'file'; input.accept = '.pdf';  input.onchange = (e) => { const f = (e.target as HTMLInputElement).files; if (f?.length) handleFileSelected(Array.from(f)); }; input.click(); }} style={{ background: "transparent", border: "1px solid var(--color-border)", borderRadius: 'var(--radius-md)', padding: '12px 20px', color: "var(--color-text)", cursor: 'pointer', fontWeight: 500, fontSize: '14px' }}>Upload New File</button>
                </div>
              </div>
            ) : (
              <>
                {!signatureDataUrl ? (
                  <>
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
                      Draw, type, or upload your signature image.
                    </p>
                    <CanvasEditor
                      width={500}
                      height={200}
                      onExport={handleExportSignature}
                      showTyping={true}
                    />
                  </>
                ) : (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '16px', alignItems: 'center', width: '100%', marginTop: '16px' }}>
                    
                    {/* Options Toolbar first */}
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 12, alignItems: 'center', background: 'var(--glass-bg)', padding: '14px 24px', borderRadius: '12px', border: '1px solid var(--color-border)', width: '100%', maxWidth: '480px' }}>
                      <div style={{ display: 'flex', gap: '12px', alignItems: 'center', flexWrap: 'wrap', justifyContent: 'center' }}>
                        <label style={{ fontSize: '14px', fontWeight: 500, color: 'var(--color-text)' }}>Apply to:</label>
                        <select 
                          className={styles.optionInput} 
                          value={applyScope} 
                          onChange={(e) => setApplyScope(e.target.value as any)}
                          style={{ maxWidth: '160px', margin: 0 }}
                        >
                          <option value="current">Current Page ({signPage})</option>
                          {pageCount > 1 && <option value="all">All Pages</option>}
                          {pageCount > 1 && <option value="custom">Custom Range</option>}
                        </select>
                        {applyScope === 'custom' && (
                          <input 
                            className={styles.optionInput} 
                            type="text" 
                            placeholder="e.g. 1-3, 5" 
                            value={customRange}
                            onChange={(e) => setCustomRange(e.target.value)}
                            style={{ maxWidth: '120px', margin: 0 }}
                          />
                        )}
                      </div>
                      <ScopePagePreview
                        file={file}
                        pages={resolvePages(applyScope, signPage, pageCount, customRange)}
                      />
                    </div>

                    <p style={{ margin: '8px 0 0', fontWeight: 500, color: 'var(--color-text)' }}>Step 2: Drag signature to position</p>
                    
                    {pagePreview ? (
                      <div 
                        id="pdf-preview-container"
                        style={{ position: 'relative', display: 'inline-block', boxShadow: '0 4px 6px -1px rgba(0,0,0,0.1)', border: '1px solid var(--color-border)', backgroundColor: 'white', maxWidth: '100%', overflow: 'hidden' }}
                      >
                        <img src={pagePreview} alt="PDF Page Preview" style={{ display: 'block', maxWidth: '100%', height: 'auto', userSelect: 'none', pointerEvents: 'none' }} draggable={false} />
                        <div
                          style={{
                            position: 'absolute',
                            left: sigPosition.x,
                            top: sigPosition.y,
                            width: '150px',
                            cursor: isDragging ? 'grabbing' : 'grab',
                            border: '1px dashed #6366f1',
                            backgroundColor: 'rgba(99, 102, 241, 0.15)',
                            padding: '4px',
                            touchAction: 'none',
                            userSelect: 'none'
                          }}
                          onPointerDown={(e) => {
                            setIsDragging(true);
                            dragRef.current = { startX: e.clientX, startY: e.clientY, initialPosX: sigPosition.x, initialPosY: sigPosition.y };
                            e.currentTarget.setPointerCapture(e.pointerId);
                          }}
                          onPointerMove={(e) => {
                            if (!isDragging) return;
                            setSigPosition({
                              x: dragRef.current.initialPosX + (e.clientX - dragRef.current.startX),
                              y: dragRef.current.initialPosY + (e.clientY - dragRef.current.startY),
                            });
                          }}
                          onPointerUp={(e) => {
                            setIsDragging(false);
                            e.currentTarget.releasePointerCapture(e.pointerId);
                          }}
                        >
                          <img src={signatureDataUrl} alt="Signature" style={{ width: '100%', display: 'block', pointerEvents: 'none' }} draggable={false} />
                        </div>
                      </div>
                    ) : (
                      <ProcessingLoader message="Loading page preview..." />
                    )}
                    
                    <div style={{ display: 'flex', gap: '12px', marginTop: '16px' }}>
                      <button onClick={() => { setSignatureDataUrl(null); setResult(null); }} style={{ padding: '8px 16px', background: 'transparent', border: '1px solid var(--color-border)', borderRadius: 'var(--radius-md)', cursor: 'pointer', color: 'var(--color-text)' }}>Back</button>
                      <button className={styles.primaryButton} onClick={handleApplySignature} disabled={!pagePreview}>✅ Apply Signature</button>
                    </div>
                  </div>
                )}
              </>
            )}
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

