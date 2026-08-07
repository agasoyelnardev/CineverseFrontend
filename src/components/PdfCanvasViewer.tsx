import React, { useEffect, useRef, useState } from 'react';
import { ChevronLeft, ChevronRight, ZoomIn, ZoomOut, Download, ExternalLink, RefreshCw, AlertCircle, FileText } from 'lucide-react';

interface PdfCanvasViewerProps {
  pdfUrl: string;
  title: string;
  onSwitchToTextMode?: () => void;
}

declare global {
  interface Window {
    pdfjsLib?: any;
  }
}

export const PdfCanvasViewer: React.FC<PdfCanvasViewerProps> = ({ pdfUrl, title, onSwitchToTextMode }) => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const [pdfDoc, setPdfDoc] = useState<any>(null);
  const [pageNum, setPageNum] = useState<number>(1);
  const [numPages, setNumPages] = useState<number>(0);
  const [scale, setScale] = useState<number>(1.2);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  // Helper to convert base64 data URI to Uint8Array for pdf.js
  const dataURItoUint8Array = (dataURI: string): Uint8Array => {
    const base64Index = dataURI.indexOf(';base64,');
    if (base64Index !== -1) {
      const base64 = dataURI.substring(base64Index + 8);
      const raw = window.atob(base64);
      const rawLength = raw.length;
      const array = new Uint8Array(new ArrayBuffer(rawLength));
      for (let i = 0; i < rawLength; i++) {
        array[i] = raw.charCodeAt(i);
      }
      return array;
    }
    throw new Error('Etibarsız Data URI formatı');
  };

  // Load PDF Document
  useEffect(() => {
    let isMounted = true;
    setLoading(true);
    setError(null);

    const loadPdf = async () => {
      try {
        if (!window.pdfjsLib) {
          // Wait briefly if script is loading
          await new Promise(resolve => setTimeout(resolve, 500));
        }

        if (!window.pdfjsLib) {
          throw new Error('PDF render kitabxanası tapılmadı.');
        }

        let loadingTask;
        if (pdfUrl.startsWith('data:')) {
          const uint8Array = dataURItoUint8Array(pdfUrl);
          loadingTask = window.pdfjsLib.getDocument({ data: uint8Array });
        } else {
          loadingTask = window.pdfjsLib.getDocument(pdfUrl);
        }

        const pdf = await loadingTask.promise;
        if (isMounted) {
          setPdfDoc(pdf);
          setNumPages(pdf.numPages);
          setPageNum(1);
          setLoading(false);
        }
      } catch (err: any) {
        console.error('PDF.js loading error:', err);
        if (isMounted) {
          setError(err.message || 'PDF sənədi yüklənərkən xəta baş verdi.');
          setLoading(false);
        }
      }
    };

    loadPdf();

    return () => {
      isMounted = false;
    };
  }, [pdfUrl]);

  // Render current page to canvas
  useEffect(() => {
    if (!pdfDoc || !canvasRef.current) return;

    let isCurrent = true;

    const renderPage = async () => {
      try {
        const page = await pdfDoc.getPage(pageNum);
        if (!isCurrent || !canvasRef.current) return;

        const viewport = page.getViewport({ scale });
        const canvas = canvasRef.current;
        const context = canvas.getContext('2d');

        if (!context) return;

        canvas.height = viewport.height;
        canvas.width = viewport.width;

        const renderContext = {
          canvasContext: context,
          viewport: viewport
        };

        await page.render(renderContext).promise;
      } catch (err) {
        console.error('Page render error:', err);
      }
    };

    renderPage();

    return () => {
      isCurrent = false;
    };
  }, [pdfDoc, pageNum, scale]);

  const handleOpenNewTab = () => {
    if (pdfUrl.startsWith('data:')) {
      try {
        const uint8Array = dataURItoUint8Array(pdfUrl);
        const blob = new Blob([uint8Array], { type: 'application/pdf' });
        const blobUrl = URL.createObjectURL(blob);
        window.open(blobUrl, '_blank');
      } catch (e) {
        window.open(pdfUrl, '_blank');
      }
    } else {
      window.open(pdfUrl, '_blank');
    }
  };

  return (
    <div className="w-full max-w-5xl flex flex-col items-center gap-3">
      {/* TOOLBAR CONTROLS */}
      <div className="w-full flex flex-wrap items-center justify-between gap-2 p-3 rounded-2xl bg-zinc-900 border border-zinc-800 text-xs shadow-lg">
        {/* Page navigation */}
        <div className="flex items-center gap-2">
          <button
            disabled={pageNum <= 1 || loading}
            onClick={() => setPageNum(prev => Math.max(1, prev - 1))}
            className="p-1.5 rounded-lg bg-zinc-800 hover:bg-zinc-700 disabled:opacity-40 transition cursor-pointer text-white font-bold"
            title="Əvvəlki səhifə"
          >
            <ChevronLeft className="w-4 h-4" />
          </button>
          
          <span className="text-zinc-300 font-mono text-xs font-bold px-2">
            Səhifə <span className="text-red-400">{pageNum}</span> / {numPages || '...'}
          </span>

          <button
            disabled={pageNum >= numPages || loading}
            onClick={() => setPageNum(prev => Math.min(numPages, prev + 1))}
            className="p-1.5 rounded-lg bg-zinc-800 hover:bg-zinc-700 disabled:opacity-40 transition cursor-pointer text-white font-bold"
            title="Növbəti səhifə"
          >
            <ChevronRight className="w-4 h-4" />
          </button>
        </div>

        {/* Zoom controls */}
        <div className="flex items-center gap-2">
          <button
            onClick={() => setScale(prev => Math.max(0.6, prev - 0.2))}
            className="p-1.5 rounded-lg bg-zinc-800 hover:bg-zinc-700 transition cursor-pointer text-white"
            title="Kiçilt"
          >
            <ZoomOut className="w-4 h-4" />
          </button>
          <span className="text-zinc-400 font-mono text-[11px] font-bold">
            {Math.round(scale * 100)}%
          </span>
          <button
            onClick={() => setScale(prev => Math.min(2.5, prev + 0.2))}
            className="p-1.5 rounded-lg bg-zinc-800 hover:bg-zinc-700 transition cursor-pointer text-white"
            title="Böyüt"
          >
            <ZoomIn className="w-4 h-4" />
          </button>
        </div>

        {/* Mode & Action buttons */}
        <div className="flex items-center gap-2">
          {onSwitchToTextMode && (
            <button
              onClick={onSwitchToTextMode}
              className="px-3 py-1.5 bg-zinc-800 hover:bg-zinc-700 text-zinc-200 rounded-xl font-bold text-[11px] transition cursor-pointer flex items-center gap-1.5"
            >
              <FileText className="w-3.5 h-3.5 text-red-400" /> Mətn Rejiminə Keç
            </button>
          )}

          <button
            onClick={handleOpenNewTab}
            className="px-3.5 py-1.5 bg-red-600 hover:bg-red-500 text-white rounded-xl font-bold text-[11px] transition cursor-pointer flex items-center gap-1.5 shadow-md shadow-red-600/20"
          >
            <ExternalLink className="w-3.5 h-3.5" /> Yeni Tabda Aç ↗
          </button>
        </div>
      </div>

      {/* CANVAS DISPLAY CONTAINER */}
      <div className="w-full h-[75vh] min-h-[550px] rounded-3xl border border-zinc-800/80 bg-zinc-950 overflow-auto p-4 flex items-start justify-center shadow-2xl relative custom-scrollbar">
        {loading && (
          <div className="absolute inset-0 flex flex-col items-center justify-center bg-zinc-950/90 text-white gap-3 z-20">
            <RefreshCw className="w-8 h-8 text-red-500 animate-spin" />
            <span className="text-xs font-bold tracking-wider">PDF SƏNƏDİ HAZIRLANIR...</span>
          </div>
        )}

        {error ? (
          <div className="flex flex-col items-center justify-center text-center p-8 text-zinc-400 gap-3 my-auto">
            <AlertCircle className="w-12 h-12 text-red-500" />
            <h4 className="font-bold text-white text-sm">PDF Nümayiş Etdirilə Bilmədi</h4>
            <p className="text-xs max-w-md text-zinc-400">
              Bu fayl xarici qorunmaya malik ola bilər və ya format dəstəklənmir. Siz sənədi xarici pəncərədə aça və ya interaktiv mətn rejimindən istifadə edə bilərsiniz.
            </p>
            <div className="flex gap-3 mt-2">
              <button
                onClick={handleOpenNewTab}
                className="px-4 py-2 bg-red-600 hover:bg-red-500 text-white font-bold text-xs rounded-xl"
              >
                Faylı Yeni Tabda Aç
              </button>
              {onSwitchToTextMode && (
                <button
                  onClick={onSwitchToTextMode}
                  className="px-4 py-2 bg-zinc-800 hover:bg-zinc-700 text-white font-bold text-xs rounded-xl"
                >
                  Mətn Rejimində Oxu
                </button>
              )}
            </div>
          </div>
        ) : (
          <canvas
            ref={canvasRef}
            className="shadow-2xl rounded-xl border border-zinc-800 max-w-full bg-white my-2"
          />
        )}
      </div>
    </div>
  );
};

export default PdfCanvasViewer;
