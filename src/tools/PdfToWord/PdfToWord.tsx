import { useState } from 'react';
import ToolLayout from '../../components/ToolLayout/ToolLayout';
import FileUploader from '../../components/FileUploader/FileUploader';
import ProcessingLoader from '../../components/ProcessingLoader/ProcessingLoader';
import ToolExplanation from '../../components/ToolExplanation/ToolExplanation';
import DownloadButton from '../../components/DownloadButton/DownloadButton';
import sharedStyles from '../shared/ToolShared.module.css';
import { getDocument, GlobalWorkerOptions } from 'pdfjs-dist';
import { Document, Packer, Paragraph, TextRun } from 'docx';

// Set up pdf.js worker
import pdfWorkerUrl from 'pdfjs-dist/build/pdf.worker.min?url';
GlobalWorkerOptions.workerSrc = pdfWorkerUrl;

export default function PdfToWord() {
  const [file, setFile] = useState<File | null>(null);
  const [extractedPdfText, setExtractedPdfText] = useState<string>('');
  const [docxData, setDocxData] = useState<Uint8Array | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);

  const handleFileSelected = async (files: File[]) => {
    const selectedFile = files[0];
    setFile(selectedFile);
    setIsProcessing(true);

    try {
      const arrayBuffer = await selectedFile.arrayBuffer();
      
      // Parse PDF using pdf.js
      const pdf = await getDocument({ data: arrayBuffer }).promise;
      const numPages = pdf.numPages;
      let fullText = '';
      const docxParagraphs: Paragraph[] = [];

      for (let i = 1; i <= numPages; i++) {
        const page = await pdf.getPage(i);
        const textContent = await page.getTextContent();
        
        let pageText = '';
        let lastY = -1;
        
        // Very basic heuristic to reconstruct paragraphs
        textContent.items.forEach((item: any) => {
          if (lastY !== item.transform[5] && lastY !== -1) {
            pageText += '\n'; // new line if Y coordinate changes significantly
          }
          pageText += item.str;
          lastY = item.transform[5];
        });

        fullText += pageText + '\n\n--- Page Break ---\n\n';

        // Add to docx generator
        const lines = pageText.split('\n');
        lines.forEach(line => {
           if (line.trim() !== '') {
               docxParagraphs.push(new Paragraph({
                  children: [new TextRun(line)],
               }));
           }
        });

        // Add explicit page break for the word processor if not the last page
        if (i < numPages) {
            docxParagraphs.push(new Paragraph({
               pageBreakBefore: true,
               children: [new TextRun("")]
            }));
        }
      }

      setExtractedPdfText(fullText);

      // Generate the actual .docx file
      const doc = new Document({
        sections: [{
          properties: {},
          children: docxParagraphs
        }]
      });

      const blob = await Packer.toBlob(doc);
      const docxArrayBuffer = await blob.arrayBuffer();
      setDocxData(new Uint8Array(docxArrayBuffer));
      
      setIsProcessing(false);
    } catch (e) {
      console.error(e);
      setIsProcessing(false);
      alert("Failed to parse the PDF document.");
    }
  };

  return (
    <ToolLayout title="PDF to Word" description="Safely extract text from PDF to Word (.docx) directly in your browser" icon="📝" color="#2563eb">
      <div className={sharedStyles.container}>
        
        {/* Privacy Marketing Disclaimer */}
        <div style={{ background: 'rgba(239, 68, 68, 0.1)', borderLeft: '4px solid #ef4444', padding: '16px', borderRadius: '0 8px 8px 0', marginBottom: '24px' }}>
          <h4 style={{ margin: '0 0 8px 0', color: '#ef4444', display: 'flex', alignItems: 'center', gap: '8px' }}>
             🛡️ Uncompromised Privacy Notice
          </h4>
          <p style={{ margin: 0, fontSize: '14px', color: 'var(--color-text)', lineHeight: 1.5 }}>
            <strong>Why did the layout change?</strong><br />
            Because a PDF operates on visual drawing coordinates (not paragraphs), we extract your pure text straight into a clean Word document entirely inside your browser.<br /><br />
            Reconstructing complex overlapping images, font margins, and exact tables automatically requires heavy backend servers tracking your words. If you use a tool that perfectly clones a PDF layout, <strong>your document has left your device</strong>. We sacrifice proprietary formats for absolute privacy.
          </p>
        </div>

        {!file ? (
          <FileUploader 
            onFilesSelected={handleFileSelected} 
            accept=".pdf" 
            label="Drop your PDF here to extract text to Word" 
          />
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: 'var(--color-bg-secondary)', padding: '16px', borderRadius: 'var(--radius-md)' }}>
              <div>
                <h3 style={{ margin: '0 0 4px 0', fontSize: '16px' }}>{file.name}</h3>
                <p style={{ margin: 0, fontSize: '13px', color: 'var(--color-text-muted)' }}>Text extracted successfully. Review the raw data below.</p>
              </div>
              <div style={{ display: 'flex', gap: '12px', alignItems: 'center' }}>
                <button 
                  onClick={() => { setFile(null); setExtractedPdfText(''); setDocxData(null); }} 
                  className={sharedStyles.secondaryButton}
                >
                  Change File
                </button>
                {docxData && (
                  <DownloadButton 
                    data={docxData}
                    fileName={file.name.replace(/\.pdf$/i, '') + '.docx'}
                    label="Download .docx"
                  />
                )}
              </div>
            </div>

            {/* Extracted Text Preview */}
            <div style={{ border: '1px solid var(--color-border)', borderRadius: 'var(--radius-lg)', overflow: 'hidden', background: '#f8f9fa' }}>
               <div style={{ padding: '10px 16px', borderBottom: '1px solid var(--color-border)', background: 'var(--color-bg-primary)', fontSize: '13px', fontWeight: 600, color: 'var(--color-text-muted)' }}>
                  Extracted Raw Text Preview
               </div>
               
               <div style={{ padding: '20px', overflowY: 'auto', maxHeight: '500px' }}>
                 <pre style={{ 
                   whiteSpace: 'pre-wrap', 
                   fontFamily: 'monospace', 
                   fontSize: '13px', 
                   color: '#333',
                   background: 'white',
                   padding: '16px',
                   borderRadius: '6px',
                   border: '1px solid #e5e7eb'
                 }}>
                   {extractedPdfText || "Extracting text..."}
                 </pre>
               </div>
            </div>
          </div>
        )}

      </div>
      
      {isProcessing && <ProcessingLoader message="Extracting Text & Generating Word Document..." />}

      <ToolExplanation title="PDF to Word">
        <p><strong>PDF to Word</strong> extracts raw text structures from each page of your PDF and bundles them into a strictly typed <code>.docx</code> Word Document.</p>
        <p>Because it operates locally using JavaScript, the resulting document contains your critical content but sheds proprietary formatting—guaranteeing 100% data privacy since the file never reaches an external cloud API.</p>
      </ToolExplanation>
    </ToolLayout>
  );
}
