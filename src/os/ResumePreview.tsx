import { X } from 'lucide-react';
import { useEffect, useRef } from 'react';
import { profile } from '../data/portfolio';
import { ResumeActions, ResumeViewer } from '../components/ResumeViewer';
import { useOS } from './useOS';
import './resume-preview.css';

const FOCUSABLE = 'a[href], button:not([disabled]), iframe, [tabindex]:not([tabindex="-1"])';

/** Modal resume preview used in recruiter mode (system mode opens the Resume window instead). */
export function ResumePreview() {
  const { closeResumePreview } = useOS();
  const dialogRef = useRef<HTMLDivElement>(null);
  const closeRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    const previous = document.activeElement as HTMLElement | null;
    closeRef.current?.focus();
    return () => previous?.focus?.({ preventScroll: true });
  }, []);

  // Esc closes; Tab cycles within the dialog (focus trap).
  useEffect(() => {
    const dialog = dialogRef.current;
    if (!dialog) return;
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        e.preventDefault();
        closeResumePreview();
      } else if (e.key === 'Tab') {
        const items = [...dialog.querySelectorAll<HTMLElement>(FOCUSABLE)];
        if (!items.length) return;
        const first = items[0];
        const last = items[items.length - 1];
        if (e.shiftKey && document.activeElement === first) {
          e.preventDefault();
          last.focus();
        } else if (!e.shiftKey && document.activeElement === last) {
          e.preventDefault();
          first.focus();
        }
      }
    };
    dialog.addEventListener('keydown', onKeyDown);
    return () => dialog.removeEventListener('keydown', onKeyDown);
  }, [closeResumePreview]);

  return (
    <div
      className="rp-backdrop"
      role="presentation"
      onMouseDown={(e) => e.target === e.currentTarget && closeResumePreview()}
    >
      <div ref={dialogRef} className="rp" role="dialog" aria-modal="true" aria-labelledby="rp-title">
        <header className="rp__bar">
          <h2 id="rp-title" className="mono rp__title">
            {profile.resumeFile}
            <span className="t-dim"> · preview</span>
          </h2>
          <ResumeActions />
          <button ref={closeRef} className="rp__close" onClick={closeResumePreview} aria-label="Close resume preview">
            <X size={15} />
          </button>
        </header>
        <ResumeViewer />
      </div>
    </div>
  );
}
