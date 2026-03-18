import { useState, useCallback } from 'react';
import ToolLayout from '../../components/ToolLayout/ToolLayout';
import FileUploader from '../../components/FileUploader/FileUploader';
import ProcessingLoader from '../../components/ProcessingLoader/ProcessingLoader';
import DownloadButton from '../../components/DownloadButton/DownloadButton';
import PdfPreviewSidebar from '../../components/PdfPreviewSidebar/PdfPreviewSidebar';
import ToolExplanation from '../../components/ToolExplanation/ToolExplanation';
import PageSelector from '../../components/PageSelector/PageSelector';
import { addPageNumbers } from '../../utils/pdfUtils';
import styles from '../shared/ToolShared.module.css';
import AccordionSection from '../../components/AccordionSection/AccordionSection';

const POSITIONS = [
  { value: 'bottom-center', label: 'Bottom Center' },
  { value: 'bottom-left', label: 'Bottom Left' },
  { value: 'bottom-right', label: 'Bottom Right' },
  { value: 'top-center', label: 'Top Center' },
  { value: 'top-left', label: 'Top Left' },
  { value: 'top-right', label: 'Top Right' },
];

export default function AddPageNumbers() {
  const [file, setFile] = useState<File | null>(null);
  const [pageCount, setPageCount] = useState(0);
  const [selectedPages, setSelectedPages] = useState<number[]>([]);
  const [position, setPosition] = useState('bottom-center');
  const [startNumber, setStartNumber] = useState(1);
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
    } catch {}
  }, []);

  const handleAddNumbers = async () => {
    if (!file) return;
    setIsProcessing(true);
    setError(null);
    try {
      const pageIndices = selectedPages.length === pageCount
        ? undefined
        : selectedPages.map(p => p - 1);
      const numbered = await addPageNumbers(file, position, startNumber, pageIndices);
      setResult(numbered);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to add page numbers');
    } finally { setIsProcessing(false); }
  };

  return (
    <ToolLayout title="Add Page Numbers" description="Number the pages of your PDF" icon="🔢" color="#8b5cf6" error={error}>
      <div className={styles.container}>
        {!file ? (
          <FileUploader onFilesSelected={handleFileSelected} accept=".pdf" label="Drop your PDF to add page numbers" />
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
            <div className={styles.optionGroup}>
              <label className={styles.optionLabel}>Position:</label>
              <select className={styles.optionInput} value={position} onChange={e => setPosition(e.target.value)}>
                {POSITIONS.map(p => (
                  <option key={p.value} value={p.value}>{p.label}</option>
                ))}
              </select>
            </div>
            <div className={styles.optionGroup}>
              <label className={styles.optionLabel}>Start from number:</label>
              <input className={styles.optionInput} type="number" min={1} value={startNumber} onChange={e => setStartNumber(Number(e.target.value))} />
            </div>
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
            <div className={styles.actions}>
              <button className={styles.primaryButton} onClick={handleAddNumbers} disabled={selectedPages.length === 0}>
                🔢 Add Page Numbers
              </button>
            </div>
          </div>
        )}
        {result && (
          <div className={styles.resultSection}>
            <h3 className={styles.resultTitle}>✅ Page numbers added!</h3>
            <div className={styles.actions}>
              <DownloadButton data={result} fileName={`numbered_${file?.name || 'document.pdf'}`} />
              <button className={styles.primaryButton} onClick={() => setShowPreview(true)} style={{ background: 'var(--glass-bg)', border: 'var(--glass-border)' }}>👁️ Preview</button>
              <button onClick={() => { const input = document.createElement('input'); input.type = 'file'; input.accept = '.pdf'; input.onchange = (e) => { const f = (e.target as HTMLInputElement).files; if (f?.length) handleFileSelected(Array.from(f)); }; input.click(); }} style={{ background: 'transparent', border: '1px solid var(--color-border)', borderRadius: 'var(--radius-md)', padding: '12px 20px', color: 'var(--color-text)', cursor: 'pointer', fontWeight: 500, fontSize: '14px' }}>Upload New File</button>
            </div>
          </div>
        )}
      </div>
      {isProcessing && <ProcessingLoader message="Adding page numbers..." />}
      {showPreview && result && <PdfPreviewSidebar data={result} fileName={`numbered_${file?.name || 'document.pdf'}`} onClose={() => setShowPreview(false)} />}
      <ToolExplanation title="Add Page Numbers">
        <p><strong>Add Page Numbers</strong> inserts sequential page numbers on selected pages of your PDF.</p>
        <p>Choose from 6 positions. Use <strong>page selection</strong> below to number only specific pages — e.g. skip the cover or appendix. You can also set a custom starting number.</p>
      </ToolExplanation>
    </ToolLayout>
  );
}
