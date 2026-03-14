import { useState, useCallback, useRef } from 'react';
import ToolLayout from '../../components/ToolLayout/ToolLayout';
import FileUploader from '../../components/FileUploader/FileUploader';
import FilePreview from '../../components/FilePreview/FilePreview';
import ProcessingLoader from '../../components/ProcessingLoader/ProcessingLoader';
import DownloadButton from '../../components/DownloadButton/DownloadButton';
import PdfPreviewSidebar from '../../components/PdfPreviewSidebar/PdfPreviewSidebar';
import ToolExplanation from '../../components/ToolExplanation/ToolExplanation';
import { mergePdfs } from '../../utils/pdfUtils';
import { generateId } from '../../utils/fileUtils';
import styles from './MergePdf.module.css';

interface PdfFileItem {
  id: string;
  file: File;
  name: string;
  size: number;
  pageCount: number;
}

export default function MergePdf() {
  const [files, setFiles] = useState<PdfFileItem[]>([]);
  const [isProcessing, setIsProcessing] = useState(false);
  const [progress, setProgress] = useState(0);
  const [result, setResult] = useState<Uint8Array | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [showPreview, setShowPreview] = useState(false);
  const addMoreRef = useRef<HTMLInputElement>(null);

  const handleFilesSelected = useCallback(async (newFiles: File[]) => {
    const items: PdfFileItem[] = [];
    for (const file of newFiles) {
      let pageCount = 0;
      try {
        const { PDFDocument } = await import('pdf-lib');
        const ab = await file.arrayBuffer();
        const doc = await PDFDocument.load(ab, { ignoreEncryption: true });
        pageCount = doc.getPageCount();
      } catch { /* ignore */ }
      items.push({ id: generateId(), file, name: file.name, size: file.size, pageCount });
    }
    setFiles(prev => [...prev, ...items]);
    setResult(null);
    setError(null);
  }, []);

  const handleRemove = useCallback((id: string) => {
    setFiles(prev => prev.filter(f => f.id !== id));
    setResult(null);
  }, []);

  const handleReorder = useCallback((from: number, to: number) => {
    setFiles(prev => {
      const updated = [...prev];
      const [moved] = updated.splice(from, 1);
      updated.splice(to, 0, moved);
      return updated;
    });
    setResult(null);
  }, []);

  const handleMerge = async () => {
    if (files.length < 2) return;
    setIsProcessing(true);
    setProgress(0);
    setError(null);

    try {
      // Simulate progress steps
      setProgress(20);
      const rawFiles = files.map(f => f.file);
      setProgress(50);
      const merged = await mergePdfs(rawFiles);
      setProgress(100);
      setResult(merged);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to merge PDFs');
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <ToolLayout
      title="Merge PDF"
      description="Combine multiple PDF files into one document"
      icon="📎"
      color="#6366f1"
      error={error}
    >
      <div className={styles.container}>
        {files.length === 0 ? (
          <FileUploader
            onFilesSelected={handleFilesSelected}
            accept=".pdf"
            multiple
            label="Drop your PDF files here to merge"
          />
        ) : (
          <div className={styles.fileSection}>
            <h3 className={styles.sectionTitle}>
              {files.length} file{files.length !== 1 ? 's' : ''} selected — drag to reorder
            </h3>
            <FilePreview
              files={files}
              onRemove={handleRemove}
              onReorder={handleReorder}
              showDragHandle
            />
            <div className={styles.actions}>
              <button
                className={styles.mergeButton}
                onClick={handleMerge}
                disabled={files.length < 2 || isProcessing}
              >
                📎 Merge {files.length} Files
              </button>
              <button
                className={styles.addMoreButton}
                onClick={() => addMoreRef.current?.click()}
              >
                + Add more files
              </button>
              <input
                ref={addMoreRef}
                type="file"
                accept=".pdf"
                multiple
                style={{ display: 'none' }}
                onChange={(e) => {
                  const selected = Array.from(e.target.files || []);
                  if (selected.length > 0) handleFilesSelected(selected);
                  e.target.value = '';
                }}
              />
            </div>
          </div>
        )}

        {result && (
          <div className={styles.resultSection}>
            <h3 className={styles.resultTitle}>✅ PDFs merged successfully!</h3>
            <div style={{ display: 'flex', gap: '8px' }}>
              <DownloadButton data={result} fileName="merged.pdf" />
              <button onClick={() => setShowPreview(true)} style={{ background: 'var(--glass-bg)', border: 'var(--glass-border)', borderRadius: 'var(--radius-md)', padding: '12px 20px', color: 'var(--color-text)', cursor: 'pointer', fontWeight: 500, fontSize: '14px' }}>👁️ Preview</button>
              <button onClick={() => { const input = document.createElement('input'); input.type = 'file'; input.accept = '.pdf'; input.multiple = true; input.onchange = (e) => { const f = (e.target as HTMLInputElement).files; if (f?.length) handleFilesSelected(Array.from(f)); }; input.click(); }} style={{ background: "transparent", border: "1px solid var(--color-border)", borderRadius: 'var(--radius-md)', padding: '12px 20px', color: "var(--color-text)", cursor: 'pointer', fontWeight: 500, fontSize: '14px' }}>Upload New File</button>
            </div>
          </div>
        )}
      </div>

      {isProcessing && (
        <ProcessingLoader message="Merging your PDFs..." progress={progress} />
      )}
      {showPreview && result && <PdfPreviewSidebar data={result} fileName="merged.pdf" onClose={() => setShowPreview(false)} />}
      <ToolExplanation title="Merge PDF">
        <p><strong>Merge PDF</strong> combines two or more PDF files into a single document. Drag and drop to set the order, then click merge.</p>
        <p>Use this tool to combine reports, merge scanned documents, or assemble a presentation from multiple files. All processing happens locally in your browser.</p>
      </ToolExplanation>
    </ToolLayout>
  );
}
