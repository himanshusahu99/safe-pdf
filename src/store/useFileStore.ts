import { create } from 'zustand';
import type { FileStore, PdfFile, PageInfo, ProcessingState } from '../types';

const generateId = () => Math.random().toString(36).substring(2, 11);

const initialProcessing: ProcessingState = {
  isProcessing: false,
  progress: 0,
  message: '',
};

export const useFileStore = create<FileStore>((set, get) => ({
  files: [],
  pages: [],
  processedFile: null,
  processedFileName: '',
  processing: initialProcessing,
  error: null,

  addFiles: async (newFiles: File[]) => {
    const pdfFiles: PdfFile[] = newFiles.map(file => ({
      id: generateId(),
      file,
      name: file.name,
      size: file.size,
      pageCount: 0,
    }));

    set(state => ({
      files: [...state.files, ...pdfFiles],
      error: null,
    }));

    // Load page counts asynchronously
    for (const pdfFile of pdfFiles) {
      try {
        const arrayBuffer = await pdfFile.file.arrayBuffer();
        const { PDFDocument } = await import('pdf-lib');
        const doc = await PDFDocument.load(arrayBuffer, { ignoreEncryption: true });
        const pageCount = doc.getPageCount();
        set(state => ({
          files: state.files.map(f =>
            f.id === pdfFile.id ? { ...f, pageCount } : f
          ),
        }));
      } catch {
        // If can't read page count, keep 0
      }
    }
  },

  removeFile: (id: string) => {
    set(state => ({
      files: state.files.filter(f => f.id !== id),
    }));
  },

  reorderFiles: (fromIndex: number, toIndex: number) => {
    const { files } = get();
    const updated = [...files];
    const [moved] = updated.splice(fromIndex, 1);
    updated.splice(toIndex, 0, moved);
    set({ files: updated });
  },

  setPages: (pages: PageInfo[]) => set({ pages }),

  togglePageSelection: (pageNumber: number) => {
    set(state => ({
      pages: state.pages.map(p =>
        p.pageNumber === pageNumber ? { ...p, selected: !p.selected } : p
      ),
    }));
  },

  setPageRotation: (pageNumber: number, rotation: number) => {
    set(state => ({
      pages: state.pages.map(p =>
        p.pageNumber === pageNumber ? { ...p, rotation } : p
      ),
    }));
  },

  setProcessedFile: (data: Uint8Array | null, fileName = 'processed.pdf') => {
    set({ processedFile: data, processedFileName: fileName });
  },

  setProcessing: (state: Partial<ProcessingState>) => {
    set(prev => ({
      processing: { ...prev.processing, ...state },
    }));
  },

  setError: (error: string | null) => set({ error }),

  reset: () => {
    set({
      files: [],
      pages: [],
      processedFile: null,
      processedFileName: '',
      processing: initialProcessing,
      error: null,
    });
  },
}));
