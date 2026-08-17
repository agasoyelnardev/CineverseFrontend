import React, { useEffect, useRef, useState } from 'react';
import { ChevronLeft, ChevronRight, ZoomIn, ZoomOut, ExternalLink, RefreshCw, AlertCircle, FileText } from 'lucide-react';
import {
  resolvePdfUrl,
  isSameOriginPdfUrl,
  getDirectEmbedUrl,
} from '../utils/pdfUrl';

interface PdfCanvasViewerProps {
  pdfUrl: string;
  title: string;
  onSwitchToTextMode?: () => void;
  onRequestGoogleViewer?: () => void;
}

declare global {
  interface Window {
    pdfjsLib?: any;
  }
}

export const PdfCanvasViewer: React.FC<PdfCanvasViewerProps> = ({
  pdfUrl,
  title,
  onSwitchToTextMode,
  onRequestGoogleViewer,
}) => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const [pdfDoc, setPdfDoc] = useState<any>(null);
  const [pageNum, setPageNum] = useState<number>(1);
  const [numPages, setNumPages] = useState<number>(0);
  const [scale, setScale] = useState<number>(1.2);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  const resolvedUrl = resolvePdfUrl(pdfUrl);
  const openUrl = getDirectEmbedUrl(pdfUrl);

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

  useEffect(() => {
    let isMounted = true;
    setLoading(true);
    setError(null);
    setPdfDoc(null);
    setPageNum(1);
    setNumPages(0);

    const loadPdf = async () => {
      try {
        if (!resolvedUrl) {
          throw new Error('PDF linki tapılmadı.');
        }

        if (!window.pdfjsLib) {
          await new Promise((resolve) => setTimeout(resolve, 500));
        }

        if (!window.pdfjsLib) {
          throw new Error('PDF render kitabxanası tapılmadı.');
        }

        let loadingTask;
        if (resolvedUrl.startsWith('data:')) {
          const uint8Array = dataURItoUint8Array(resolvedUrl);
          loadingTask = window.pdfjsLib.getDocument({ data: uint8Array });
        } else if (resolvedUrl.startsWith('blob:')) {
          loadingTask = window.pdfjsLib.getDocument(resolvedUrl);
        } else if (isSameOriginPdfUrl(resolvedUrl)) {
          const fetchUrl = resolvedUrl.startsWith('/')
            ? resolvedUrl
            : resolvePdfUrl(resolvedUrl);
          const response = await fetch(fetchUrl);
          if (!response.ok) {
            throw new Error(`PDF yüklənmədi (${response.status})`);
          }
          const buffer = await response.arrayBuffer();
          loadingTask = window.pdfjsLib.getDocument({ data: new Uint8Array(buffer) });
        } else {
          loadingTask = window.pdfjsLib.getDocument({
            url: resolvedUrl,
            withCredentials: false,
          });
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
  }, [resolvedUrl]);

  useEffect(() => {
    if (!pdfDoc || !canvasRef.current) return;

    let isCurrent = true;
    let renderTask: { cancel?: () => void; promise: Promise<void> } | null = null;

    const renderPage = async () => {
      try {
        const page = await pdfDoc.getPage(pageNum);
        if (!isCurrent || !canvasRef.current) return;

        const canvas = canvasRef.current;
        const context = canvas.getContext('2d', { alpha: false });
        if (!context) return;

        const outputScale = window.devicePixelRatio || 1;
        const viewport = page.getViewport({ scale });
        const pixelWidth = Math.floor(viewport.width * outputScale);
        const pixelHeight = Math.floor(viewport.height * outputScale);

        canvas.width = pixelWidth;
        canvas.height = pixelHeight;
        canvas.style.width = `${Math.floor(viewport.width)}px`;
        canvas.style.height = `${Math.floor(viewport.height)}px`;

        context.setTransform(1, 0, 0, 1, 0, 0);
        context.fillStyle = '#ffffff';
        context.fillRect(0, 0, pixelWidth, pixelHeight);

        const transform = outputScale !== 1
          ? [outputScale, 0, 0, outputScale, 0, 0]
          : undefined;

        renderTask = page.render({
          canvasContext: context,
          viewport,
          transform,
          background: 'rgb(255, 255, 255)',
        });

        await renderTask.promise;
      } catch (err: any) {
        if (err?.name !== 'RenderingCancelledException') {
          console.error('Page render error:', err);
        }
      }
    };

    renderPage();

    return () => {
      isCurrent = false;
      renderTask?.cancel?.();
    };
  }, [pdfDoc, pageNum, scale]);

  const handleOpenNewTab = () => {
    if (resolvedUrl.startsWith('data:')) {
      try {
        const uint8Array = dataURItoUint8Array(resolvedUrl);
        const blob = new Blob([uint8Array], { type: 'application/pdf' });
        const blobUrl = URL.createObjectURL(blob);
        window.open(blobUrl, '_blank');
      } catch {
        window.open(resolvedUrl, '_blank');
      }
      return;
    }
    window.open(openUrl, '_blank');
  };

  return (
    <div className="w-full max-w-5xl flex flex-col items-center gap-3">
      <div className="w-full flex flex-wrap items-center justify-between gap-2 p-3 rounded-2xl bg-zinc-900 border border-zinc-800 text-xs shadow-lg">
        <div className="flex items-center gap-2">
          <button
            disabled={pageNum <= 1 || loading}
            onClick={() => setPageNum((prev) => Math.max(1, prev - 1))}
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
            onClick={() => setPageNum((prev) => Math.min(numPages, prev + 1))}
            className="p-1.5 rounded-lg bg-zinc-800 hover:bg-zinc-700 disabled:opacity-40 transition cursor-pointer text-white font-bold"
            title="Növbəti səhifə"
          >
            <ChevronRight className="w-4 h-4" />
          </button>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => setScale((prev) => Math.max(0.6, prev - 0.2))}
            className="p-1.5 rounded-lg bg-zinc-800 hover:bg-zinc-700 transition cursor-pointer text-white"
            title="Kiçilt"
          >
            <ZoomOut className="w-4 h-4" />
          </button>
          <span className="text-zinc-400 font-mono text-[11px] font-bold">
            {Math.round(scale * 100)}%
          </span>
          <button
            onClick={() => setScale((prev) => Math.min(2.5, prev + 0.2))}
            className="p-1.5 rounded-lg bg-zinc-800 hover:bg-zinc-700 transition cursor-pointer text-white"
            title="Böyüt"
          >
            <ZoomIn className="w-4 h-4" />
          </button>
        </div>

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

      <div className="w-full h-[75vh] min-h-[550px] rounded-3xl border border-zinc-300/40 bg-zinc-200 overflow-auto p-6 flex items-start justify-center shadow-2xl relative custom-scrollbar">
        {loading && (
          <div className="absolute inset-0 flex flex-col items-center justify-center bg-zinc-200/95 text-zinc-800 gap-3 z-20">
            <RefreshCw className="w-8 h-8 text-red-500 animate-spin" />
            <span className="text-xs font-bold tracking-wider">PDF SƏNƏDİ HAZIRLANIR...</span>
          </div>
        )}

        {error ? (
          <div className="flex flex-col items-center justify-center text-center p-8 text-zinc-600 gap-3 my-auto">
            <AlertCircle className="w-12 h-12 text-red-500" />
            <h4 className="font-bold text-zinc-900 text-sm">PDF Nümayiş Etdirilə Bilmədi</h4>
            <p className="text-xs max-w-md text-zinc-600">
              Bu fayl xarici qorunmaya malik ola bilər və ya format dəstəklənmir. Google Viewer, xarici pəncərə və ya mətn rejimindən istifadə edin.
            </p>
            <div className="flex flex-wrap gap-3 mt-2 justify-center">
              {onRequestGoogleViewer && (
                <button
                  onClick={onRequestGoogleViewer}
                  className="px-4 py-2 bg-red-600 hover:bg-red-500 text-white font-bold text-xs rounded-xl"
                >
                  Google Viewer ilə Aç
                </button>
              )}
              <button
                onClick={handleOpenNewTab}
                className="px-4 py-2 bg-zinc-800 hover:bg-zinc-700 text-white font-bold text-xs rounded-xl"
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
          <div className="bg-white rounded-xl shadow-2xl border border-zinc-200 p-1 my-2">
            <canvas
              ref={canvasRef}
              className="block max-w-full rounded-lg"
              aria-label={title}
            />
          </div>
        )}
      </div>
    </div>
  );
};

export default PdfCanvasViewer;
