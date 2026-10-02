import { Lock, Mail, Unlock } from 'lucide-react';
import { useCallback, useEffect, useState } from 'react';
import { education, extracurriculars, profile } from '../../data/portfolio';
import type { Extracurricular } from '../../data/types';
import { Avatar } from '../../components/Avatar';
import { GitHubIcon, LinkedInIcon } from '../../components/BrandIcons';
import { useReducedMotion } from '../../hooks/useMediaQuery';
import { useOS } from '../../os/useOS';
import type { AppProps } from '../registry';
import './about.css';

type ModId = Extracurricular['id'];

function useCountUp(target: number, run: boolean, ms = 900) {
  const reduced = useReducedMotion();
  const [v, setV] = useState(0);
  useEffect(() => {
    if (!run || reduced) return;
    let raf = 0;
    const start = performance.now();
    const tick = (now: number) => {
      const t = Math.min(1, (now - start) / ms);
      setV(Math.round(target * (1 - Math.pow(1 - t, 3))));
      if (t < 1) raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [target, run, ms, reduced]);
  return reduced && run ? target : v;
}

function Aptiquest({ data }: { data: Extracurricular }) {
  const n = useCountUp(400, true);
  const [reveal, setReveal] = useState(false);
  return (
    <div className="ab-mod__body">
      <p className="ab-stat mono">
        {n}
        {n === 400 ? '+' : ''} <span>participants</span>
      </p>
      <p className="ab-text">{data.detail}</p>
      <div className="chips">
        {['number theory', 'geometry', 'combinatorics', 'probability', 'puzzles'].map((t) => (
          <span key={t} className="chip">
            {t}
          </span>
        ))}
      </div>
      <div className="ab-puzzle">
        <p className="label">sample warm-up</p>
        <p className="ab-text">How many trailing zeros does 100! have?</p>
        {reveal ? (
          <p className="ab-text mono t-ok">⌊100/5⌋ + ⌊100/25⌋ = 20 + 4 = 24</p>
        ) : (
          <button className="btn btn--sm" onClick={() => setReveal(true)}>
            Reveal
          </button>
        )}
      </div>
    </div>
  );
}

function Admad({ data }: { data: Extracurricular }) {
  return (
    <div className="ab-mod__body">
      <p className="ab-stat mono">
        18 <span>teams managed</span>
      </p>
      <p className="ab-text">{data.detail}</p>
      <div className="ab-teams" aria-hidden="true">
        {Array.from({ length: 18 }, (_, i) => (
          <span key={i} style={{ animationDelay: `${i * 45}ms` }}>
            {String(i + 1).padStart(2, '0')}
          </span>
        ))}
      </div>
    </div>
  );
}

function Karate({ data, onStrike }: { data: Extracurricular; onStrike: () => void }) {
  const [tied, setTied] = useState(false);
  useEffect(() => {
    const t = window.setTimeout(() => {
      setTied(true);
      onStrike();
    }, 900);
    return () => window.clearTimeout(t);
  }, [onStrike]);
  return (
    <div className="ab-mod__body">
      <div className={`ab-belt${tied ? ' is-tied' : ''}`} aria-hidden="true">
        <span className="ab-belt__fill" />
        <span className="ab-belt__knot" />
      </div>
      <p className="ab-stat mono">
        初段 <span>Shodan · 1st Dan</span>
      </p>
      <p className="ab-text">{data.detail}</p>
      {tied && <p className="ab-kiai mono">押忍</p>}
    </div>
  );
}

export default function AboutApp({ params, nonce, onView }: AppProps) {
  const { copyEmail } = useOS();
  const [loaded, setLoaded] = useState<Set<ModId>>(() => new Set(params.view === 'karate' ? ['karate'] : []));
  const [strike, setStrike] = useState(false);
  const [seenNonce, setSeenNonce] = useState(nonce);

  if (nonce !== seenNonce) {
    setSeenNonce(nonce);
    if (params.view === 'karate') setLoaded((s) => new Set(s).add('karate'));
  }

  useEffect(() => {
    if (loaded.has('karate')) onView('karate');
  }, [loaded, onView]);

  const onStrike = useCallback(() => {
    setStrike(true);
    window.setTimeout(() => setStrike(false), 420);
  }, []);

  const load = (id: ModId) => setLoaded((s) => new Set(s).add(id));

  return (
    <div className={`app__main ab${strike ? ' is-strike' : ''}`}>
      <div className="app__pad stack-lg">
        <header className="ab-head">
          <Avatar size={84} />
          <div>
            <p className="label">about.md</p>
            <h2 className="page-title">{profile.name}</h2>
            <p className="page-sub">
              {profile.title} · {profile.company} · {profile.location}
            </p>
          </div>
        </header>

        <section className="stack">
          <p className="prose">{profile.summary}</p>
          <p className="prose">
            Graduated from {education.institution} in {education.end}. Areas of interest: data structures, algorithms,
            operating systems and object-oriented programming.
          </p>
          <div className="identity__actions">
            <button className="btn btn--sm" onClick={copyEmail}>
              <Mail size={13} /> {profile.email}
            </button>
            <a className="btn btn--sm" href={profile.links.github} target="_blank" rel="noreferrer">
              <GitHubIcon size={13} /> GitHub
            </a>
            <a className="btn btn--sm" href={profile.links.linkedin} target="_blank" rel="noreferrer">
              <LinkedInIcon size={13} /> LinkedIn
            </a>
          </div>
        </section>

        <section aria-labelledby="ab-mods">
          <div className="section-head">
            <h3 id="ab-mods">Hidden modules</h3>
            <span className="label">
              {loaded.size}/{extracurriculars.length} loaded
            </span>
          </div>
          <div className="ab-mods">
            {extracurriculars.map((x) => {
              const isLoaded = loaded.has(x.id);
              return (
                <article key={x.id} className={`ab-mod panel${isLoaded ? ' is-loaded' : ''}`}>
                  <div className="ab-mod__head">
                    <span className="mono ab-mod__file">{x.id}.ko</span>
                    {isLoaded ? (
                      <Unlock size={13} className="t-ok" aria-hidden="true" />
                    ) : (
                      <Lock size={13} aria-hidden="true" />
                    )}
                  </div>
                  <h4 className="ab-mod__name">{x.name}</h4>
                  <p className="ab-mod__role mono">{x.role}</p>
                  {isLoaded ? (
                    x.id === 'aptiquest' ? (
                      <Aptiquest data={x} />
                    ) : x.id === 'admad' ? (
                      <Admad data={x} />
                    ) : (
                      <Karate data={x} onStrike={onStrike} />
                    )
                  ) : (
                    <button className="btn btn--sm ab-load mono" onClick={() => load(x.id)}>
                      $ modprobe {x.id}
                    </button>
                  )}
                </article>
              );
            })}
          </div>
        </section>
      </div>
    </div>
  );
}
