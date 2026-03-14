import { useState } from 'react';
import ToolLayout from '../../components/ToolLayout/ToolLayout';
import FileUploader from '../../components/FileUploader/FileUploader';
import ProcessingLoader from '../../components/ProcessingLoader/ProcessingLoader';
import ToolExplanation from '../../components/ToolExplanation/ToolExplanation';
import DownloadButton from '../../components/DownloadButton/DownloadButton';
import sharedStyles from '../shared/ToolShared.module.css';
import { getDocument, GlobalWorkerOptions } from 'pdfjs-dist';
import * as XLSX from 'xlsx';

// Set up pdf.js worker
import pdfWorkerUrl from 'pdfjs-dist/build/pdf.worker.min?url';
GlobalWorkerOptions.workerSrc = pdfWorkerUrl;

export default function PdfToExcel() {
  const [file, setFile] = useState<File | null>(null);
  const [extractedData, setExtractedData] = useState<string[][]>([]);
  const [excelData, setExcelData] = useState<Uint8Array | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);

  const handleFileSelected = async (files: File[]) => {
    const selectedFile = files[0];
    setFile(selectedFile);
    setIsProcessing(true);

    try {
      const arrayBuffer = await selectedFile.arrayBuffer();
      
      const pdf = await getDocument({ data: arrayBuffer }).promise;
      const numPages = pdf.numPages;
      const allRows: string[][] = [];

      // Process each page
      for (let i = 1; i <= numPages; i++) {
        const page = await pdf.getPage(i);
        const textContent = await page.getTextContent();
        
        // Group items by Y coordinate (Rows)
        const rowMap: { [y: string]: any[] } = {};
        
        textContent.items.forEach((item: any) => {
          if (!item.str || item.str.trim() === '') return;
          // Round Y coordinate to group text that is roughly on the same line
          const y = Math.round(item.transform[5] / 5) * 5; 
          if (!rowMap[y]) rowMap[y] = [];
          rowMap[y].push(item);
        });

        // Sort rows from top of page to bottom (PDF drawing Y goes bottom-up, so sort descending)
        const sortedY = Object.keys(rowMap).map(Number).sort((a, b) => b - a);

        sortedY.forEach(y => {
          // Sort items in the row from left to right based on X coordinate
          const rowItems = rowMap[y].sort((a, b) => a.transform[4] - b.transform[4]);
          allRows.push(rowItems.map(item => item.str.trim()));
        });
        
        // Add a blank row between pages
        if (i < numPages) {
            allRows.push([]); 
        }
      }

      setExtractedData(allRows);

      // Convert rows to Excel Workbook
      const worksheet = XLSX.utils.aoa_to_sheet(allRows);
      const workbook = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(workbook, worksheet, "Sheet1");

      const excelBuffer = XLSX.write(workbook, { bookType: 'xlsx', type: 'array' });
      setExcelData(new Uint8Array(excelBuffer));
      
      setIsProcessing(false);
    } catch (e) {
      console.error(e);
      setIsProcessing(false);
      alert("Failed to parse the PDF document.");
    }
  };

  return (
    <ToolLayout title="PDF to Excel" description="Extract structured data and tables from PDF to Spreadsheet internally" icon="📊" color="#10b981">
      <div className={sharedStyles.container}>
        
        {/* Privacy Marketing Disclaimer */}
        <div style={{ background: 'rgba(239, 68, 68, 0.1)', borderLeft: '4px solid #ef4444', padding: '16px', borderRadius: '0 8px 8px 0', marginBottom: '24px' }}>
          <h4 style={{ margin: '0 0 8px 0', color: '#ef4444', display: 'flex', alignItems: 'center', gap: '8px' }}>
             🛡️ Uncompromised Privacy Notice
          </h4>
          <p style={{ margin: 0, fontSize: '14px', color: 'var(--color-text)', lineHeight: 1.5 }}>
            <strong>Why might columns look slightly misaligned?</strong><br />
            Because a PDF doesn't know what an "Excel Cell" is, we use coordinate grouping to guess where your columns are straight inside your browser.<br /><br />
            Reconstructing complicated tabular merged cells requires heavy AI extraction models serverside. If a website gives you a 100% perfect Excel clone of a complex PDF table, <strong>they are reading and uploading your financial data</strong>. We prioritize keeping your data safely offline on your machine.
          </p>
        </div>

        {!file ? (
          <FileUploader 
            onFilesSelected={handleFileSelected} 
            accept=".pdf" 
            label="Drop your PDF here to extract data to Excel" 
          />
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: 'var(--color-bg-secondary)', padding: '16px', borderRadius: 'var(--radius-md)' }}>
              <div>
                <h3 style={{ margin: '0 0 4px 0', fontSize: '16px' }}>{file.name}</h3>
                <p style={{ margin: 0, fontSize: '13px', color: 'var(--color-text-muted)' }}>Data extracted successfully. Download the spreadsheet below.</p>
              </div>
              <div style={{ display: 'flex', gap: '12px', alignItems: 'center' }}>
                <button 
                  onClick={() => { setFile(null); setExtractedData([]); setExcelData(null); }} 
                  className={sharedStyles.secondaryButton}
                >
                  Change File
                </button>
                {excelData && (
                  <DownloadButton 
                    data={excelData}
                    fileName={file.name.replace(/\.pdf$/i, '') + '.xlsx'}
                    label="Download .xlsx"
                  />
                )}
              </div>
            </div>

            {/* Extracted Data Preview */}
            <div style={{ border: '1px solid var(--color-border)', borderRadius: 'var(--radius-lg)', overflow: 'hidden', background: '#f8f9fa' }}>
               <div style={{ padding: '10px 16px', borderBottom: '1px solid var(--color-border)', background: 'var(--color-bg-primary)', fontSize: '13px', fontWeight: 600, color: 'var(--color-text-muted)' }}>
                  Coordinate-Grouped Data Preview
               </div>
               
               <div style={{ padding: '20px', overflowX: 'auto', maxHeight: '400px' }}>
                 <table style={{ borderCollapse: 'collapse', width: '100%', fontSize: '12px', background: 'white', border: '1px solid #e5e7eb' }}>
                   <tbody>
                     {extractedData.map((row, rIdx) => (
                       <tr key={rIdx} style={{ borderBottom: '1px solid #f3f4f6' }}>
                         {row.length === 0 ? (
                           <td colSpan={10} style={{ padding: '8px', background: '#f9fafb', color: '#9ca3af', fontStyle: 'italic', textAlign: 'center' }}>--- Page Break ---</td>
                         ) : (
                           row.map((cell, cIdx) => (
                             <td key={cIdx} style={{ padding: '8px 12px', borderRight: '1px solid #f3f4f6' }}>{cell}</td>
                           ))
                         )}
                       </tr>
                     ))}
                   </tbody>
                 </table>
               </div>
            </div>
          </div>
        )}

      </div>
      
      {isProcessing && <ProcessingLoader message="Extracting Tables & Generating Spreadsheet..." />}

      <ToolExplanation title="PDF to Excel">
        <p><strong>PDF to Excel</strong> extracts raw text structures from your PDF, grouping them into rows and columns by heuristically analyzing their X/Y drawing coordinates.</p>
        <p>Because it operates locally using JavaScript, the resulting spreadsheet contains your raw tabular data without exposing complex financial documents to external cloud APIs—guaranteeing 100% data privacy.</p>
      </ToolExplanation>
    </ToolLayout>
  );
}
