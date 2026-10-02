import { Clapperboard, Stethoscope } from 'lucide-react';
import { useEffect, useRef, useState } from 'react';
import { projects } from '../../data/portfolio';
import type { Project } from '../../data/types';
import { GitHubIcon } from '../../components/BrandIcons';
import type { AppProps } from '../registry';
import { DocLinkView } from './DocLinkView';
import { MovieMateView } from './MovieMateView';
import './projects.css';

type View = Project['id'];
const toView = (v?: string): View => (v === 'doclink' ? 'doclink' : 'moviemate');
const ICONS = { moviemate: Clapperboard, doclink: Stethoscope };

export default function ProjectsApp({ params, nonce, onView }: AppProps) {
  const [view, setView] = useState<View>(() => toView(params.view));
  const [seenNonce, setSeenNonce] = useState(nonce);
  const mainRef = useRef<HTMLDivElement>(null);

  if (nonce !== seenNonce) {
    setSeenNonce(nonce);
    setView(toView(params.view));
  }
  useEffect(() => {
    onView(view);
    mainRef.current?.scrollTo({ top: 0 });
  }, [view, onView]);

  const project = projects.find((p) => p.id === view)!;

  return (
    <div className="app">
      <nav className="app__side" aria-label="Projects">
        <div className="side-heading">
          <span className="label">Labs</span>
        </div>
        {projects.map((p) => {
          const Icon = ICONS[p.id];
          return (
            <button key={p.id} className="side-item" aria-current={view === p.id} onClick={() => setView(p.id)}>
              <Icon size={14} aria-hidden="true" />
              <span>
                <span className="side-item__title">{p.name}</span>
                <span className="side-item__sub" style={{ display: 'block' }}>
                  {p.tech.slice(0, 3).join(' · ')}
                </span>
              </span>
            </button>
          );
        })}
      </nav>
      <div ref={mainRef} className="app__main">
        <div key={view} className="app__pad stack-lg fade-in">
          <header className="xp-head pj-head">
            <div>
              <p className="label">lab · {project.id}</p>
              <h2 className="page-title">{project.name}</h2>
              <p className="page-sub">{project.tagline}</p>
            </div>
            <a className="btn btn--sm" href={project.repo} target="_blank" rel="noreferrer">
              <GitHubIcon size={13} /> View on GitHub
            </a>
          </header>
          <div className="chips">
            {project.tech.map((t) => (
              <span key={t} className="chip chip--accent">
                {t}
              </span>
            ))}
          </div>
          {view === 'moviemate' ? <MovieMateView /> : <DocLinkView />}
          <section>
            <div className="section-head">
              <h3>As documented</h3>
              <span className="label">resume</span>
            </div>
            <ul className="bullets">
              {project.bullets.map((b, i) => (
                <li key={i}>{b}</li>
              ))}
            </ul>
          </section>
        </div>
      </div>
    </div>
  );
}
