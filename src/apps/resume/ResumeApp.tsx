import { profile } from '../../data/portfolio';
import { ResumeActions, ResumeViewer } from '../../components/ResumeViewer';
import type { AppProps } from '../registry';
import './resume.css';

export default function ResumeApp(_props: AppProps) {
  return (
    <div className="rs">
      <div className="rs-toolbar">
        <span className="mono rs-file">
          {profile.resumeFile} <span className="t-dim">· PDF · 1 page</span>
        </span>
        <ResumeActions />
      </div>
      <ResumeViewer />
    </div>
  );
}
