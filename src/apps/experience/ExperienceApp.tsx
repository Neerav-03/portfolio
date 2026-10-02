import { ChevronRight, KeyRound, ShieldCheck, Store, Timer, Workflow, type LucideIcon } from 'lucide-react';
import { useEffect, useRef, useState } from 'react';
import { experience } from '../../data/portfolio';
import type { AppProps } from '../registry';
import { DalModule } from './DalModule';
import { DrpModule } from './DrpModule';
import { EncryptionModule } from './EncryptionModule';
import { ExlModule } from './ExlModule';
import { NetradyneOverview } from './NetradyneOverview';
import './experience.css';

export type ExpView = 'netradyne' | 'drp' | 'dal' | 'encryption' | 'exl';
const VIEWS: ExpView[] = ['netradyne', 'drp', 'dal', 'encryption', 'exl'];
const DEPTH: Record<ExpView, number> = { netradyne: 0, drp: 1, dal: 1, encryption: 1, exl: 0 };

const NAV: { company: string; dates: string; items: { view: ExpView; code: string; label: string; icon: LucideIcon }[] }[] = [
  {
    company: 'Netradyne',
    dates: 'Jul 2025 – Present',
    items: [
      { view: 'netradyne', code: 'SYS', label: 'System map', icon: Workflow },
      { view: 'drp', code: 'DRP', label: 'Data Retention', icon: Timer },
      { view: 'dal', code: 'DAL', label: 'Data Access Levels', icon: ShieldCheck },
      { view: 'encryption', code: 'TEK', label: 'Encryption', icon: KeyRound },
    ],
  },
  {
    company: 'EXL',
    dates: 'May – Jul 2024',
    items: [{ view: 'exl', code: 'EXL', label: 'Price monitoring', icon: Store }],
  },
];

const toView = (v?: string): ExpView => (VIEWS.includes(v as ExpView) ? (v as ExpView) : 'netradyne');

export default function ExperienceApp({ params, nonce, onView }: AppProps) {
  const [view, setView] = useState<ExpView>(() => toView(params.view));
  const [motion, setMotion] = useState<'zoom-in' | 'zoom-out' | 'fade'>('fade');
  const mainRef = useRef<HTMLDivElement>(null);
  const viewRef = useRef(view);
  viewRef.current = view;

  const go = (next: ExpView) => {
    if (next === viewRef.current) return;
    const d = DEPTH[next] - DEPTH[viewRef.current];
    setMotion(d > 0 ? 'zoom-in' : d < 0 ? 'zoom-out' : 'fade');
    setView(next);
    mainRef.current?.scrollTo({ top: 0 });
  };

  // External navigation (palette, terminal, links).
  useEffect(() => {
    if (nonce > 0) go(toView(params.view));
  }, [nonce]);

  useEffect(() => onView(view), [view, onView]);

  const netradyne = experience[0];
  const exl = experience[1];

  return (
    <div className="app">
      <nav className="app__side" aria-label="Experience">
        {NAV.map((group) => (
          <div key={group.company} className="xp-group">
            <div className="side-heading xp-group__head">
              <span className="label">{group.company}</span>
              <span className="xp-group__dates mono">{group.dates}</span>
            </div>
            {group.items.map((it) => (
              <button key={it.view} className="side-item" aria-current={view === it.view} onClick={() => go(it.view)}>
                <it.icon size={14} aria-hidden="true" />
                <span>
                  <span className="side-item__title">{it.label}</span>
                  <span className="side-item__sub mono"> {it.code}</span>
                </span>
              </button>
            ))}
          </div>
        ))}
      </nav>

      <div ref={mainRef} className="app__main">
        <div key={view} className={`app__pad xp-view xp-view--${motion}`}>
          {view !== 'exl' && (
            <header className="xp-head">
              <div>
                <p className="label xp-crumbs">
                  <button onClick={() => go('netradyne')} className="xp-crumb">
                    Netradyne
                  </button>
                  {view !== 'netradyne' && (
                    <>
                      <ChevronRight size={11} aria-hidden="true" />
                      <span>{NAV[0].items.find((i) => i.view === view)?.code}</span>
                    </>
                  )}
                </p>
                <h2 className="page-title">{netradyne.role}</h2>
                <p className="page-sub">
                  {netradyne.company} · {netradyne.location}
                </p>
              </div>
              <span className="chip xp-date">
                <span className="dot dot--ok" /> {netradyne.start} – {netradyne.end}
              </span>
            </header>
          )}

          {view === 'netradyne' && <NetradyneOverview entry={netradyne} onOpen={go} />}
          {view === 'drp' && <DrpModule />}
          {view === 'dal' && <DalModule />}
          {view === 'encryption' && <EncryptionModule />}
          {view === 'exl' && <ExlModule entry={exl} />}
        </div>
      </div>
    </div>
  );
}
