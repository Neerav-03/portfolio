import { Download, ExternalLink } from 'lucide-react';
import { experience, profile, resumeUrl } from '../../data/portfolio';
import type { AppProps } from '../registry';
import './resume.css';

export default function ResumeApp(_props: AppProps) {
  return (
    <div className="rs">
      <div className="rs-toolbar">
        <span className="mono rs-file">
          {profile.resumeFile} <span className="t-dim">· PDF · 1 page</span>
        </span>
        <div className="rs-actions">
          <a className="btn btn--sm" href={resumeUrl} target="_blank" rel="noreferrer">
            <ExternalLink size={13} /> Open
          </a>
          <a className="btn btn--sm btn--primary" href={resumeUrl} download>
            <Download size={13} /> Download
          </a>
        </div>
      </div>
      <object className="rs-pdf" data={`${resumeUrl}#view=FitH&toolbar=0`} type="application/pdf" aria-label="Resume PDF preview">
        <div className="rs-fallback app__pad stack">
          <p className="label">preview unavailable on this device</p>
          <h2 className="page-title">{profile.name}</h2>
          <p className="page-sub">
            {experience[0].role} · {profile.company}
          </p>
          <p className="prose">{profile.summary}</p>
          <div className="identity__actions">
            <a className="btn btn--primary" href={resumeUrl} download>
              <Download size={14} /> Download resume
            </a>
            <a className="btn" href={resumeUrl} target="_blank" rel="noreferrer">
              <ExternalLink size={14} /> Open PDF
            </a>
          </div>
        </div>
      </object>
    </div>
  );
}
