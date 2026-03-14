import { useState, useCallback } from 'react';
import ToolLayout from '../../components/ToolLayout/ToolLayout';
import FileUploader from '../../components/FileUploader/FileUploader';
import ProcessingLoader from '../../components/ProcessingLoader/ProcessingLoader';
import ToolExplanation from '../../components/ToolExplanation/ToolExplanation';
import { renderPageToBlob, getPageCount } from '../../utils/renderUtils';
import { downloadBlobGeneric } from '../../utils/fileUtils';
import styles from '../shared/ToolShared.module.css';

interface ConvertedPage {
  blob: Blob;
  url: string;
  name: string;
}

export default function PdfToImages() {
  const [file, setFile] = useState<File | null>(null);
  const [format, setFormat] = useState<'image/png' | 'image/jpeg'>('image/png');
  const [isProcessing, setIsProcessing] = useState(false);
  const [pages, setPages] = useState<ConvertedPage[]>([]);
  const [selectedPages, setSelectedPages] = useState<number[]>([]);
  const [error, setError] = useState<string | null>(null);

  const handleFileSelected = useCallback((files: File[]) => {
    setFile(files[0]);
    setPages([]);
    setSelectedPages([]);
    setError(null);
  }, []);

  const handleConvert = async () => {
    if (!file) return;
    setIsProcessing(true); setError(null);
    try {
      const count = await getPageCount(file);
      const converted: ConvertedPage[] = [];
      for (let i = 1; i <= count; i++) {
        const blob = await renderPageToBlob(file, i, 2.0, format);
        const url = URL.createObjectURL(blob);
        const ext = format === 'image/png' ? 'png' : 'jpg';
        converted.push({ blob, url, name: `page_${i}.${ext}` });
      }
      setPages(converted);
      setSelectedPages(converted.map((_, i) => i));
    } catch (err) { setError(err instanceof Error ? err.message : 'Failed to convert'); }
    finally { setIsProcessing(false); }
  };

  const togglePage = (idx: number) => {
    setSelectedPages(prev => prev.includes(idx) ? prev.filter(i => i !== idx) : [...prev, idx]);
  };

  const handleDownloadSelected = () => {
    selectedPages.forEach(idx => downloadBlobGeneric(pages[idx].blob, pages[idx].name));
  };

  return (
    <ToolLayout title="PDF to Images" description="Convert each PDF page to an image" icon="🖼️" color="#ec4899" error={error}>
      <div className={styles.container}>
        {!file ? (
          <FileUploader onFilesSelected={handleFileSelected} accept=".pdf" label="Drop your PDF to convert to images" />
        ) : (
          <div className={styles.fileSection}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
              <h3 className={styles.sectionTitle}>{file.name}</h3>
              <button 
                onClick={() => { const input = document.createElement('input'); input.type = 'file'; input.accept = '.pdf';  input.onchange = (e) => { const f = (e.target as HTMLInputElement).files; if (f?.length) handleFileSelected(Array.from(f)); }; input.click(); }} 
                style={{ background: 'transparent', border: '1px solid var(--color-border)', borderRadius: '6px', padding: '4px 12px', fontSize: '12px', color: 'var(--color-text-muted)', cursor: 'pointer' }}
              >
                Change File
              </button>
            </div>
            <div className={styles.optionGroup}>
              <label className={styles.optionLabel}>Format:</label>
              <select className={styles.optionInput} value={format} onChange={e => setFormat(e.target.value as 'image/png' | 'image/jpeg')}>
                <option value="image/png">PNG</option>
                <option value="image/jpeg">JPEG</option>
              </select>
            </div>
            <div className={styles.actions}>
              <button className={styles.primaryButton} onClick={handleConvert}>🖼️ Convert to Images</button>
            </div>
          </div>
        )}

        {pages.length > 0 && (
          <div className={styles.resultSection}>
            <h3 className={styles.resultTitle}>✅ Converted {pages.length} pages</h3>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap', marginBottom: '12px' }}>
              <button onClick={() => setSelectedPages(pages.map((_, i) => i))} style={{ background: 'var(--glass-bg)', border: 'var(--glass-border)', borderRadius: '6px', padding: '6px 14px', fontSize: '12px', color: 'var(--color-text-muted)', cursor: 'pointer' }}>☑️ Select All</button>
              <button onClick={() => setSelectedPages([])} style={{ background: 'var(--glass-bg)', border: 'var(--glass-border)', borderRadius: '6px', padding: '6px 14px', fontSize: '12px', color: 'var(--color-text-muted)', cursor: 'pointer' }}>☐ Deselect All</button>
              <span style={{ fontSize: '12px', color: 'var(--color-text-dim)', marginLeft: 'auto' }}>{selectedPages.length} of {pages.length} selected</span>
              <button onClick={handleDownloadSelected} disabled={selectedPages.length === 0} style={{ background: 'linear-gradient(135deg, #22c55e, #16a34a)', color: 'white', border: 'none', borderRadius: '8px', padding: '8px 16px', fontSize: '13px', fontWeight: 600, cursor: selectedPages.length === 0 ? 'not-allowed' : 'pointer', opacity: selectedPages.length === 0 ? 0.5 : 1 }}>
                ⬇️ Download Selected ({selectedPages.length})
              </button>
              <button onClick={() => { const input = document.createElement('input'); input.type = 'file'; input.accept = '.pdf';  input.onchange = (e) => { const f = (e.target as HTMLInputElement).files; if (f?.length) handleFileSelected(Array.from(f)); }; input.click(); }} style={{ background: "transparent", border: "1px solid var(--color-border)", borderRadius: '8px', padding: '8px 16px', color: "var(--color-text)", cursor: 'pointer', fontWeight: 600, fontSize: '13px' }}>Upload New File</button>
            </div>
            <div className={styles.pageGrid}>
              {pages.map((page, i) => {
                const isSelected = selectedPages.includes(i);
                return (
                  <div key={i} onClick={() => togglePage(i)} style={{ cursor: 'pointer', borderRadius: '8px', overflow: 'hidden', border: isSelected ? '2px solid var(--color-accent)' : '2px solid transparent', opacity: isSelected ? 1 : 0.4, filter: isSelected ? 'none' : 'grayscale(0.5)', transition: 'all 0.2s', position: 'relative' }}>
                    <img src={page.url} alt={page.name} style={{ width: '100%', display: 'block' }} />
                    {isSelected && <div style={{ position: 'absolute', top: '6px', right: '6px', width: '22px', height: '22px', background: 'var(--color-accent)', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'white', fontSize: '12px', fontWeight: 700, boxShadow: '0 2px 8px rgba(99,102,241,0.4)' }}>✓</div>}
                    <div style={{ padding: '4px 6px', fontSize: '11px', color: 'var(--color-text-muted)', background: 'var(--glass-bg)', textAlign: 'center' }}>{page.name}</div>
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </div>
      {isProcessing && <ProcessingLoader message="Converting pages to images..." />}
      <ToolExplanation title="PDF to Images">
        <p><strong>PDF to Images</strong> converts each page of your PDF into a high-resolution image file (PNG or JPEG).</p>
        <p>Select individual images to download or use "Download Selected" to batch-download. This is perfect for sharing specific pages on social media, embedding in presentations, or extracting visual content from documents.</p>
      </ToolExplanation>
    </ToolLayout>
  );
}
