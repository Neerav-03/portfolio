import { useEffect, useRef, useState } from 'react';
import * as pdfjs from 'pdfjs-dist';
import workerUrl from 'pdfjs-dist/build/pdf.worker.min.mjs?url';

pdfjs.GlobalWorkerOptions.workerSrc = workerUrl;

/**
 * Renders every page of a PDF to canvases sized to the container width.
 * Used where the browser has no inline PDF viewer (most phones). Lazy-loaded.
 */
export default function PdfCanvas({ url, onError }: { url: string; onError: () => void }) {
  const hostRef = useRef<HTMLDivElement>(null);
  const [status, setStatus] = useState<'loading' | 'ready'>('loading');

  useEffect(() => {
    const host = hostRef.current;
    if (!host) return;
    let cancelled = false;
    const task = pdfjs.getDocument({ url });

    const render = async () => {
      try {
        const doc = await task.promise;
        const width = host.clientWidth || 360;
        const dpr = Math.min(window.devicePixelRatio || 1, 3);
        const canvases: HTMLCanvasElement[] = [];
        for (let n = 1; n <= doc.numPages; n++) {
          const page = await doc.getPage(n);
          const base = page.getViewport({ scale: 1 });
          const viewport = page.getViewport({ scale: (width / base.width) * dpr });
          const canvas = document.createElement('canvas');
          canvas.width = Math.floor(viewport.width);
          canvas.height = Math.floor(viewport.height);
          canvas.style.width = '100%';
          canvas.setAttribute('aria-label', `Resume page ${n} of ${doc.numPages}`);
          canvas.setAttribute('role', 'img');
          await page.render({ canvas, viewport }).promise;
          if (cancelled) return;
          canvases.push(canvas);
        }
        if (cancelled) return;
        host.replaceChildren(...canvases);
        setStatus('ready');
      } catch {
        if (!cancelled) onError();
      }
    };
    void render();
    return () => {
      cancelled = true;
      void task.destroy();
    };
  }, [url, onError]);

  return (
    <div className="pdf-canvas">
      {status === 'loading' && <div className="loading">rendering resume…</div>}
      <div ref={hostRef} className="pdf-canvas__pages" />
    </div>
  );
}
