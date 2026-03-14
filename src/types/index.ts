import type { ComponentType, LazyExoticComponent } from 'react';

export interface ToolConfig {
  id: string;
  name: string;
  description: string;
  route: string;
  icon: string;
  color: string;
  category: ToolCategory;
  component: LazyExoticComponent<ComponentType>;
  acceptMultiple?: boolean;
  acceptTypes?: string[];
}

export type ToolCategory = 'organize' | 'convert' | 'edit' | 'security';

export interface PdfFile {
  id: string;
  file: File;
  name: string;
  size: number;
  pageCount: number;
  thumbnail?: string;
}

export interface PageInfo {
  pageNumber: number;
  rotation: number;
  selected: boolean;
  thumbnail?: string;
}

export interface ProcessingState {
  isProcessing: boolean;
  progress: number;
  message: string;
}

export interface FileStore {
  files: PdfFile[];
  pages: PageInfo[];
  processedFile: Uint8Array | null;
  processedFileName: string;
  processing: ProcessingState;
  error: string | null;

  addFiles: (files: File[]) => Promise<void>;
  removeFile: (id: string) => void;
  reorderFiles: (fromIndex: number, toIndex: number) => void;
  setPages: (pages: PageInfo[]) => void;
  togglePageSelection: (pageNumber: number) => void;
  setPageRotation: (pageNumber: number, rotation: number) => void;
  setProcessedFile: (data: Uint8Array | null, fileName?: string) => void;
  setProcessing: (state: Partial<ProcessingState>) => void;
  setError: (error: string | null) => void;
  reset: () => void;
}

export interface WorkerMessage {
  type: string;
  payload: unknown;
}

export interface WorkerResponse {
  type: 'result' | 'progress' | 'error';
  payload: unknown;
}
