import { useState, useCallback } from 'react';
import { DndContext, closestCenter, KeyboardSensor, PointerSensor, useSensor, useSensors, type DragEndEvent } from '@dnd-kit/core';
import { arrayMove, SortableContext, sortableKeyboardCoordinates, rectSortingStrategy, useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
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
import AccordionSection from '../../components/AccordionSection/AccordionSection';

export default function ExtractPages() {
  const [file, setFile] = useState<File | null>(null);
  const [pageCount, setPageCount] = useState(0);
  const [selectedPages, setSelectedPages] = useState<number[]>([]);
  const [isProcessing, setIsProcessing] = useState(false);
  const [result, setResult] = useState<Uint8Array | null>(null);
  const [showPreview, setShowPreview] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 5 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates })
  );

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

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    if (over && active.id !== over.id) {
      setSelectedPages(current => {
        const oldIndex = current.findIndex(p => p.toString() === active.id);
        const newIndex = current.findIndex(p => p.toString() === over.id);
        return arrayMove(current, oldIndex, newIndex);
      });
    }
  };

  const handleExtract = async () => {
    if (!file || selectedPages.length === 0) return;
    setIsProcessing(true);
    setError(null);
    try {
      // Use raw selectedPages array directly to preserve the sorted order
      const indices = selectedPages.map(p => p - 1);
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

            <AccordionSection 
              title="Select Pages" 
              defaultOpen={true}
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

            {/* Selected sequence sorting */}
            {selectedPages.length > 1 && (
              <div style={{ marginTop: '16px', background: 'var(--color-bg-card)', padding: '12px', borderRadius: '8px', border: '1px solid var(--color-border)' }}>
                <h4 style={{ fontSize: '13px', fontWeight: 600, color: 'var(--color-text)', marginBottom: '8px' }}>
                  Output Page Order <span style={{ color: 'var(--color-text-dim)', fontWeight: 400 }}>(drag to rearrange structure)</span>
                </h4>
                <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
                  <SortableContext items={selectedPages.map(String)} strategy={rectSortingStrategy}>
                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
                      {selectedPages.map(p => (
                        <SortablePageToken key={p} page={p} onRemove={() => setSelectedPages(prev => prev.filter(x => x !== p))} />
                      ))}
                    </div>
                  </SortableContext>
                </DndContext>
              </div>
            )}

            <div className={styles.actions} style={{ marginTop: '20px' }}>
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
        <p><strong>Extract Pages</strong> copies selected pages from your PDF into a brand-new document.</p>
        <p>Pick pages using the selector grid, then **drag the page tokens** to rearranging the output order. Great for assembling highlights or creating alternative reading paths.</p>
      </ToolExplanation>
    </ToolLayout>
  );
}

function SortablePageToken({ page, onRemove }: { page: number; onRemove: () => void }) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({ id: page.toString() });

  const style: React.CSSProperties = {
    transform: CSS.Transform.toString(transform),
    transition,
    background: 'linear-gradient(135deg, var(--color-primary), #4f46e5)',
    color: 'white',
    padding: '4px 10px',
    borderRadius: '16px',
    fontSize: '11px',
    fontWeight: 600,
    display: 'flex',
    alignItems: 'center',
    gap: '6px',
    cursor: 'grab',
    opacity: isDragging ? 0.4 : 1,
    zIndex: isDragging ? 10 : 1,
    border: '1px solid rgba(255,255,255,0.1)',
    boxShadow: '0 2px 5px rgba(0,0,0,0.1)',
  };

  return (
    <div ref={setNodeRef} style={style} {...attributes} {...listeners}>
      <span>Page {page}</span>
      <button 
        onClick={(e) => { e.stopPropagation(); onRemove(); }} 
        style={{ background: 'transparent', border: 'none', color: 'rgba(255,255,255,0.8)', padding: 0, fontSize: '11px', cursor: 'pointer', display: 'flex', alignItems: 'center' }}
      >✕</button>
    </div>
  );
}
