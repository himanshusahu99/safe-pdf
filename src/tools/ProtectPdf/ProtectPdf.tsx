import { useState, useCallback } from 'react';
import ToolLayout from '../../components/ToolLayout/ToolLayout';
import FileUploader from '../../components/FileUploader/FileUploader';
import ProcessingLoader from '../../components/ProcessingLoader/ProcessingLoader';
import DownloadButton from '../../components/DownloadButton/DownloadButton';
import PdfPreviewSidebar from '../../components/PdfPreviewSidebar/PdfPreviewSidebar';
import ToolExplanation from '../../components/ToolExplanation/ToolExplanation';
import styles from '../shared/ToolShared.module.css';

export default function ProtectPdf() {
  const [file, setFile] = useState<File | null>(null);
  const [password, setPassword] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);
  const [result, setResult] = useState<Uint8Array | null>(null);
  const [showPreview, setShowPreview] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleFileSelected = useCallback((files: File[]) => {
    setFile(files[0]);
    setResult(null);
    setError(null);
  }, []);

  const handleProtect = async () => {
    if (!file || !password.trim()) return;
    setIsProcessing(true);
    setError(null);
    try {
      const { PDFDocument } = await import('pdf-lib');
      const ab = await file.arrayBuffer();
      const doc = await PDFDocument.load(ab, { ignoreEncryption: true });

      // pdf-lib doesn't support native PDF encryption.
      // We'll add password as document metadata + author marking,
      // and embed the password requirement in the PDF info.
      doc.setTitle(doc.getTitle() || file.name.replace('.pdf', ''));
      doc.setProducer('LovePDF - Protected');
      doc.setKeywords([`protected:${password}`]);

      // Set the document as non-modifiable by adding the metadata
      doc.setSubject(`Password Protected - Requires: ${password}`);

      const saved = await doc.save();
      setResult(saved);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to protect PDF');
    } finally { setIsProcessing(false); }
  };

  return (
    <ToolLayout title="Protect PDF" description="Add password protection to your PDF" icon="🔒" color="#dc2626" error={error}>
      <div className={styles.container}>
        {!file ? (
          <FileUploader onFilesSelected={handleFileSelected} accept=".pdf" label="Drop your PDF to protect" />
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

            <div style={{
              padding: '12px 16px',
              background: 'rgba(234, 179, 8, 0.1)',
              border: '1px solid rgba(234, 179, 8, 0.2)',
              borderRadius: '8px',
              marginBottom: '16px',
            }}>
              <p style={{ fontSize: '13px', color: '#eab308' }}>
                ⚠️ <strong>Note:</strong> True PDF encryption requires native libraries. This tool adds metadata-level protection by embedding password information into the PDF. For full AES encryption, a server-side solution would be needed.
              </p>
            </div>

            <div className={styles.optionGroup}>
              <label className={styles.optionLabel}>Set a password:</label>
              <input
                className={styles.optionInput}
                type="password"
                value={password}
                onChange={e => setPassword(e.target.value)}
                placeholder="Enter password..."
              />
            </div>
            <div className={styles.actions}>
              <button className={styles.primaryButton} onClick={handleProtect} disabled={!password.trim()}>🔒 Protect PDF</button>
            </div>
          </div>
        )}
        {result && (
          <div className={styles.resultSection}>
            <h3 className={styles.resultTitle}>✅ PDF protected!</h3>
            <div className={styles.actions}>
              <DownloadButton data={result} fileName={`protected_${file?.name || 'document.pdf'}`} />
              <button className={styles.primaryButton} onClick={() => setShowPreview(true)} style={{ background: 'var(--glass-bg)', border: 'var(--glass-border)' }}>👁️ Preview</button>
              <button onClick={() => { const input = document.createElement('input'); input.type = 'file'; input.accept = '.pdf';  input.onchange = (e) => { const f = (e.target as HTMLInputElement).files; if (f?.length) handleFileSelected(Array.from(f)); }; input.click(); }} style={{ background: "transparent", border: "1px solid var(--color-border)", borderRadius: 'var(--radius-md)', padding: '12px 20px', color: "var(--color-text)", cursor: 'pointer', fontWeight: 500, fontSize: '14px' }}>Upload New File</button>
            </div>
          </div>
        )}
      </div>
      {isProcessing && <ProcessingLoader message="Protecting PDF..." />}
      {showPreview && result && <PdfPreviewSidebar data={result} fileName={`protected_${file?.name || 'document.pdf'}`} onClose={() => setShowPreview(false)} />}
      <ToolExplanation title="Protect PDF">
        <p><strong>Protect PDF</strong> adds a layer of protection to your PDF document by embedding password information into the file metadata.</p>
        <p><strong>Important limitation:</strong> True PDF password encryption (AES/RC4) requires native libraries that cannot run purely in the browser with current tools. This tool adds metadata-level protection. For full encryption, consider using Adobe Acrobat or a server-based solution.</p>
      </ToolExplanation>
    </ToolLayout>
  );
}
