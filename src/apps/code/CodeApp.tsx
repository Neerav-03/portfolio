import { ArrowUpRight } from 'lucide-react';
import { useEffect, useRef, useState } from 'react';
import { codingProfiles, contests } from '../../data/portfolio';
import type { CodingProfile } from '../../data/types';
import type { AppProps } from '../registry';
import './code.css';

interface Band {
  name: string;
  from: number;
  to: number;
  color: string;
}

/** Public rank thresholds of each platform (not personal data). */
const LADDERS: Record<CodingProfile['id'], { min: number; max: number; bands: Band[] }> = {
  codeforces: {
    min: 1000,
    max: 2300,
    bands: [
      { name: 'Newbie', from: 1000, to: 1200, color: '#8a8f98' },
      { name: 'Pupil', from: 1200, to: 1400, color: '#4caf6a' },
      { name: 'Specialist', from: 1400, to: 1600, color: '#3fb8b0' },
      { name: 'Expert', from: 1600, to: 1900, color: '#5b8cff' },
      { name: 'Cand. Master', from: 1900, to: 2100, color: '#b07cf0' },
      { name: 'Master', from: 2100, to: 2300, color: '#e8a24a' },
    ],
  },
  codechef: {
    min: 1200,
    max: 2200,
    bands: [
      { name: '1★', from: 1200, to: 1400, color: '#8a8f98' },
      { name: '2★', from: 1400, to: 1600, color: '#4caf6a' },
      { name: '3★', from: 1600, to: 1800, color: '#5b8cff' },
      { name: '4★', from: 1800, to: 2000, color: '#b07cf0' },
      { name: '5★', from: 2000, to: 2200, color: '#e8b04a' },
    ],
  },
};

function RankLadder({ profile }: { profile: CodingProfile }) {
  const ladder = LADDERS[profile.id];
  const span = ladder.max - ladder.min;
  const pos = ((profile.maxRating - ladder.min) / span) * 100;
  const current = ladder.bands.find((b) => profile.maxRating >= b.from && profile.maxRating < b.to);
  return (
    <div className="cp-ladder" role="img" aria-label={`${profile.platform} max rating ${profile.maxRating}, in the ${current?.name} band`}>
      <div className="cp-ladder__track">
        {ladder.bands.map((b) => (
          <span
            key={b.name}
            className={`cp-ladder__band${b === current ? ' is-current' : ''}`}
            style={{ width: `${((b.to - b.from) / span) * 100}%`, ['--band' as string]: b.color }}
            title={`${b.name}: ${b.from}–${b.to - 1}`}
          >
            {b === current && <span className="cp-ladder__name mono">{b.name}</span>}
          </span>
        ))}
        <span className="cp-ladder__marker" style={{ left: `${pos}%` }}>
          <span className="mono">{profile.maxRating}</span>
        </span>
      </div>
      <div className="cp-ladder__ticks mono" aria-hidden="true">
        {ladder.bands.map((b) => (
          <span key={b.name} style={{ width: `${((b.to - b.from) / span) * 100}%` }}>
            {b.from}
          </span>
        ))}
      </div>
    </div>
  );
}

export default function CodeApp({ params, nonce, onView }: AppProps) {
  const [focus, setFocus] = useState<string | undefined>(params.view);
  const refs = useRef<Record<string, HTMLElement | null>>({});

  useEffect(() => {
    setFocus(params.view);
  }, [nonce, params.view]);

  useEffect(() => {
    if (!focus) return;
    onView(focus);
    refs.current[focus]?.scrollIntoView({ block: 'nearest', behavior: 'smooth' });
  }, [focus, onView]);

  return (
    <div className="app__main cp">
      <div className="app__pad stack-lg">
        <header className="xp-head">
          <div>
            <p className="label">code.cp</p>
            <h2 className="page-title">Competitive programming</h2>
            <p className="page-sub">Contest-tested problem solving — data structures and algorithms.</p>
          </div>
        </header>

        <div className="cp-cards">
          {codingProfiles.map((p) => (
            <section
              key={p.id}
              ref={(el) => {
                refs.current[p.id] = el;
              }}
              className={`cp-card panel${focus === p.id ? ' is-focus' : ''}`}
              aria-labelledby={`cp-${p.id}`}
              onClick={() => setFocus(p.id)}
            >
              <div className="cp-card__cmd mono">
                <span className="t-ok">$</span> {p.id} profile <span className="t-accent">{p.handle}</span>
              </div>
              <div className="cp-card__head">
                <h3 id={`cp-${p.id}`}>{p.platform}</h3>
                <a className="btn btn--sm btn--ghost" href={p.url} target="_blank" rel="noreferrer" onClick={(e) => e.stopPropagation()}>
                  profile <ArrowUpRight size={12} />
                </a>
              </div>
              <dl className="cp-card__kv mono">
                <div>
                  <dt>title</dt>
                  <dd className="cp-title">{p.title}</dd>
                </div>
                <div>
                  <dt>max_rating</dt>
                  <dd className="cp-rating">{p.maxRating}</dd>
                </div>
                <div>
                  <dt>status</dt>
                  <dd>{p.note.toLowerCase()}</dd>
                </div>
              </dl>
              <RankLadder profile={p} />
            </section>
          ))}
        </div>

        <section aria-labelledby="cp-contests">
          <div className="section-head">
            <h3 id="cp-contests">Documented contest results</h3>
            <span className="label">global rank</span>
          </div>
          <div className="cp-table" role="table" aria-label="Contest results">
            <div className="cp-row cp-row--head label" role="row">
              <span role="columnheader">contest</span>
              <span role="columnheader">platform</span>
              <span role="columnheader">rank</span>
            </div>
            {contests.map((c) => (
              <div key={c.contest} className="cp-row" role="row">
                <span role="cell">{c.contest}</span>
                <span role="cell" className="mono t-dim">
                  {c.platform}
                </span>
                <span role="cell" className="mono cp-rank">
                  #{c.rank}
                </span>
              </div>
            ))}
          </div>
        </section>

        <p className="note">
          Ratings are the documented maxima from the resume. Rank bands use each platform&rsquo;s public thresholds; no rating
          history is shown because none is documented here.
        </p>
      </div>
    </div>
  );
}
