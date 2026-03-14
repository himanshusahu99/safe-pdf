import { useState, useCallback } from 'react';
import ToolLayout from '../../components/ToolLayout/ToolLayout';
import FileUploader from '../../components/FileUploader/FileUploader';
import ProcessingLoader from '../../components/ProcessingLoader/ProcessingLoader';
import DownloadButton from '../../components/DownloadButton/DownloadButton';
import PdfPreviewSidebar from '../../components/PdfPreviewSidebar/PdfPreviewSidebar';
import PageSelector from '../../components/PageSelector/PageSelector';
import ToolExplanation from '../../components/ToolExplanation/ToolExplanation';
import { extractPages } from '../../utils/pdfUtils';
import { getPageCount } from '../../utils/renderUtils';
import styles from '../shared/ToolShared.module.css';

export default function ExtractPages() {
  const [file, setFile] = useState<File | null>(null);
  const [pageCount, setPageCount] = useState(0);
  const [selectedPages, setSelectedPages] = useState<number[]>([]);
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
      setSelectedPages(Array.from({ length: count }, (_, i) => i + 1));
    } catch { setPageCount(0); }
  }, []);

  const handleExtract = async () => {
    if (!file || selectedPages.length === 0) return;
    setIsProcessing(true);
    setError(null);
    try {
      const sorted = [...selectedPages].sort((a, b) => a - b);
      const indices = sorted.map(p => p - 1);
      const extracted = await extractPages(file, indices);
      setResult(extracted);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to extract pages');
    } finally { setIsProcessing(false); }
  };

  return (
    <ToolLayout title="Extract Pages" description="Extract selected pages into a new PDF" icon="📑" color="#10b981" error={error}>
      <div className={styles.container}>
        {!file ? (
          <FileUploader onFilesSelected={handleFileSelected} accept=".pdf" label="Drop your PDF to extract pages" />
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
              Select the pages you want to <strong style={{ color: '#10b981' }}>extract</strong> into a new PDF.
            </p>
            <PageSelector
              file={file}
              pageCount={pageCount}
              selectedPages={selectedPages}
              onTogglePage={p => setSelectedPages(prev => prev.includes(p) ? prev.filter(x => x !== p) : [...prev, p])}
              onSelectAll={() => setSelectedPages(Array.from({ length: pageCount }, (_, i) => i + 1))}
              onDeselectAll={() => setSelectedPages([])}
            />
            <div className={styles.actions} style={{ marginTop: '16px' }}>
              <button className={styles.primaryButton} onClick={handleExtract} disabled={selectedPages.length === 0}>
                📑 Extract {selectedPages.length} page{selectedPages.length !== 1 ? 's' : ''}
              </button>
            </div>
          </div>
        )}
        {result && (
          <div className={styles.resultSection}>
            <h3 className={styles.resultTitle}>✅ {selectedPages.length} page{selectedPages.length !== 1 ? 's' : ''} extracted!</h3>
            <div className={styles.actions}>
              <DownloadButton data={result} fileName={`extracted_${file?.name || 'document.pdf'}`} />
              <button className={styles.primaryButton} onClick={() => setShowPreview(true)} style={{ background: 'var(--glass-bg)', border: 'var(--glass-border)' }}>👁️ Preview</button>
              <button onClick={() => { const input = document.createElement('input'); input.type = 'file'; input.accept = '.pdf';  input.onchange = (e) => { const f = (e.target as HTMLInputElement).files; if (f?.length) handleFileSelected(Array.from(f)); }; input.click(); }} style={{ background: "transparent", border: "1px solid var(--color-border)", borderRadius: 'var(--radius-md)', padding: '12px 20px', color: "var(--color-text)", cursor: 'pointer', fontWeight: 500, fontSize: '14px' }}>Upload New File</button>
            </div>
          </div>
        )}
      </div>
      {isProcessing && <ProcessingLoader message="Extracting pages..." />}
      {showPreview && result && <PdfPreviewSidebar data={result} fileName={`extracted_${file?.name || 'document.pdf'}`} onClose={() => setShowPreview(false)} />}
      <ToolExplanation title="Extract Pages">
        <p><strong>Extract Pages</strong> copies selected pages from your PDF into a brand-new document, leaving the original untouched.</p>
        <p>This is useful when you need just a few pages from a larger document — select the ones you need, extract them, and download a clean new PDF.</p>
      </ToolExplanation>
    </ToolLayout>
  );
}
