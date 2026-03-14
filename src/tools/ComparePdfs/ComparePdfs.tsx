import { useState, useCallback } from 'react';
import ToolLayout from '../../components/ToolLayout/ToolLayout';
import FileUploader from '../../components/FileUploader/FileUploader';
import ProcessingLoader from '../../components/ProcessingLoader/ProcessingLoader';
import ToolExplanation from '../../components/ToolExplanation/ToolExplanation';
import { renderAllPages } from '../../utils/renderUtils';
import { formatFileSize } from '../../utils/fileUtils';
import styles from '../shared/ToolShared.module.css';
import * as pdfjsLib from 'pdfjs-dist';
import { DiffEditor } from '@monaco-editor/react';

type ViewMode = 'visual' | 'text';

export default function ComparePdfs() {
  const [fileA, setFileA] = useState<File | null>(null);
  const [fileB, setFileB] = useState<File | null>(null);
  const [viewMode, setViewMode] = useState<ViewMode>('visual');
  const [isProcessing, setIsProcessing] = useState(false);
  const [pagesA, setPagesA] = useState<string[]>([]);
  const [pagesB, setPagesB] = useState<string[]>([]);
  const [textA, setTextA] = useState('');
  const [textB, setTextB] = useState('');
  const [error, setError] = useState<string | null>(null);

  const handleFileA = useCallback((files: File[]) => {
    setFileA(files[0]);
    setPagesA([]);
    setTextA('');
    setError(null);
  }, []);

  const handleFileB = useCallback((files: File[]) => {
    setFileB(files[0]);
    setPagesB([]);
    setTextB('');
    setError(null);
  }, []);

  const extractText = async (file: File): Promise<string> => {
    const ab = await file.arrayBuffer();
    const pdf = await pdfjsLib.getDocument({ data: ab }).promise;
    const texts: string[] = [];
    for (let i = 1; i <= pdf.numPages; i++) {
      const page = await pdf.getPage(i);
      const content = await page.getTextContent();
      const pageText = content.items.map((item: any) => item.str).join(' ');
      texts.push(`--- Page ${i} ---\n${pageText}`);
    }
    pdf.destroy();
    return texts.join('\n\n');
  };

  const handleCompare = async () => {
    if (!fileA || !fileB) return;
    setIsProcessing(true);
    setError(null);
    try {
      if (viewMode === 'visual') {
        const [a, b] = await Promise.all([renderAllPages(fileA, 0.5), renderAllPages(fileB, 0.5)]);
        setPagesA(a);
        setPagesB(b);
      } else {
        const [a, b] = await Promise.all([extractText(fileA), extractText(fileB)]);
        setTextA(a);
        setTextB(b);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to compare');
    } finally { setIsProcessing(false); }
  };

  return (
    <ToolLayout title="Compare PDFs" description="Compare two PDF files side by side" icon="🔍" color="#0891b2" error={error}>
      <div className={styles.container}>
        {/* File selection cards */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
          <FileCard label="PDF A" file={fileA} onSelect={handleFileA} />
          <FileCard label="PDF B" file={fileB} onSelect={handleFileB} />
        </div>

        {fileA && fileB && (
          <>
            {/* View mode tabs */}
            <div style={{ display: 'flex', gap: '2px', background: 'var(--glass-bg)', borderRadius: '8px', padding: '3px', width: 'fit-content' }}>
              <button
                onClick={() => setViewMode('visual')}
                style={{
                  padding: '8px 18px', borderRadius: '6px', fontSize: '13px', fontWeight: 500, cursor: 'pointer',
                  background: viewMode === 'visual' ? 'var(--color-accent)' : 'transparent',
                  color: viewMode === 'visual' ? 'white' : 'var(--color-text-muted)',
                  border: 'none',
                }}
              >
                🖼️ Visual Compare
              </button>
              <button
                onClick={() => setViewMode('text')}
                style={{
                  padding: '8px 18px', borderRadius: '6px', fontSize: '13px', fontWeight: 500, cursor: 'pointer',
                  background: viewMode === 'text' ? 'var(--color-accent)' : 'transparent',
                  color: viewMode === 'text' ? 'white' : 'var(--color-text-muted)',
                  border: 'none',
                }}
              >
                📄 Text Diff
              </button>
            </div>

            <div className={styles.actions}>
              <button className={styles.primaryButton} onClick={handleCompare}>🔍 Compare</button>
              <button onClick={() => { setFileA(null); setFileB(null); setPagesA([]); setPagesB([]); setTextA(''); setTextB(''); setError(null); }} style={{ background: "transparent", border: "1px solid var(--color-border)", borderRadius: 'var(--radius-md)', padding: '14px 28px', color: "var(--color-text)", cursor: 'pointer', fontWeight: 600, fontSize: '14px' }}>Compare New Files</button>
            </div>
          </>
        )}

        {/* Visual comparison */}
        {viewMode === 'visual' && pagesA.length > 0 && pagesB.length > 0 && (
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
            <div>
              <h3 className={styles.sectionTitle}>PDF A</h3>
              <div className={styles.pageGrid}>
                {pagesA.map((src, i) => <img key={i} src={src} alt={`A-${i + 1}`} style={{ width: '100%', borderRadius: '8px', border: '1px solid var(--color-border)' }} />)}
              </div>
            </div>
            <div>
              <h3 className={styles.sectionTitle}>PDF B</h3>
              <div className={styles.pageGrid}>
                {pagesB.map((src, i) => <img key={i} src={src} alt={`B-${i + 1}`} style={{ width: '100%', borderRadius: '8px', border: '1px solid var(--color-border)' }} />)}
              </div>
            </div>
          </div>
        )}

        {/* Text diff comparison */}
        {viewMode === 'text' && textA && textB && (
          <div style={{ borderRadius: '8px', overflow: 'hidden', border: '1px solid var(--color-border)' }}>
            <DiffEditor
              height="500px"
              original={textA}
              modified={textB}
              language="text"
              theme="vs-dark"
              options={{
                readOnly: true,
                minimap: { enabled: false },
                lineNumbers: 'on',
                renderSideBySide: true,
                wordWrap: 'on',
                formatOnPaste: true,
                wrappingIndent: 'indent',
                fontSize: 13,
                originalEditable: false
              }}
            />
          </div>
        )}
      </div>
      {isProcessing && <ProcessingLoader message="Comparing PDFs..." />}
      <ToolExplanation title="Compare PDFs">
        <p><strong>Compare PDFs</strong> lets you view two PDF documents side by side to spot differences.</p>
        <p><strong>Visual Compare</strong> renders each page as an image for a quick visual comparison. <strong>Text Diff</strong> extracts all text from both PDFs and shows a detailed diff view using Monaco Editor, highlighting additions, deletions, and changes — similar to how code diffs work in Git.</p>
      </ToolExplanation>
    </ToolLayout>
  );
}

// File selection card component
function FileCard({ label, file, onSelect }: { label: string; file: File | null; onSelect: (files: File[]) => void }) {
  return (
    <div style={{
      background: 'var(--glass-bg)',
      border: 'var(--glass-border)',
      borderRadius: '12px',
      padding: '16px',
      minHeight: '120px',
    }}>
      <h3 className={styles.sectionTitle}>{label}</h3>
      {!file ? (
        <FileUploader onFilesSelected={onSelect} accept=".pdf" label={`Drop ${label}`} />
      ) : (
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <div style={{
            width: '40px', height: '40px', borderRadius: '8px',
            background: 'rgba(99, 102, 241, 0.15)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontSize: '18px',
          }}>
            📄
          </div>
          <div style={{ flex: 1 }}>
            <p style={{ fontSize: '14px', fontWeight: 500, color: 'var(--color-text)' }}>{file.name}</p>
            <p style={{ fontSize: '12px', color: 'var(--color-text-dim)' }}>{formatFileSize(file.size)}</p>
          </div>
          <button
            onClick={() => {
              const input = document.createElement('input');
              input.type = 'file';
              input.accept = '.pdf';
              input.onchange = e => {
                const f = (e.target as HTMLInputElement).files;
                if (f?.length) onSelect(Array.from(f));
              };
              input.click();
            }}
            style={{
              background: 'var(--glass-bg)', border: 'var(--glass-border)',
              borderRadius: '6px', padding: '6px 12px', fontSize: '12px',
              color: 'var(--color-text-muted)', cursor: 'pointer',
            }}
          >
            Change
          </button>
        </div>
      )}
    </div>
  );
}
