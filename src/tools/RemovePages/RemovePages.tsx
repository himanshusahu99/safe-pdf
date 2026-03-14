import { useState, useCallback } from 'react';
import ToolLayout from '../../components/ToolLayout/ToolLayout';
import FileUploader from '../../components/FileUploader/FileUploader';
import ProcessingLoader from '../../components/ProcessingLoader/ProcessingLoader';
import DownloadButton from '../../components/DownloadButton/DownloadButton';
import PdfPreviewSidebar from '../../components/PdfPreviewSidebar/PdfPreviewSidebar';
import PageSelector from '../../components/PageSelector/PageSelector';
import ToolExplanation from '../../components/ToolExplanation/ToolExplanation';
import { removePages } from '../../utils/pdfUtils';
import { getPageCount } from '../../utils/renderUtils';
import styles from '../shared/ToolShared.module.css';

export default function RemovePages() {
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
      setSelectedPages([]);
    } catch { setPageCount(0); }
  }, []);

  const handleRemove = async () => {
    if (!file || selectedPages.length === 0) return;
    setIsProcessing(true);
    setError(null);
    try {
      const pagesToRemove = selectedPages.map(p => p - 1);
      const removed = await removePages(file, pagesToRemove);
      setResult(removed);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to remove pages');
    } finally { setIsProcessing(false); }
  };

  return (
    <ToolLayout title="Remove Pages" description="Delete selected pages from your PDF" icon="🗑️" color="#ef4444" error={error}>
      <div className={styles.container}>
        {!file ? (
          <FileUploader onFilesSelected={handleFileSelected} accept=".pdf" label="Drop your PDF to remove pages" />
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
              Select the pages you want to <strong style={{ color: '#ef4444' }}>remove</strong>. Selected (highlighted) pages will be deleted.
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
              <button className={styles.primaryButton} onClick={handleRemove} disabled={selectedPages.length === 0}>
                🗑️ Remove {selectedPages.length} page{selectedPages.length !== 1 ? 's' : ''}
              </button>
            </div>
          </div>
        )}
        {result && (
          <div className={styles.resultSection}>
            <h3 className={styles.resultTitle}>✅ {selectedPages.length} page{selectedPages.length !== 1 ? 's' : ''} removed!</h3>
            <div className={styles.actions}>
              <DownloadButton data={result} fileName={`trimmed_${file?.name || 'document.pdf'}`} />
              <button className={styles.primaryButton} onClick={() => setShowPreview(true)} style={{ background: 'var(--glass-bg)', border: 'var(--glass-border)' }}>👁️ Preview</button>
              <button onClick={() => { const input = document.createElement('input'); input.type = 'file'; input.accept = '.pdf';  input.onchange = (e) => { const f = (e.target as HTMLInputElement).files; if (f?.length) handleFileSelected(Array.from(f)); }; input.click(); }} style={{ background: "transparent", border: "1px solid var(--color-border)", borderRadius: 'var(--radius-md)', padding: '12px 20px', color: "var(--color-text)", cursor: 'pointer', fontWeight: 500, fontSize: '14px' }}>Upload New File</button>
            </div>
          </div>
        )}
      </div>
      {isProcessing && <ProcessingLoader message="Removing pages..." />}
      {showPreview && result && <PdfPreviewSidebar data={result} fileName={`trimmed_${file?.name || 'document.pdf'}`} onClose={() => setShowPreview(false)} />}
      <ToolExplanation title="Remove Pages">
        <p><strong>Remove Pages</strong> lets you delete specific pages from your PDF document. Simply select the pages you want to remove and download the trimmed version.</p>
        <p>Use "Select All" to quickly select every page, then deselect the ones you want to keep. The remaining pages are re-ordered automatically.</p>
      </ToolExplanation>
    </ToolLayout>
  );
}
