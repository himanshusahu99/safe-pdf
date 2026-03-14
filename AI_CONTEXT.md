# Project Context: Love-PDF

## Overview
Love-PDF is a pure client-side PDF processing and conversion web application built with React, Vite, TypeScript, and Zustand. 
**Core Value Proposition:** 100% Privacy. All PDF processing and file conversions happen entirely inside the user's browser without ever sending files to a backend server.

## Architecture
- **Framework:** React 19 + Vite + TypeScript.
- **Styling:** Pure CSS Modules (`.module.css`) utilizing native CSS Variables (`--color-*`) defined globally in `src/index.css` for light/dark mode theming. No Tailwind.
- **State Management:** Zustand (`useFileStore.ts`) handles global state (like active tool selection and user preferences).
- **Routing:** React Router v7 (`src/App.tsx`). Each tool acts as an independent route dynamically loaded from the `toolRegistry.ts`.

## Core Technologies & Dependencies
All tools were carefully selected to operate exclusively in the browser (`ArrayBuffer`, `Blob`, `Canvas`):
- **PDF Manipulation:** `pdf-lib` (Merging, Splitting, Rotating, Removing, Compressing, Watermarks, Passwords).
- **PDF Parsing/Rendering:** `pdfjs-dist` (Extracting text, rendering pages to images for thumbnails and comparison).
- **Text Formatting:** `@monaco-editor/react` (Diff viewing, Markdown editing).
- **Conversions:**
  - `html2canvas` & `html2pdf.js` (Rendering HTML/DOM elements into downloadable PDFs).
  - `marked` & `dompurify` (Markdown parsing to HTML).
  - `mammoth` (Extracting text and basic HTML from `.docx` Word documents).
  - `xlsx` (SheetJS) (Parsing Excel spreadsheets and CSVs to HTML tables and arrays).
  - `docx` (Generating new Word documents from extracted text).
- **Drag & Drop:** `@dnd-kit/core` & `@dnd-kit/sortable` (For the `SortPages` tool).

## Directory Structure
- `src/components/`: Reusable, generic UI blocks.
  - `ToolLayout`, `FileUploader`, `FilePreview`, `DownloadButton`, `ProcessingLoader`, `ToolExplanation`.
- `src/config/toolRegistry.ts`: The central nervous system. Every tool must be registered here with an `id`, `route`, `component` (lazy loaded), `icon`, and `acceptTypes`. The Dashboard dynamically renders from this list.
- `src/tools/`: The specific logic and UI for each individual PDF feature.
  - Organized into subdirectories (e.g., `MergePdf/`, `SplitPdf/`, `MarkdownToPdf/`).
  - Contains the `.tsx` React component and its `.module.css`.
  - Most tools import `sharedStyles.container` from `src/tools/shared/ToolShared.module.css` for consistent layout padding.

## Development Patterns & UX Standards
1. **Tool Layout Wrapper:** Every tool component is wrapped in `<ToolLayout>`.
2. **Standardized Modals/Buttons:** 
   - Files are uploaded via `<FileUploader>`.
   - Actions to trigger PDF generation usually sit next to a `<button onClick={handleReset}>Change File</button>` to allow easy restarting without refreshing the whole page.
   - Downloading finished processing uses `<DownloadButton>`.
3. **Browser Limitations & Privacy Framing:** 
   - It is standard practice to include an explicit disclaimer (e.g., `<div className="privacy-notice">🛡️ We Trust Our Customer...</div>`) on tools that suffer formatting limitations due to running client-side (such as `WordToPdf` or `PdfToExcel`). This frames the loss of perfect formatting as an intentional, highly-secure privacy feature.
4. **CSS Variables:** All colors must stick to the variables defined in `index.css` to instantly support Dark Mode. Avoid hardcoded hex codes where possible unless they are specifically vibrant accent buttons.

## Current Tool Suite
1. **Organize:** Merge, Split, Compress, Rotate, Remove Pages, Sort Pages.
2. **Convert:** Images to PDF, PDF to Images, Extract Images, Markdown to PDF, Word to PDF, Excel to PDF, PDF to Word, PDF to Excel.
3. **Edit:** Add Watermark, Add Page Numbers, Crop PDF, Flatten PDF, Compare PDFs, Annotate PDF.
4. **Security:** Protect PDF, Unlock PDF, Sign PDF.
