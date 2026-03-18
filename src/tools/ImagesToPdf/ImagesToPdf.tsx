import { useState, useCallback, useEffect } from 'react';
import { DndContext, closestCenter, KeyboardSensor, PointerSensor, useSensor, useSensors, type DragEndEvent } from '@dnd-kit/core';
import { arrayMove, SortableContext, sortableKeyboardCoordinates, rectSortingStrategy, useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import ToolLayout from '../../components/ToolLayout/ToolLayout';
import FileUploader from '../../components/FileUploader/FileUploader';
import ProcessingLoader from '../../components/ProcessingLoader/ProcessingLoader';
import DownloadButton from '../../components/DownloadButton/DownloadButton';
import PdfPreviewSidebar from '../../components/PdfPreviewSidebar/PdfPreviewSidebar';
import ToolExplanation from '../../components/ToolExplanation/ToolExplanation';
import { imagesToPdf } from '../../utils/pdfUtils';
import styles from '../shared/ToolShared.module.css';

interface ImageItem {
  id: string;
  file: File;
  url: string;
}

export default function ImagesToPdf() {
  const [items, setItems] = useState<ImageItem[]>([]);
  const [isProcessing, setIsProcessing] = useState(false);
  const [result, setResult] = useState<Uint8Array | null>(null);
  const [showPreview, setShowPreview] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 5 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates })
  );

  const handleFilesSelected = useCallback((newFiles: File[]) => {
    const newItems = newFiles.map(f => ({
      id: `${f.name}-${Date.now()}-${Math.random()}`,
      file: f,
      url: URL.createObjectURL(f)
    }));
    setItems(prev => [...prev, ...newItems]);
    setResult(null);
    setError(null);
  }, []);

  // Cleanup object URLs to avoid leaks
  useEffect(() => {
    return () => {
      items.forEach(item => URL.revokeObjectURL(item.url));
    };
  }, [items]);

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    if (over && active.id !== over.id) {
      setItems(current => {
        const oldIndex = current.findIndex(item => item.id === active.id);
        const newIndex = current.findIndex(item => item.id === over.id);
        return arrayMove(current, oldIndex, newIndex);
      });
    }
  };

  const removeItem = (id: string, url: string) => {
    URL.revokeObjectURL(url);
    setItems(prev => prev.filter(item => item.id !== id));
  };

  const handleConvert = async () => {
    if (items.length === 0) return;
    setIsProcessing(true); 
    setError(null);
    try {
      const files = items.map(item => item.file);
      const pdf = await imagesToPdf(files);
      setResult(pdf);
    } catch (err) { 
      setError(err instanceof Error ? err.message : 'Failed to convert images to PDF'); 
    } finally { 
      setIsProcessing(false); 
    }
  };

  return (
    <ToolLayout title="Images to PDF" description="Convert images to a single PDF document" icon="🖼️" color="#6366f1" error={error}>
      <div className={styles.container}>
        {items.length === 0 ? (
          <FileUploader onFilesSelected={handleFilesSelected} accept=".jpg,.jpeg,.png,.webp" multiple label="Drop your images here" />
        ) : (
          <div className={styles.fileSection}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '12px' }}>
              <h3 className={styles.sectionTitle} style={{ margin: 0 }}>{items.length} image{items.length !== 1 ? 's' : ''} selected</h3>
              <div style={{ display: 'flex', gap: '8px' }}>
                <button 
                  onClick={() => { const input = document.createElement('input'); input.type = 'file'; input.accept = '.jpg,.jpeg,.png,.webp'; input.multiple = true; input.onchange = (e) => { const f = (e.target as HTMLInputElement).files; if (f?.length) handleFilesSelected(Array.from(f)); }; input.click(); }} 
                  style={{ background: 'transparent', border: '1px solid var(--color-border)', borderRadius: '6px', padding: '6px 12px', fontSize: '12px', color: 'var(--color-text-muted)', cursor: 'pointer' }}
                >
                  + Add More
                </button>
                <button 
                  onClick={() => { items.forEach(i => URL.revokeObjectURL(i.url)); setItems([]); setResult(null); }}
                  style={{ background: 'transparent', border: '1px solid #ef4444', borderRadius: '6px', padding: '6px 12px', fontSize: '12px', color: '#ef4444', cursor: 'pointer' }}
                >
                  Clear All
                </button>
              </div>
            </div>

            <p style={{ fontSize: '12px', color: 'var(--color-text-dim)', marginBottom: '12px' }}>
              Drag images to rearrange the page order in the final PDF.
            </p>

            <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
              <SortableContext items={items.map(i => i.id)} strategy={rectSortingStrategy}>
                <div className={styles.pageGrid}>
                  {items.map((item) => (
                    <SortableImageCard key={item.id} item={item} onRemove={removeItem} />
                  ))}
                </div>
              </SortableContext>
            </DndContext>

            <div className={styles.actions} style={{ marginTop: '20px' }}>
              <button className={styles.primaryButton} onClick={handleConvert}>🖼️ Convert to PDF</button>
            </div>
          </div>
        )}
        
        {result && (
          <div className={styles.resultSection}>
            <h3 className={styles.resultTitle}>✅ PDF created from {items.length} images!</h3>
            <div className={styles.actions}>
              <DownloadButton data={result} fileName="images_to_pdf.pdf" />
              <button className={styles.primaryButton} onClick={() => setShowPreview(true)} style={{ background: 'var(--glass-bg)', border: 'var(--glass-border)' }}>👁️ Preview</button>
              <button onClick={() => { items.forEach(i => URL.revokeObjectURL(i.url)); setItems([]); setResult(null); }} style={{ background: "transparent", border: "1px solid var(--color-border)", borderRadius: 'var(--radius-md)', padding: '12px 20px', color: "var(--color-text)", cursor: 'pointer', fontWeight: 500, fontSize: '14px' }}>Upload New Files</button>
            </div>
          </div>
        )}
      </div>
      {isProcessing && <ProcessingLoader message="Converting images to PDF..." />}
      {showPreview && result && <PdfPreviewSidebar data={result} fileName="images_to_pdf.pdf" onClose={() => setShowPreview(false)} />}
      <ToolExplanation title="Images to PDF">
        <p><strong>Images to PDF</strong> converts your images (JPG, PNG, WebP) into a single PDF document.</p>
        <p>Drag and drop image tiles to change their sequence. Each image displays as a full page in the generated file. High resolution and original aspect ratios are maintained.</p>
      </ToolExplanation>
    </ToolLayout>
  );
}

