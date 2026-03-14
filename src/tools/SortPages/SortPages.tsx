import { useState, useCallback } from 'react';
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  type DragEndEvent,
} from '@dnd-kit/core';
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  useSortable,
  rectSortingStrategy,
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import ToolLayout from '../../components/ToolLayout/ToolLayout';
import FileUploader from '../../components/FileUploader/FileUploader';
import ProcessingLoader from '../../components/ProcessingLoader/ProcessingLoader';
import DownloadButton from '../../components/DownloadButton/DownloadButton';
import PdfPreviewSidebar from '../../components/PdfPreviewSidebar/PdfPreviewSidebar';
import ToolExplanation from '../../components/ToolExplanation/ToolExplanation';
import { sortPages } from '../../utils/pdfUtils';
import { renderPageToCanvas, getPageCount } from '../../utils/renderUtils';
import styles from '../shared/ToolShared.module.css';

interface SortablePage {
  id: string;
  pageNumber: number;
  thumbnail: string | null;
}

function SortablePageCard({ page }: { page: SortablePage }) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({ id: page.id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
    border: isDragging ? '2px solid var(--color-accent)' : '2px solid transparent',
    borderRadius: '8px',
    cursor: 'grab',
    background: 'var(--glass-bg)',
    overflow: 'hidden' as const,
  };

  return (
    <div ref={setNodeRef} style={style} {...attributes} {...listeners}>
      {page.thumbnail ? (
        <img src={page.thumbnail} alt={`Page ${page.pageNumber}`} style={{ width: '100%', display: 'block', aspectRatio: '0.707' }} />
      ) : (
        <div style={{ width: '100%', aspectRatio: '0.707', display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#e5e7eb', color: '#9ca3af', fontSize: '12px' }}>Loading...</div>
      )}
      <div style={{ padding: '4px', textAlign: 'center', fontSize: '12px', color: 'var(--color-text-muted)', fontWeight: 500 }}>
        Page {page.pageNumber}
      </div>
    </div>
  );
}

export default function SortPages() {
  const [file, setFile] = useState<File | null>(null);
  const [pages, setPages] = useState<SortablePage[]>([]);
  const [isProcessing, setIsProcessing] = useState(false);
  const [result, setResult] = useState<Uint8Array | null>(null);
  const [showPreview, setShowPreview] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 5 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates }),
  );

  const handleFileSelected = useCallback(async (files: File[]) => {
    const f = files[0];
    setFile(f);
    setResult(null);
    setError(null);
    try {
      const count = await getPageCount(f);
      const sorted: SortablePage[] = Array.from({ length: count }, (_, i) => ({
        id: `page-${i + 1}`,
        pageNumber: i + 1,
        thumbnail: null,
      }));
      setPages(sorted);
      // load thumbnails
      for (let i = 0; i < count; i++) {
        const thumb = await renderPageToCanvas(f, i + 1, 0.3);
        sorted[i] = { ...sorted[i], thumbnail: thumb };
        setPages([...sorted]);
      }
    } catch { setError('Failed to load PDF'); }
  }, []);

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    if (over && active.id !== over.id) {
      setPages(prev => {
        const oldIndex = prev.findIndex(p => p.id === active.id);
        const newIndex = prev.findIndex(p => p.id === over.id);
        return arrayMove(prev, oldIndex, newIndex);
      });
    }
  };

  const handleSort = async () => {
    if (!file || pages.length === 0) return;
    setIsProcessing(true);
    setError(null);
    try {
      const newOrder = pages.map(p => p.pageNumber - 1);
      const sorted = await sortPages(file, newOrder);
      setResult(sorted);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to sort pages');
    } finally { setIsProcessing(false); }
  };

  return (
    <ToolLayout title="Sort Pages" description="Reorder PDF pages with drag and drop" icon="📄" color="#0ea5e9" error={error}>
      <div className={styles.container}>
        {!file ? (
          <FileUploader onFilesSelected={handleFileSelected} accept=".pdf" label="Drop your PDF to reorder pages" />
        ) : (
          <div className={styles.fileSection}>
            <h3 className={styles.sectionTitle}>Drag and drop to reorder pages:</h3>
            <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
              <SortableContext items={pages.map(p => p.id)} strategy={rectSortingStrategy}>
                <div className={styles.pageGrid}>
                  {pages.map(page => (
                    <SortablePageCard key={page.id} page={page} />
                  ))}
                </div>
              </SortableContext>
            </DndContext>
            <div className={styles.actions}>
              <button className={styles.primaryButton} onClick={handleSort}>📄 Apply New Order</button>
            </div>
          </div>
        )}
        {result && (
          <div className={styles.resultSection}>
            <h3 className={styles.resultTitle}>✅ Pages reordered!</h3>
            <div className={styles.actions}>
              <DownloadButton data={result} fileName={`sorted_${file?.name || 'document.pdf'}`} />
              <button className={styles.primaryButton} onClick={() => setShowPreview(true)} style={{ background: 'var(--glass-bg)', border: 'var(--glass-border)' }}>👁️ Preview</button>
              <button onClick={() => { const input = document.createElement('input'); input.type = 'file'; input.accept = '.pdf';  input.onchange = (e) => { const f = (e.target as HTMLInputElement).files; if (f?.length) handleFileSelected(Array.from(f)); }; input.click(); }} style={{ background: "transparent", border: "1px solid var(--color-border)", borderRadius: 'var(--radius-md)', padding: '12px 20px', color: "var(--color-text)", cursor: 'pointer', fontWeight: 500, fontSize: '14px' }}>Upload New File</button>
            </div>
          </div>
        )}
      </div>
      {isProcessing && <ProcessingLoader message="Reordering pages..." />}
      {showPreview && result && <PdfPreviewSidebar data={result} fileName={`sorted_${file?.name || 'document.pdf'}`} onClose={() => setShowPreview(false)} />}
      <ToolExplanation title="Sort Pages">
        <p><strong>Sort Pages</strong> lets you rearrange the order of pages in your PDF document by simply dragging and dropping page thumbnails.</p>
        <p>This is useful when you need to reorganize a scanned document, move appendices, or reorder presentation slides. All processing is done in your browser — your files never leave your device.</p>
      </ToolExplanation>
    </ToolLayout>
  );
}
