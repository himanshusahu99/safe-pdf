import { useState, useCallback, useRef } from 'react';
import {
  DndContext, closestCenter, KeyboardSensor, PointerSensor,
  useSensor, useSensors, type DragEndEvent,
} from '@dnd-kit/core';
import {
  SortableContext, sortableKeyboardCoordinates,
  verticalListSortingStrategy, useSortable,
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import ToolLayout from '../../components/ToolLayout/ToolLayout';
import FileUploader from '../../components/FileUploader/FileUploader';
import ProcessingLoader from '../../components/ProcessingLoader/ProcessingLoader';
import DownloadButton from '../../components/DownloadButton/DownloadButton';
import PdfPreviewSidebar from '../../components/PdfPreviewSidebar/PdfPreviewSidebar';
import ToolExplanation from '../../components/ToolExplanation/ToolExplanation';
import PageSelector from '../../components/PageSelector/PageSelector';
import { mergePdfs } from '../../utils/pdfUtils';
import { generateId, formatFileSize } from '../../utils/fileUtils';
import styles from './MergePdf.module.css';

interface PdfFileItem {
  id: string;
  file: File;
  name: string;
  size: number;
  pageCount: number;
  selectedPages?: number[];
}

// ─── Sortable accordion card ──────────────────────────────────────────────────
interface FileCardProps {
  item: PdfFileItem;
  expanded: boolean;
  onToggleExpand: () => void;
  onRemove: () => void;
  onPagesChange: (pages: number[]) => void;
}

function FileCard({ item, expanded, onToggleExpand, onRemove, onPagesChange }: FileCardProps) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } =
    useSortable({ id: item.id });

  const selectedCount = item.selectedPages?.length ?? item.pageCount;
  const hasCustomPages = item.selectedPages !== undefined;

  const handleToggle = (p: number) => {
    const current = item.selectedPages ?? Array.from({ length: item.pageCount }, (_, i) => i + 1);
    const next = current.includes(p) ? current.filter(x => x !== p) : [...current, p];
    onPagesChange(next);
  };

  return (
    <div
      ref={setNodeRef}
      className={`${styles.card} ${isDragging ? styles.dragging : ''}`}
      style={{
        transform: CSS.Transform.toString(transform),
        transition: isDragging ? 'none' : transition,
        zIndex: isDragging ? 10 : 1,
        touchAction: 'none',
      }}
    >
      {/* ── Card header row ── */}
      <div
        className={styles.cardHeader}
        onClick={onToggleExpand}
        style={{ cursor: isDragging ? 'grabbing' : 'pointer' }}
      >
        <span
          className={styles.dragHandle}
          {...attributes}
          {...listeners}
          onClick={e => e.stopPropagation()}
          style={{ cursor: isDragging ? 'grabbing' : 'grab' }}
        >
          ⠿
        </span>
        <div className={styles.fileIcon}>📄</div>
        <div className={styles.fileInfo}>
          <p className={styles.fileName}>{item.name}</p>
          <p className={styles.fileMeta}>
            {formatFileSize(item.size)}
            {item.pageCount > 0 && (
              <> &middot; {selectedCount}/{item.pageCount} pages{hasCustomPages ? ' selected' : ''}</>
            )}
          </p>
        </div>
        <div
          className={styles.cardActions}
          onPointerDown={e => e.stopPropagation()}
        >
          {item.pageCount > 1 && (
            <button
              className={`${styles.expandBtn} ${expanded ? styles.expandBtnOpen : ''}`}
              onClick={onToggleExpand}
              title={expanded ? 'Collapse page selection' : 'Select pages'}
            >
              {expanded ? '▲' : '▼'} Pages
            </button>
          )}
          <button className={styles.removeBtn} onClick={onRemove} title="Remove">✕</button>
        </div>
      </div>

      {/* ── Accordion body ── */}
      {expanded && item.pageCount > 0 && (
        <div className={styles.accordionBody} onPointerDown={e => e.stopPropagation()}>
          <PageSelector
            file={item.file}
            pageCount={item.pageCount}
            selectedPages={item.selectedPages ?? Array.from({ length: item.pageCount }, (_, i) => i + 1)}
            onTogglePage={handleToggle}
            onSelectAll={() => onPagesChange(Array.from({ length: item.pageCount }, (_, i) => i + 1))}
            onDeselectAll={() => onPagesChange([])}
          />
        </div>
      )}
    </div>
  );
}

