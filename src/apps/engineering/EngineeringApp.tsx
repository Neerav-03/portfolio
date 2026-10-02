import { ArrowUpRight } from 'lucide-react';
import { useState } from 'react';
import type { AppId, AppParams } from '../../data/types';
import { useOS } from '../../os/OSContext';
import type { AppProps } from '../registry';
import './engineering.css';

interface Context {
  id: string;
  label: string;
  sub: string;
  app?: AppId;
  params?: AppParams;
}

const CONTEXTS: Context[] = [
  { id: 'netradyne', label: 'Netradyne', sub: 'SWE', app: 'experience', params: { view: 'netradyne' } },
  { id: 'exl', label: 'EXL', sub: 'Intern', app: 'experience', params: { view: 'exl' } },
  { id: 'moviemate', label: 'MovieMate', sub: 'Project', app: 'projects', params: { view: 'moviemate' } },
  { id: 'doclink', label: 'Doc-Link', sub: 'Project', app: 'projects', params: { view: 'doclink' } },
  { id: 'cp', label: 'CP', sub: 'Contests', app: 'code' },
];

interface Skill {
  name: string;
  group: 'Languages' | 'Cloud' | 'Data' | 'Web' | 'Methods';
  /** Contexts where the resume documents this skill. Empty = listed in the Skills section. */
  used: string[];
  note?: string;
}

/** Every mapping below is taken from the resume (or the project descriptions it links to). */
const SKILLS: Skill[] = [
  { name: 'C/C++', group: 'Languages', used: [] },
  { name: 'Java', group: 'Languages', used: [] },
  { name: 'JavaScript', group: 'Languages', used: [] },
  { name: 'SQL', group: 'Languages', used: [] },
  { name: 'AWS S3', group: 'Cloud', used: ['netradyne'], note: 'Banded buckets, lifecycle tagging, presigned URLs' },
  { name: 'AWS IAM', group: 'Cloud', used: ['netradyne'], note: 'Cross-environment IAM for banded buckets' },
  { name: 'AWS KMS', group: 'Cloud', used: ['netradyne'], note: 'CMK → tenant-specific encryption, lower KMS cost' },
  { name: 'AWS Lambda', group: 'Cloud', used: [] },
  { name: 'AWS EventBridge', group: 'Cloud', used: [] },
  { name: 'PostgreSQL', group: 'Data', used: [] },
  { name: 'MongoDB', group: 'Data', used: ['doclink'], note: 'Database service for Doc-Link' },
  { name: 'React', group: 'Web', used: ['doclink'], note: 'Admin / User / Doctor interfaces' },
  { name: 'Next.js', group: 'Web', used: ['moviemate'], note: 'Movie details via the TMDB API' },
  { name: 'Node.js', group: 'Web', used: ['doclink'] },
  { name: 'Express', group: 'Web', used: ['doclink'] },
  { name: 'Flask', group: 'Web', used: ['moviemate'], note: 'Recommendation backend' },
  { name: 'bcrypt.js', group: 'Web', used: ['doclink'], note: 'Password hashing for authentication' },
  { name: 'TF-IDF', group: 'Methods', used: ['moviemate'], note: 'Vectorization for recommendations' },
  { name: 'RFM segmentation', group: 'Methods', used: ['exl'], note: 'Customer segmentation' },
  { name: 'Price elasticity', group: 'Methods', used: ['exl'], note: 'Elasticity view for pricing' },
  { name: 'Data retention', group: 'Methods', used: ['netradyne'], note: 'DRP enforcement' },
  { name: 'Privacy / GDPR', group: 'Methods', used: ['netradyne'], note: 'Data Access Levels' },
  { name: 'Data structures & algorithms', group: 'Methods', used: ['cp'], note: 'Codeforces Expert · CodeChef 4★' },
];

const GROUPS = ['All', 'Languages', 'Cloud', 'Data', 'Web', 'Methods'] as const;

