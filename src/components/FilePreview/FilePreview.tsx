import { DndContext, closestCenter, KeyboardSensor, PointerSensor, useSensor, useSensors, type DragEndEvent } from '@dnd-kit/core';
import { SortableContext, sortableKeyboardCoordinates, verticalListSortingStrategy, useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { formatFileSize } from '../../utils/fileUtils';
import styles from './FilePreview.module.css';

export interface FilePreviewItem {
  id: string;
  name: string;
  size: number;
  pageCount?: number;
  selectedPages?: number[];
}

export interface FilePreviewProps {
  files: FilePreviewItem[];
  onRemove: (id: string) => void;
  onReorder?: (fromIndex: number, toIndex: number) => void;
  onSelectPages?: (id: string) => void;
  showDragHandle?: boolean;
}

function SortableItem({ file, onRemove, onSelectPages, showDragHandle }: { file: FilePreviewItem, onRemove: (id: string) => void, onSelectPages?: (id: string) => void, showDragHandle: boolean }) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({ id: file.id });
  
  const style = {
    transform: CSS.Transform.toString(transform),
    transition: isDragging ? 'none' : transition,
    opacity: isDragging ? 0.6 : 1,
    zIndex: isDragging ? 10 : 1,
    position: 'relative' as const,
  };

  const hasSpecificPages = file.selectedPages && file.pageCount && file.selectedPages.length < file.pageCount;

  return (
    <div 
      ref={setNodeRef} 
      className={`${styles.fileItem} ${isDragging ? styles.isDragging : ''}`}
      {...(showDragHandle ? { ...attributes, ...listeners } : {})}
      style={{
        ...style,
        cursor: isDragging ? 'grabbing' : showDragHandle ? 'grab' : 'default',
        touchAction: 'none'
      }}
    >
      {showDragHandle && (
        <span className={styles.dragHandle}>⠿</span>
      )}
      <div className={styles.fileIcon}>📄</div>
      <div className={styles.fileInfo}>
        <p className={styles.fileName}>{file.name}</p>
        <p className={styles.fileMeta}>
          {formatFileSize(file.size)}
          {file.pageCount ? ` · ${file.pageCount} pages` : ''}
          {hasSpecificPages && file.selectedPages ? ` · (Selected: ${file.selectedPages.length} pages)` : ''}
        </p>
      </div>
      <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }} onPointerDown={(e) => e.stopPropagation()}>
        {onSelectPages && file.pageCount && file.pageCount > 1 && (
          <button
            className={styles.selectPagesBtn}
            onClick={(e) => { e.stopPropagation(); onSelectPages(file.id); }}
            title="Select specific pages to merge"
          >
            Pages
          </button>
        )}
        <button
          className={styles.removeButton}
          onClick={(e) => { e.stopPropagation(); onRemove(file.id); }}
          title="Remove file"
        >
          ✕
        </button>
      </div>
    </div>
  );
}

export default function FilePreview({ files, onRemove, onReorder, onSelectPages, showDragHandle = false }: FilePreviewProps) {
  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 5,
      },
    }),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    if (over && active.id !== over.id && onReorder) {
      const oldIndex = files.findIndex((f) => f.id === active.id);
      const newIndex = files.findIndex((f) => f.id === over.id);
      onReorder(oldIndex, newIndex);
    }
  };

  if (!showDragHandle || !onReorder) {
    return (
      <div className={styles.fileList}>
        {files.map((file) => (
          <SortableItem 
            key={file.id} 
            file={file} 
            onRemove={onRemove} 
            onSelectPages={onSelectPages}
            showDragHandle={false} 
          />
        ))}
      </div>
    );
  }

  return (
    <DndContext 
      sensors={sensors}
      collisionDetection={closestCenter}
      onDragEnd={handleDragEnd}
    >
      <div className={styles.fileList}>
        <SortableContext 
          items={files.map(f => f.id)}
          strategy={verticalListSortingStrategy}
        >
          {files.map((file) => (
            <SortableItem 
              key={file.id} 
              file={file} 
              onRemove={onRemove} 
              onSelectPages={onSelectPages}
              showDragHandle={showDragHandle} 
            />
          ))}
        </SortableContext>
      </div>
    </DndContext>
  );
}
