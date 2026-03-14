import { useState, useCallback } from 'react';
import ToolLayout from '../../components/ToolLayout/ToolLayout';
import FileUploader from '../../components/FileUploader/FileUploader';
import ProcessingLoader from '../../components/ProcessingLoader/ProcessingLoader';
import ToolExplanation from '../../components/ToolExplanation/ToolExplanation';
import { renderPageToBlob, getPageCount } from '../../utils/renderUtils';
import { downloadBlobGeneric } from '../../utils/fileUtils';
import styles from '../shared/ToolShared.module.css';

interface ExtractedImage {
  blob: Blob;
  name: string;
  url: string;
}

export default function ExtractImages() {
  const [file, setFile] = useState<File | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [images, setImages] = useState<ExtractedImage[]>([]);
  const [selectedImages, setSelectedImages] = useState<number[]>([]);
  const [error, setError] = useState<string | null>(null);

  const handleFileSelected = useCallback((files: File[]) => {
    setFile(files[0]);
    setImages([]);
    setSelectedImages([]);
    setError(null);
  }, []);

  const handleExtract = async () => {
    if (!file) return;
    setIsProcessing(true);
    setError(null);
    try {
      const pages = await getPageCount(file);
      const extracted: ExtractedImage[] = [];
      for (let i = 1; i <= pages; i++) {
        const blob = await renderPageToBlob(file, i, 2.0, 'image/png');
        const url = URL.createObjectURL(blob);
        extracted.push({ blob, name: `page_${i}.png`, url });
      }
      setImages(extracted);
      setSelectedImages(extracted.map((_, i) => i)); // select all by default
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to extract images');
    } finally { setIsProcessing(false); }
  };

  const toggleImage = (idx: number) => {
    setSelectedImages(prev => prev.includes(idx) ? prev.filter(i => i !== idx) : [...prev, idx]);
  };

  const selectAll = () => setSelectedImages(images.map((_, i) => i));
  const deselectAll = () => setSelectedImages([]);

  const handleDownloadSelected = () => {
    selectedImages.forEach(idx => downloadBlobGeneric(images[idx].blob, images[idx].name));
  };

  return (
    <ToolLayout title="Extract Images" description="Extract all images from a PDF" icon="🖼️" color="#d946ef" error={error}>
      <div className={styles.container}>
        {!file ? (
          <FileUploader onFilesSelected={handleFileSelected} accept=".pdf" label="Drop your PDF to extract images" />
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
            <div className={styles.actions}>
              <button className={styles.primaryButton} onClick={handleExtract} disabled={isProcessing}>🖼️ Extract Images</button>
            </div>
          </div>
        )}

        {images.length > 0 && (
          <div className={styles.resultSection}>
            <h3 className={styles.resultTitle}>✅ Extracted {images.length} images</h3>

            {/* Selection toolbar */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap', marginBottom: '12px' }}>
              <button onClick={selectAll} style={{ background: 'var(--glass-bg)', border: 'var(--glass-border)', borderRadius: '6px', padding: '6px 14px', fontSize: '12px', color: 'var(--color-text-muted)', cursor: 'pointer' }}>☑️ Select All</button>
              <button onClick={deselectAll} style={{ background: 'var(--glass-bg)', border: 'var(--glass-border)', borderRadius: '6px', padding: '6px 14px', fontSize: '12px', color: 'var(--color-text-muted)', cursor: 'pointer' }}>☐ Deselect All</button>
              <span style={{ fontSize: '12px', color: 'var(--color-text-dim)', marginLeft: 'auto' }}>{selectedImages.length} of {images.length} selected</span>
              <button
                onClick={handleDownloadSelected}
                disabled={selectedImages.length === 0}
                style={{
                  background: 'linear-gradient(135deg, #22c55e, #16a34a)',
                  color: 'white', border: 'none', borderRadius: '8px', padding: '8px 16px',
                  fontSize: '13px', fontWeight: 600, cursor: selectedImages.length === 0 ? 'not-allowed' : 'pointer',
                  opacity: selectedImages.length === 0 ? 0.5 : 1,
                }}
              >
                ⬇️ Download Selected ({selectedImages.length})
              </button>
              <button onClick={() => { const input = document.createElement('input'); input.type = 'file'; input.accept = '.pdf';  input.onchange = (e) => { const f = (e.target as HTMLInputElement).files; if (f?.length) handleFileSelected(Array.from(f)); }; input.click(); }} style={{ background: "transparent", border: "1px solid var(--color-border)", borderRadius: '8px', padding: '8px 16px', color: "var(--color-text)", cursor: 'pointer', fontWeight: 600, fontSize: '13px' }}>Upload New File</button>
            </div>

            <div className={styles.pageGrid}>
              {images.map((img, i) => {
                const isSelected = selectedImages.includes(i);
                return (
                  <div
                    key={i}
                    onClick={() => toggleImage(i)}
                    style={{
                      cursor: 'pointer',
                      borderRadius: '8px',
                      overflow: 'hidden',
                      border: isSelected ? '2px solid var(--color-accent)' : '2px solid transparent',
                      opacity: isSelected ? 1 : 0.4,
                      filter: isSelected ? 'none' : 'grayscale(0.5)',
                      transition: 'all 0.2s ease',
                      position: 'relative',
                    }}
                  >
                    <img src={img.url} alt={img.name} style={{ width: '100%', display: 'block' }} />
                    {isSelected && (
                      <div style={{
                        position: 'absolute', top: '6px', right: '6px',
                        width: '22px', height: '22px', background: 'var(--color-accent)',
                        borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center',
                        color: 'white', fontSize: '12px', fontWeight: 700,
                        boxShadow: '0 2px 8px rgba(99,102,241,0.4)',
                      }}>✓</div>
                    )}
                    <div style={{ padding: '6px 8px', fontSize: '11px', color: 'var(--color-text-muted)', background: 'var(--glass-bg)', textAlign: 'center' }}>{img.name}</div>
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </div>
      {isProcessing && <ProcessingLoader message="Extracting images from PDF..." />}
      <ToolExplanation title="Extract Images">
        <p><strong>Extract Images</strong> converts each page of your PDF into a high-resolution PNG image that you can download.</p>
        <p>Select specific images or use "Select All" / "Deselect All" to batch-download. This is useful for extracting charts, diagrams, or photos from PDF documents for use in presentations or other projects.</p>
      </ToolExplanation>
    </ToolLayout>
  );
}
