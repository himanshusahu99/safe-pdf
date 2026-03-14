import { useState, useRef } from 'react';
import ToolLayout from '../../components/ToolLayout/ToolLayout';
import FileUploader from '../../components/FileUploader/FileUploader';
import ProcessingLoader from '../../components/ProcessingLoader/ProcessingLoader';
import ToolExplanation from '../../components/ToolExplanation/ToolExplanation';
import sharedStyles from '../shared/ToolShared.module.css';
import * as XLSX from 'xlsx';
// @ts-ignore
import html2pdf from 'html2pdf.js';

export default function ExcelToPdf() {
  const [file, setFile] = useState<File | null>(null);
  const [htmlTable, setHtmlTable] = useState<string>('');
  const [isProcessing, setIsProcessing] = useState(false);
  const previewRef = useRef<HTMLDivElement>(null);

  const handleFileSelected = async (files: File[]) => {
    const selectedFile = files[0];
    setFile(selectedFile);
    setIsProcessing(true);

    try {
      const arrayBuffer = await selectedFile.arrayBuffer();
      // Read the Excel file in the browser using SheetJS
      const workbook = XLSX.read(arrayBuffer, { type: 'array' });
      
      // Grab the first sheet
      const firstSheetName = workbook.SheetNames[0];
      const worksheet = workbook.Sheets[firstSheetName];
      
      // Convert that sheet to a cleanly structured HTML table
      const htmlString = XLSX.utils.sheet_to_html(worksheet, { id: 'excel-table' });
      setHtmlTable(htmlString);
      setIsProcessing(false);
    } catch (e) {
      console.error(e);
      setIsProcessing(false);
      alert("Failed to parse the Spreadsheet.");
    }
  };

  const handleExportPdf = () => {
    if (!previewRef.current || !file) return;
    setIsProcessing(true);

    const element = previewRef.current;
    
    const opt = {
      margin:       [15, 15, 15, 15] as [number, number, number, number],
      filename:     file.name.replace(/\.(xlsx|csv|xls)$/i, '') + '.pdf',
      image:        { type: 'jpeg' as const, quality: 0.98 },
      html2canvas:  { scale: 2, useCORS: true },
      // Use Landscape for widespread excel sheets!
      jsPDF:        { unit: 'mm', format: 'a4', orientation: 'landscape' as const }
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
    <ToolLayout title="Excel to PDF" description="Convert Excel spreadsheets and CSVs to PDF reports locally" icon="📊" color="#10b981">
      <div className={sharedStyles.container}>
        
        {/* Privacy Marketing Disclaimer */}
        <div style={{ background: 'rgba(239, 68, 68, 0.1)', borderLeft: '4px solid #ef4444', padding: '16px', borderRadius: '0 8px 8px 0', marginBottom: '24px' }}>
          <h4 style={{ margin: '0 0 8px 0', color: '#ef4444', display: 'flex', alignItems: 'center', gap: '8px' }}>
             🛡️ Uncompromised Privacy Notice
          </h4>
          <p style={{ margin: 0, fontSize: '14px', color: 'var(--color-text)', lineHeight: 1.5 }}>
            <strong>Why might the styling look minimal?</strong><br />
            We convert your Spreadsheet entirely inside your browser. We <strong>never</strong> upload your file to a server.<br /><br />
            If another website perfectly recreates Excel cell background colors and complex charts, it means they are secretly sending your financial data to corporate backend servers. We guarantee your data never leaves your device by focusing purely on extracting your tabular data securely.
          </p>
        </div>

        {!file ? (
          <FileUploader 
            onFilesSelected={handleFileSelected} 
            accept=".xlsx,.csv,.xls" 
            label="Drop your Spreadsheet (.xlsx, .csv) here" 
          />
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: 'var(--color-bg-secondary)', padding: '16px', borderRadius: 'var(--radius-md)' }}>
              <div>
                <h3 style={{ margin: '0 0 4px 0', fontSize: '16px' }}>{file.name}</h3>
                <p style={{ margin: 0, fontSize: '13px', color: 'var(--color-text-muted)' }}>Data extracted successfully. Review the table below.</p>
              </div>
              <div style={{ display: 'flex', gap: '12px', alignItems: 'center' }}>
                <button 
                  onClick={() => { setFile(null); setHtmlTable(''); }} 
                  className={sharedStyles.secondaryButton}
                >
                  Change File
                </button>
                <button 
                  className={sharedStyles.primaryButton} 
                  onClick={handleExportPdf}
                  style={{ background: '#10b981', border: 'none', color: 'white' }}
                >
                  📥 Export to PDF (Landscape)
                </button>
              </div>
            </div>

            {/* Table Preview */}
            <div style={{ border: '1px solid var(--color-border)', borderRadius: 'var(--radius-lg)', overflow: 'hidden', background: '#ffffff' }}>
               <div style={{ padding: '10px 16px', borderBottom: '1px solid var(--color-border)', background: 'var(--color-bg-primary)', fontSize: '13px', fontWeight: 600, color: 'var(--color-text-muted)' }}>
                  Data Preview
               </div>
               
               {/* Wrapper passed to html2pdf with basic table styling */}
               <div style={{ padding: '20px', overflowX: 'auto', maxHeight: '500px' }}>
                  <div 
                    ref={previewRef} 
                    style={{ 
                      background: 'white', 
                      color: 'black',
                      padding: '20px', 
                      width: 'fit-content',
                      minWidth: '100%',
                      fontFamily: 'system-ui, sans-serif'
                    }}
                  >
                    <style>
                      {`
                        #excel-table { border-collapse: collapse; width: 100%; font-size: 11px; }
                        #excel-table td, #excel-table th { border: 1px solid #d1d5db; padding: 6px 10px; text-align: left; }
                        #excel-table tr:nth-child(even) { background-color: #f9fafb; }
                        #excel-table tr:first-child { background-color: #f3f4f6; font-weight: bold; }
                      `}
                    </style>
                    <div dangerouslySetInnerHTML={{ __html: htmlTable }} />
                  </div>
               </div>
            </div>
          </div>
        )}

      </div>
      
      {isProcessing && <ProcessingLoader message="Processing Spreadsheet..." />}

      <ToolExplanation title="Excel to PDF">
        <p><strong>Excel to PDF</strong> reads your <code>.xlsx</code> or <code>.csv</code> spreadsheet and converts your data into a clean, readable HTML table straight in your browser.</p>
        <p>The table is then printed into a Landscape-oriented PDF. Because it operates 100% locally, your highly sensitive spreadsheet data is never exposed to the internet.</p>
      </ToolExplanation>
    </ToolLayout>
  );
}
