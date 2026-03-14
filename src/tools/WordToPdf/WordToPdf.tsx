import { useState, useRef } from 'react';
import ToolLayout from '../../components/ToolLayout/ToolLayout';
import FileUploader from '../../components/FileUploader/FileUploader';
import ProcessingLoader from '../../components/ProcessingLoader/ProcessingLoader';
import ToolExplanation from '../../components/ToolExplanation/ToolExplanation';
import sharedStyles from '../shared/ToolShared.module.css';
import mammoth from 'mammoth';
// @ts-ignore
import html2pdf from 'html2pdf.js';

export default function WordToPdf() {
  const [file, setFile] = useState<File | null>(null);
  const [htmlContent, setHtmlContent] = useState<string>('');
  const [isProcessing, setIsProcessing] = useState(false);
  const previewRef = useRef<HTMLDivElement>(null);

  const handleFileSelected = async (files: File[]) => {
    const selectedFile = files[0];
    setFile(selectedFile);
    setIsProcessing(true);

    try {
      const arrayBuffer = await selectedFile.arrayBuffer();
      // Mammoth extracts text and basic formatting perfectly in-browser
      const result = await mammoth.convertToHtml({ arrayBuffer });
      setHtmlContent(result.value);
      setIsProcessing(false);
    } catch (e) {
      console.error(e);
      setIsProcessing(false);
      alert("Failed to parse the Word document.");
    }
  };

  const handleExportPdf = () => {
    if (!previewRef.current || !file) return;
    setIsProcessing(true);

    const element = previewRef.current;
    
    const opt = {
      margin:       [20, 20, 20, 20] as [number, number, number, number],
      filename:     file.name.replace(/\.(docx|doc)$/i, '') + '.pdf',
      image:        { type: 'jpeg' as const, quality: 0.98 },
      html2canvas:  { scale: 2, useCORS: true, letterRendering: true },
      jsPDF:        { unit: 'mm', format: 'a4', orientation: 'portrait' as const }
    };

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
    <ToolLayout title="Word to PDF" description="Instantly convert Word Documents to PDF right in your browser" icon="📝" color="#2563eb">
      <div className={sharedStyles.container}>
        
        {/* Privacy Marketing Disclaimer */}
        <div style={{ background: 'rgba(239, 68, 68, 0.1)', borderLeft: '4px solid #ef4444', padding: '16px', borderRadius: '0 8px 8px 0', marginBottom: '24px' }}>
          <h4 style={{ margin: '0 0 8px 0', color: '#ef4444', display: 'flex', alignItems: 'center', gap: '8px' }}>
             🛡️ Uncompromised Privacy Notice
          </h4>
          <p style={{ margin: 0, fontSize: '14px', color: 'var(--color-text)', lineHeight: 1.5 }}>
            <strong>Why might the formatting look a bit different?</strong><br />
            We convert your Word Document entirely inside your browser. We <strong>never</strong> upload your file to a server.<br /><br />
            If another website perfectly recreates complex Word formatting, it means they are secretly sending your private document to corporate backend servers. We sacrifice complex margins to guarantee your data never leaves your device.
          </p>
        </div>

        {!file ? (
          <FileUploader 
            onFilesSelected={handleFileSelected} 
            accept=".docx" 
            label="Drop your Word Document (.docx) here" 
          />
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: 'var(--color-bg-secondary)', padding: '16px', borderRadius: 'var(--radius-md)' }}>
              <div>
                <h3 style={{ margin: '0 0 4px 0', fontSize: '16px' }}>{file.name}</h3>
                <p style={{ margin: 0, fontSize: '13px', color: 'var(--color-text-muted)' }}>Ready for conversion. Review the content preview below.</p>
              </div>
              <div style={{ display: 'flex', gap: '12px', alignItems: 'center' }}>
                <button 
                  onClick={() => { setFile(null); setHtmlContent(''); }} 
                  className={sharedStyles.secondaryButton}
                >
                  Change File
                </button>
                <button 
                  className={sharedStyles.primaryButton} 
                  onClick={handleExportPdf}
                  style={{ background: '#2563eb', border: 'none', color: 'white' }}
                >
                  📥 Export to PDF
                </button>
              </div>
            </div>

            {/* Document Preview */}
            <div style={{ border: '1px solid var(--color-border)', borderRadius: 'var(--radius-lg)', overflow: 'hidden', background: '#f8f9fa' }}>
               <div style={{ padding: '10px 16px', borderBottom: '1px solid var(--color-border)', background: 'var(--color-bg-primary)', fontSize: '13px', fontWeight: 600, color: 'var(--color-text-muted)' }}>
                  Document Content Preview
               </div>
               
               {/* This wrapper visually represents a piece of paper and is passed to html2pdf */}
               <div style={{ padding: '40px', overflowY: 'auto', maxHeight: '500px', display: 'flex', justifyContent: 'center' }}>
                  <div 
                    ref={previewRef} 
                    style={{ 
                      background: 'white', 
                      color: 'black',
                      padding: '40px', 
                      width: '100%', 
                      maxWidth: '800px', 
                      boxShadow: '0 4px 6px rgba(0,0,0,0.05)',
                      fontFamily: 'Arial, sans-serif',
                      lineHeight: 1.6
                    }}
                    dangerouslySetInnerHTML={{ __html: htmlContent }} 
                  />
               </div>
            </div>
          </div>
        )}

      </div>
      
      {isProcessing && <ProcessingLoader message="Processing Document..." />}

      <ToolExplanation title="Word to PDF">
        <p><strong>Word to PDF</strong> reads your <code>.docx</code> file and extracts paragraphs, headings, lists, and images directly in your browser.</p>
        <p>Because it operates locally using JavaScript, the resulting PDF is focused on preserving your content rather than exact proprietary Microsoft Word page layouts—guaranteeing 100% data privacy.</p>
      </ToolExplanation>
    </ToolLayout>
  );
}
