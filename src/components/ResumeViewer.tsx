import { Download, ExternalLink } from 'lucide-react';
import { lazy, Suspense, useCallback, useState } from 'react';
import { profile, resumeUrl } from '../data/portfolio';
import './resume-viewer.css';

const PdfCanvas = lazy(() => import('./PdfCanvas'));

/**
 * Desktop browsers (and iOS) expose an inline PDF viewer; most Android
 * browsers don't, so there we render the PDF ourselves with pdf.js.
 */
function hasInlinePdfViewer(): boolean {
  const nav = navigator as Navigator & { pdfViewerEnabled?: boolean };
  if (typeof nav.pdfViewerEnabled === 'boolean') return nav.pdfViewerEnabled;
  return !/Android|Mobile/i.test(navigator.userAgent);
}

export function ResumeActions({ size = 'sm' }: { size?: 'sm' | 'md' }) {
  const cls = size === 'sm' ? 'btn btn--sm' : 'btn';
  return (
    <div className="resume-actions">
      <a className={cls} href={resumeUrl} target="_blank" rel="noreferrer">
        <ExternalLink size={13} /> Open
      </a>
      <a className={`${cls} btn--primary`} href={resumeUrl} download={profile.resumeFile}>
        <Download size={13} /> Download
      </a>
    </div>
  );
}

function Fallback() {
  return (
    <div className="resume-viewer__fallback stack">
      <p className="label">preview unavailable on this device</p>
      <p className="prose">Open the PDF in your browser&rsquo;s viewer or download it.</p>
      <ResumeActions size="md" />
    </div>
  );
}

export function ResumeViewer() {
  const [inline] = useState(hasInlinePdfViewer);
  const [failed, setFailed] = useState(false);
  const onError = useCallback(() => setFailed(true), []);

  if (failed) return <Fallback />;
  return (
    <div className="resume-viewer">
      {inline ? (
        <iframe
          className="resume-viewer__frame"
          src={`${resumeUrl}#view=FitH&navpanes=0`}
          title={`${profile.name} — resume (PDF)`}
        />
      ) : (
        <Suspense fallback={<div className="loading">loading viewer…</div>}>
          <PdfCanvas url={resumeUrl} onError={onError} />
        </Suspense>
      )}
    </div>
  );
}
