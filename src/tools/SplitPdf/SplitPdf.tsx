import { useState, useCallback } from 'react';
import ToolLayout from '../../components/ToolLayout/ToolLayout';
import FileUploader from '../../components/FileUploader/FileUploader';
import ProcessingLoader from '../../components/ProcessingLoader/ProcessingLoader';
import DownloadButton from '../../components/DownloadButton/DownloadButton';
import PdfPreviewSidebar from '../../components/PdfPreviewSidebar/PdfPreviewSidebar';
import ToolExplanation from '../../components/ToolExplanation/ToolExplanation';
import { splitPdf } from '../../utils/pdfUtils';
import { renderPageToCanvas, getPageCount } from '../../utils/renderUtils';
import styles from '../shared/ToolShared.module.css';

interface SplitPoint {
  afterPage: number;
}

export default function SplitPdf() {
  const [file, setFile] = useState<File | null>(null);
  const [pageCount, setPageCount] = useState(0);
  const [thumbnails, setThumbnails] = useState<string[]>([]);
  const [splitPoints, setSplitPoints] = useState<SplitPoint[]>([]);
  const [isProcessing, setIsProcessing] = useState(false);
  const [results, setResults] = useState<Uint8Array[]>([]);
  const [previewIdx, setPreviewIdx] = useState<number | null>(null);
  const [error, setError] = useState<string | null>(null);

  const handleFileSelected = useCallback(async (files: File[]) => {
    const f = files[0];
    setFile(f);
    setResults([]);
    setSplitPoints([]);
    setThumbnails([]);
    setError(null);
    try {
      const count = await getPageCount(f);
      setPageCount(count);
      const thumbs: string[] = [];
      for (let i = 1; i <= count; i++) {
        thumbs.push(await renderPageToCanvas(f, i, 0.3));
      }
      setThumbnails(thumbs);
    } catch { setPageCount(0); }
  }, []);

  const toggleSplitPoint = (afterPage: number) => {
    setSplitPoints(prev => {
      const exists = prev.find(sp => sp.afterPage === afterPage);
      if (exists) return prev.filter(sp => sp.afterPage !== afterPage);
      return [...prev, { afterPage }].sort((a, b) => a.afterPage - b.afterPage);
    });
  };

  const getSegments = () => {
    const sorted = [...splitPoints].sort((a, b) => a.afterPage - b.afterPage);
    const segments: { start: number; end: number; label: string }[] = [];
    let start = 1;
    sorted.forEach((sp, i) => {
      segments.push({ start, end: sp.afterPage, label: `Part ${i + 1}` });
      start = sp.afterPage + 1;
    });
    segments.push({ start, end: pageCount, label: `Part ${sorted.length + 1}` });
    return segments;
  };

  const handleSplit = async () => {
    if (!file || splitPoints.length === 0) return;
    setIsProcessing(true);
    setError(null);
    try {
      const segments = getSegments();
      const ranges = segments.map(s => ({ start: s.start - 1, end: s.end - 1 }));
      const parts = await splitPdf(file, ranges);
      setResults(parts);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to split PDF');
    } finally { setIsProcessing(false); }
  };

  const segments = splitPoints.length > 0 ? getSegments() : [];

  return (
    <ToolLayout title="Split PDF" description="Split a PDF into multiple documents" icon="✂️" color="#8b5cf6" error={error}>
      <div className={styles.container}>
        {!file ? (
          <FileUploader onFilesSelected={handleFileSelected} accept=".pdf" label="Drop your PDF file here to split" />
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
            <p style={{ fontSize: '13px', color: 'var(--color-text-dim)', marginBottom: '12px' }}>
              Click between pages to add or remove split points. Each split point creates a new document segment.
            </p>

            {/* Visual page strip with split point gaps */}
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '12px 4px', alignItems: 'stretch' }}>
              {thumbnails.map((thumb, i) => {
                const pageNum = i + 1;
                const hasSplitAfter = splitPoints.some(sp => sp.afterPage === pageNum);
                const segment = segments.find(s => pageNum >= s.start && pageNum <= s.end);

                return (
                  <div key={i} style={{ display: 'flex', alignItems: 'stretch' }}>
                    <div style={{ textAlign: 'center', position: 'relative', paddingTop: '24px' }}>
                      {segment && pageNum === segment.start && (
                        <div style={{ position: 'absolute', top: '0', left: '0', fontSize: '12px', fontWeight: 600, color: 'var(--color-accent)', whiteSpace: 'nowrap' }}>
                          {segment.label} (p{segment.start}–{segment.end})
                        </div>
                      )}
                      <img
                        src={thumb}
                        alt={`Page ${pageNum}`}
                        style={{
                          width: '80px',
                          borderRadius: '4px',
                          border: '1px solid var(--color-border)',
                          display: 'block',
                        }}
                      />
                      <span style={{ fontSize: '11px', color: 'var(--color-text-dim)', display: 'block', marginTop: '4px' }}>{pageNum}</span>
                    </div>
                    {pageNum < pageCount && (
                      <button
                        onClick={() => toggleSplitPoint(pageNum)}
                        style={{
                          width: '28px',
                          marginTop: '24px',
                          marginBottom: '20px',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          background: hasSplitAfter ? 'rgba(239, 68, 68, 0.15)' : 'transparent',
                          border: 'none',
                          borderLeft: hasSplitAfter ? '2px dashed #ef4444' : '2px dashed transparent',
                          borderRight: hasSplitAfter ? '2px dashed #ef4444' : '2px dashed transparent',
                          cursor: 'pointer',
                          color: hasSplitAfter ? '#ef4444' : 'var(--color-text-dim)',
                          fontSize: '14px',
                          transition: 'all 0.2s ease',
                          alignSelf: 'stretch',
                        }}
                        title={hasSplitAfter ? 'Remove split point' : 'Add split point here'}
                      >
                        ✂️
                      </button>
                    )}
                  </div>
                );
              })}
            </div>

            {splitPoints.length > 0 && (
              <p style={{ fontSize: '13px', color: 'var(--color-text-muted)', marginTop: '12px' }}>
                Split into <strong style={{ color: 'var(--color-text)' }}>{segments.length}</strong> parts: {segments.map(s => `${s.label} (pages ${s.start}–${s.end})`).join(', ')}
              </p>
            )}

            <div className={styles.actions}>
              <button className={styles.primaryButton} onClick={handleSplit} disabled={splitPoints.length === 0}>✂️ Split PDF</button>
            </div>
          </div>
        )}

        {results.length > 0 && (
          <div className={styles.resultSection}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
              <h3 className={styles.resultTitle} style={{ margin: 0 }}>✅ Split into {results.length} files</h3>
              <button onClick={() => { const input = document.createElement('input'); input.type = 'file'; input.accept = '.pdf';  input.onchange = (e) => { const f = (e.target as HTMLInputElement).files; if (f?.length) handleFileSelected(Array.from(f)); }; input.click(); }} style={{ background: "transparent", border: "1px solid var(--color-border)", borderRadius: 'var(--radius-md)', padding: '8px 16px', color: "var(--color-text)", cursor: 'pointer', fontWeight: 600, fontSize: '13px' }}>Upload New File</button>
            </div>
            {results.map((data, i) => {
              const seg = segments[i];
              return (
                <div key={i} style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '8px' }}>
                  <DownloadButton data={data} fileName={`${file?.name?.replace('.pdf', '')}_part_${i + 1}.pdf`} label={`${seg?.label || `Part ${i+1}`} (pages ${seg?.start}–${seg?.end})`} />
                  <button className={styles.primaryButton} onClick={() => setPreviewIdx(i)} style={{ background: 'var(--glass-bg)', border: 'var(--glass-border)', fontSize: '12px', padding: '8px 12px' }}>👁️</button>
                </div>
              );
            })}
          </div>
        )}
      </div>
      {isProcessing && <ProcessingLoader message="Splitting PDF..." />}
      {previewIdx !== null && results[previewIdx] && (
        <PdfPreviewSidebar data={results[previewIdx]} fileName={`part_${previewIdx + 1}.pdf`} onClose={() => setPreviewIdx(null)} />
      )}
      <ToolExplanation title="Split PDF">
        <p><strong>Split PDF</strong> divides a single PDF document into multiple smaller files at the points you choose.</p>
        <p>Click the ✂️ scissors between any two pages to create a split point. Each segment becomes its own downloadable PDF. This is useful for breaking up large documents into chapters, separating forms, or extracting specific sections.</p>
      </ToolExplanation>
    </ToolLayout>
  );
}
