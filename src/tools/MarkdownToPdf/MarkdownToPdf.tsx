import { useState, useRef, useEffect } from 'react';
import ToolLayout from '../../components/ToolLayout/ToolLayout';
import FileUploader from '../../components/FileUploader/FileUploader';
import ProcessingLoader from '../../components/ProcessingLoader/ProcessingLoader';
import ToolExplanation from '../../components/ToolExplanation/ToolExplanation';
import sharedStyles from '../shared/ToolShared.module.css';
import styles from './MarkdownToPdf.module.css';
import Editor from '@monaco-editor/react';
import { marked } from 'marked';
import DOMPurify from 'dompurify';
// @ts-ignore - html2pdf doesn't have great TS types
import html2pdf from 'html2pdf.js';

const INITIAL_MD = `# Welcome to love-pdf Markdown Editor

Write your **Markdown** here! It renders instantly on the right.

### Features:
- Code highlighting
- Tables
- Instant PDF Export

\`\`\`javascript
// Some code here
console.log("Hello PDF");
\`\`\`

> A clean, client-side editor that turns text into beautiful documents.
`;

export default function MarkdownToPdf() {
  const [markdown, setMarkdown] = useState<string>(INITIAL_MD);
  const [htmlContent, setHtmlContent] = useState<string>('');
  const [isProcessing, setIsProcessing] = useState(false);
  const [hasStarted, setHasStarted] = useState(false);
  const [fileName, setFileName] = useState('document.md');
  const previewRef = useRef<HTMLDivElement>(null);

  // Parse Markdown to HTML cleanly
  useEffect(() => {
    try {
      const rawHtml = marked.parse(markdown) as string;
      const cleanHtml = DOMPurify.sanitize(rawHtml);
      setHtmlContent(cleanHtml);
    } catch (e) {
      console.error("Failed to parse markdown", e);
    }
  }, [markdown]);

  const handleFileSelected = async (files: File[]) => {
    const file = files[0];
    setFileName(file.name);
    try {
      const text = await file.text();
      setMarkdown(text);
      setHasStarted(true);
    } catch (e) {
      console.error(e);
      alert("Failed to read the file.");
    }
  };

  const startBlank = () => {
    setMarkdown(INITIAL_MD);
    setFileName('untitled.md');
    setHasStarted(true);
  };

  const handleExportPdf = () => {
    if (!previewRef.current) return;
    setIsProcessing(true);

    const element = previewRef.current;
    
    // Configure html2pdf options
    const opt = {
      margin:       [15, 15, 15, 15] as [number, number, number, number], // Top, Left, Bottom, Right margins in mm
      filename:     fileName.replace(/\.(md|txt)$/i, '') + '.pdf',
      image:        { type: 'jpeg' as const, quality: 0.98 },
      html2canvas:  { scale: 2, useCORS: true, letterRendering: true },
      jsPDF:        { unit: 'mm', format: 'a4', orientation: 'portrait' as const }
    };

    // Generate PDF and automatically download to client
    html2pdf().set(opt).from(element).save()
      .then(() => {
        setIsProcessing(false);
      })
      .catch((err: any) => {
        console.error("PDF generation failed", err);
        setIsProcessing(false);
        alert("Failed to generate PDF.");
      });
  };

  return (
    <ToolLayout title="Markdown to PDF" description="Write Markdown and instantly export to a beautiful PDF" icon="📝" color="#8b5cf6">
      <div className={sharedStyles.container}>
        
        {!hasStarted ? (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
            <FileUploader 
              onFilesSelected={handleFileSelected} 
              accept=".md,.txt" 
              label="Drop your Markdown (.md) or Text file here" 
            />
            <div style={{ textAlign: 'center' }}>
              <span style={{ color: 'var(--color-text-muted)', margin: '0 16px' }}>OR</span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'center' }}>
              <button 
                onClick={startBlank}
                style={{
                  background: 'var(--glass-bg)',
                  border: 'var(--glass-border)',
                  color: 'var(--color-text)',
                  padding: '12px 24px',
                  borderRadius: '12px',
                  fontSize: '15px',
                  fontWeight: 600,
                  cursor: 'pointer',
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '8px'
                }}
              >
                ✍️ Start Writing Blank Document
              </button>
            </div>
          </div>
        ) : (
          <div className={styles.container}>
            {/* Toolbar */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                 <h3 className={sharedStyles.sectionTitle} style={{ margin: 0 }}>Editing: {fileName}</h3>
                 <button 
                   onClick={() => setHasStarted(false)} 
                   style={{ background: 'transparent', border: '1px solid var(--color-border)', borderRadius: '6px', padding: '4px 12px', fontSize: '12px', color: 'var(--color-text-muted)', cursor: 'pointer' }}
                 >
                   Discard
                 </button>
              </div>
              <button 
                className={sharedStyles.primaryButton} 
                onClick={handleExportPdf}
                disabled={isProcessing || !markdown.trim()}
              >
                📥 Export to PDF
              </button>
            </div>

            {/* Split Pane Editor */}
            <div className={styles.editorSection}>
               {/* Left: Monaco Editor */}
               <div className={styles.editorPane}>
                 <div className={styles.paneHeader}>
                    Markdown Source
                 </div>
                 <div style={{ flex: 1, paddingTop: '16px' }}>
                    <Editor
                       height="100%"
                       defaultLanguage="markdown"
                       theme="vs-dark"
                       value={markdown}
                       onChange={(value) => setMarkdown(value || '')}
                       options={{
                          minimap: { enabled: false },
                          wordWrap: 'on',
                          padding: { top: 16 },
                          fontSize: 14,
                          lineNumbers: 'off',
                          scrollBeyondLastLine: false
                       }}
                    />
                 </div>
               </div>

               {/* Right: Live Preview */}
               <div className={styles.previewPane}>
                 <div className={styles.paneHeader} style={{ background: '#f8f9fa', color: '#6c757d', borderBottom: '1px solid #dee2e6' }}>
                    Live PDF Preview
                 </div>
                 {/* This wrapper is passed to html2pdf */}
                 <div className={styles.previewContent}>
                    <div 
                      ref={previewRef} 
                      className={styles.markdownBody}
                      dangerouslySetInnerHTML={{ __html: htmlContent }} 
                    />
                 </div>
               </div>
            </div>
          </div>
        )}

      </div>
      
      {isProcessing && <ProcessingLoader message="Generating PDF Document..." />}

      <ToolExplanation title="Markdown to PDF">
        <p><strong>Markdown to PDF</strong> allows you to write or paste Markdown text and instantly convert it into a beautifully styled PDF.</p>
        <p>Your data never leaves your device: the Markdown parsing, HTML rendering, and PDF generation are all executed locally in your browser leveraging the <code>marked</code> and <code>html2pdf.js</code> libraries.</p>
      </ToolExplanation>
    </ToolLayout>
  );
}