export default function EngineeringApp(_props: AppProps) {
  const { openApp } = useOS();
  const [group, setGroup] = useState<(typeof GROUPS)[number]>('All');
  const [hoverCtx, setHoverCtx] = useState<string | null>(null);
  const [selected, setSelected] = useState<string | null>('AWS S3');

  // Skills with documented usage first; listed-only skills after (sort is stable).
  const rows = SKILLS.filter((s) => group === 'All' || s.group === group).sort((a, b) => Number(b.used.length > 0) - Number(a.used.length > 0));
  const sel = SKILLS.find((s) => s.name === selected) ?? null;

  return (
    <div className="app__main eng">
      <div className="app__pad stack-lg">
        <header className="xp-head">
          <div>
            <p className="label">engineering.graph</p>
            <h2 className="page-title">Skills, mapped to evidence</h2>
            <p className="page-sub">Each dot is a place the resume documents the skill being used. Hollow rows are listed skills.</p>
          </div>
        </header>

        <div className="tabs" role="tablist" aria-label="Skill group">
          {GROUPS.map((g) => (
            <button key={g} role="tab" className="tab" aria-selected={group === g} onClick={() => setGroup(g)}>
              {g}
              <span className="eng-count mono">{g === 'All' ? SKILLS.length : SKILLS.filter((s) => s.group === g).length}</span>
            </button>
          ))}
        </div>

        <div className="eng-layout">
          <div className="eng-matrix-wrap">
            <table className="eng-matrix" onMouseLeave={() => setHoverCtx(null)}>
              <caption className="sr-only">Skills by where they were used</caption>
              <thead>
                <tr>
                  <th scope="col" className="eng-skillcol label">
                    skill
                  </th>
                  {CONTEXTS.map((c) => (
                    <th key={c.id} scope="col" className={hoverCtx === c.id ? 'is-hover' : undefined} onMouseEnter={() => setHoverCtx(c.id)}>
                      <button className="eng-ctx" onClick={() => c.app && openApp(c.app, c.params)} title={`Open ${c.label}`}>
                        <span>{c.label}</span>
                        <span className="mono">{c.sub}</span>
                      </button>
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {rows.map((s) => (
                  <tr key={s.name} className={`${selected === s.name ? 'is-sel' : ''} ${s.used.length === 0 ? 'is-listed' : ''}`}>
                    <th scope="row">
                      <button className="eng-skill" onClick={() => setSelected(s.name)} aria-pressed={selected === s.name}>
                        <span className={`eng-skill__dot ${s.used.length ? 'is-used' : ''}`} aria-hidden="true" />
                        {s.name}
                      </button>
                    </th>
                    {CONTEXTS.map((c) => {
                      const on = s.used.includes(c.id);
                      return (
                        <td key={c.id} className={hoverCtx === c.id ? 'is-hover' : undefined} onMouseEnter={() => setHoverCtx(c.id)}>
                          {on ? <span className="eng-dot" aria-label={`Used at ${c.label}`} /> : <span className="sr-only">—</span>}
                        </td>
                      );
                    })}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <aside className="panel eng-detail" aria-live="polite">
            {sel ? (
              <>
                <p className="label">{sel.group}</p>
                <h3 className="eng-detail__name">{sel.name}</h3>
                {sel.note && <p className="eng-detail__note">{sel.note}</p>}
                {sel.used.length ? (
                  <ul className="eng-detail__uses">
                    {sel.used.map((u) => {
                      const c = CONTEXTS.find((x) => x.id === u)!;
                      return (
                        <li key={u}>
                          <button className="module-row" onClick={() => c.app && openApp(c.app, c.params)}>
                            <span className="module-row__code mono">{c.label.slice(0, 3).toUpperCase()}</span>
                            <span className="module-row__text">
                              <span className="module-row__title">{c.label}</span>
                              <span className="module-row__sub">{c.sub}</span>
                            </span>
                            <ArrowUpRight size={13} />
                          </button>
                        </li>
                      );
                    })}
                  </ul>
                ) : (
                  <p className="eng-detail__note">Listed in the resume&rsquo;s Skills section.</p>
                )}
              </>
            ) : (
              <p className="eng-detail__note">Select a skill.</p>
            )}
            <div className="eng-interests">
              <p className="label">Areas of interest</p>
              <div className="chips">
                {['Data Structures', 'Algorithms', 'OS', 'OOP'].map((x) => (
                  <span key={x} className="chip">
                    {x}
                  </span>
                ))}
              </div>
            </div>
          </aside>
        </div>
      </div>
    </div>
  );
}