// ─── Main tool ────────────────────────────────────────────────────────────────
export default function MergePdf() {
  const [files, setFiles] = useState<PdfFileItem[]>([]);
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [progress, setProgress] = useState(0);
  const [result, setResult] = useState<Uint8Array | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [showPreview, setShowPreview] = useState(false);
  const addMoreRef = useRef<HTMLInputElement>(null);

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 6 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates }),
  );

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
    if (expandedId === id) setExpandedId(null);
    setResult(null);
  }, [expandedId]);

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    if (over && active.id !== over.id) {
      setFiles(prev => {
        const oldIdx = prev.findIndex(f => f.id === active.id);
        const newIdx = prev.findIndex(f => f.id === over.id);
        const updated = [...prev];
        const [moved] = updated.splice(oldIdx, 1);
        updated.splice(newIdx, 0, moved);
        return updated;
      });
      setResult(null);
    }
  };

  const handlePagesChange = useCallback((id: string, pages: number[]) => {
    setFiles(prev => prev.map(f => {
      if (f.id !== id) return f;
      // If all pages selected, clear custom selection
      if (pages.length === f.pageCount) return { ...f, selectedPages: undefined };
      return { ...f, selectedPages: pages };
    }));
    setResult(null);
  }, []);

  const handleMerge = async () => {
    if (files.length < 2) return;
    setIsProcessing(true);
    setProgress(0);
    setError(null);
    try {
      setProgress(20);
      const itemsToMerge = files.map(f => ({ file: f.file, pages: f.selectedPages }));
      setProgress(50);
      const merged = await mergePdfs(itemsToMerge);
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
              {files.length} file{files.length !== 1 ? 's' : ''} — drag to reorder, expand to select pages
            </h3>

            <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
              <SortableContext items={files.map(f => f.id)} strategy={verticalListSortingStrategy}>
                <div className={styles.fileList}>
                  {files.map(item => (
                    <FileCard
                      key={item.id}
                      item={item}
                      expanded={expandedId === item.id}
                      onToggleExpand={() => setExpandedId(prev => prev === item.id ? null : item.id)}
                      onRemove={() => handleRemove(item.id)}
                      onPagesChange={pages => handlePagesChange(item.id, pages)}
                    />
                  ))}
                </div>
              </SortableContext>
            </DndContext>

            <div className={styles.actions}>
              <button
                className={styles.mergeButton}
                onClick={handleMerge}
                disabled={files.length < 2 || isProcessing}
              >
                📎 Merge {files.length} Files
              </button>
              <button className={styles.addMoreButton} onClick={() => addMoreRef.current?.click()}>
                + Add more files
              </button>
              <input
                ref={addMoreRef}
                type="file"
                accept=".pdf"
                multiple
                style={{ display: 'none' }}
                onChange={e => {
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
            <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
              <DownloadButton data={result} fileName="merged.pdf" />
              <button onClick={() => setShowPreview(true)} style={{ background: 'var(--glass-bg)', border: 'var(--glass-border)', borderRadius: 'var(--radius-md)', padding: '12px 20px', color: 'var(--color-text)', cursor: 'pointer', fontWeight: 500, fontSize: '14px' }}>👁️ Preview</button>
              <button onClick={() => { const input = document.createElement('input'); input.type = 'file'; input.accept = '.pdf'; input.multiple = true; input.onchange = e => { const f = (e.target as HTMLInputElement).files; if (f?.length) handleFilesSelected(Array.from(f)); }; input.click(); }} style={{ background: 'transparent', border: '1px solid var(--color-border)', borderRadius: 'var(--radius-md)', padding: '12px 20px', color: 'var(--color-text)', cursor: 'pointer', fontWeight: 500, fontSize: '14px' }}>Upload New Files</button>
            </div>
          </div>
        )}
      </div>

      {isProcessing && <ProcessingLoader message="Merging your PDFs..." progress={progress} />}
      {showPreview && result && <PdfPreviewSidebar data={result} fileName="merged.pdf" onClose={() => setShowPreview(false)} />}

      <ToolExplanation title="Merge PDF">
        <p><strong>Merge PDF</strong> combines two or more PDF files into a single document. Drag to reorder files, then expand any file to choose specific pages to include.</p>
        <p>All processing happens locally in your browser — your files never leave your device.</p>
      </ToolExplanation>
    </ToolLayout>
  );
}