function SortableImageCard({ item, onRemove }: { item: ImageItem; onRemove: (id: string, url: string) => void }) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({ id: item.id });

  const style: React.CSSProperties = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.4 : 1,
    zIndex: isDragging ? 10 : 1,
    borderRadius: '8px',
    overflow: 'hidden',
    border: isDragging ? '2px solid var(--color-accent)' : '1px solid var(--color-border)',
    position: 'relative',
    cursor: 'grab',
    background: 'var(--color-bg-card)',
  };

  return (
    <div ref={setNodeRef} style={style} {...attributes} {...listeners}>
      <img src={item.url} alt={item.file.name} style={{ width: '100%', display: 'block', aspectRatio: '1', objectFit: 'cover', pointerEvents: 'none' }} />
      <button
        onClick={(e) => { e.stopPropagation(); onRemove(item.id, item.url); }}
        style={{ position: 'absolute', top: '4px', right: '4px', width: '22px', height: '22px', borderRadius: '50%', background: 'rgba(239,68,68,0.9)', color: 'white', border: 'none', fontSize: '12px', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 10 }}
      >✕</button>
      <div style={{ padding: '6px 8px', fontSize: '10px', color: 'var(--color-text-muted)', background: 'var(--glass-bg)', textOverflow: 'ellipsis', overflow: 'hidden', whiteSpace: 'nowrap' }}>{item.file.name}</div>
    </div>
  );
}
