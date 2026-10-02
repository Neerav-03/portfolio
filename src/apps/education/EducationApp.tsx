import { education, exams } from '../../data/portfolio';
import type { AppProps } from '../registry';
import './education.css';

const TIMELINE = [
  { when: '2021', what: 'JEE Main', detail: 'AIR 2220 · 99.80 percentile' },
  { when: '2021', what: 'JEE Advanced', detail: 'AIR 3150' },
  { when: 'Dec 2021', what: 'IIT (BHU) Varanasi', detail: 'B.Tech, Electrical Engineering' },
  { when: 'May 2025', what: 'Graduated', detail: `GPA ${education.gpa} / ${education.gpaScale}` },
  { when: 'Jul 2025', what: 'Netradyne', detail: 'Software Engineer' },
];

function GpaGauge({ value, scale }: { value: number; scale: number }) {
  const r = 52;
  const c = 2 * Math.PI * r;
  const arc = 0.75; // 270° gauge
  const frac = value / scale;
  return (
    <svg viewBox="0 0 140 140" className="edu-gauge" role="img" aria-label={`GPA ${value} out of ${scale}`}>
      <g transform="rotate(135 70 70)">
        <circle cx="70" cy="70" r={r} className="edu-gauge__track" strokeDasharray={`${c * arc} ${c}`} />
        <circle cx="70" cy="70" r={r} className="edu-gauge__value" strokeDasharray={`${c * arc * frac} ${c}`} />
      </g>
      <text x="70" y="70" textAnchor="middle" className="edu-gauge__num">
        {value}
      </text>
      <text x="70" y="90" textAnchor="middle" className="edu-gauge__scale">
        / {scale} GPA
      </text>
    </svg>
  );
}

export default function EducationApp(_props: AppProps) {
  const main = exams.find((e) => e.exam === 'JEE Main')!;
  const adv = exams.find((e) => e.exam === 'JEE Advanced')!;
  return (
    <div className="app__main edu">
      <div className="app__pad stack-lg">
        <header className="xp-head">
          <div>
            <p className="label">education.sys</p>
            <h2 className="page-title">{education.institution}</h2>
            <p className="page-sub">
              {education.degree} · {education.start} – {education.end}
            </p>
          </div>
          <span className="chip">
            <span className="dot dot--ok" /> completed
          </span>
        </header>

        <section className="edu-grid">
          <div className="panel edu-cell edu-cell--gauge">
            <GpaGauge value={education.gpa} scale={education.gpaScale} />
            <div>
              <p className="label">Cumulative GPA</p>
              <p className="edu-cell__text">B.Tech in Electrical Engineering at {education.shortName}.</p>
            </div>
          </div>

          <div className="panel edu-cell">
            <p className="label">JEE Advanced {adv.year}</p>
            <p className="edu-big mono">{adv.rank}</p>
            <p className="edu-cell__text">All India Rank</p>
          </div>

          <div className="panel edu-cell">
            <p className="label">JEE Main {main.year}</p>
            <p className="edu-big mono">{main.rank}</p>
            <div className="edu-pct" aria-label={`${main.percentile?.toFixed(2)} percentile`}>
              <div className="edu-pct__bar">
                <span style={{ width: `${main.percentile}%` }} />
              </div>
              <span className="mono">{main.percentile?.toFixed(2)} percentile</span>
            </div>
          </div>
        </section>

        <section aria-labelledby="edu-timeline">
          <div className="section-head">
            <h3 id="edu-timeline">Process log</h3>
            <span className="label">2021 → 2025</span>
          </div>
          <ol className="edu-log">
            {TIMELINE.map((t, i) => (
              <li key={t.what} style={{ animationDelay: `${i * 70}ms` }}>
                <span className="edu-log__when mono">{t.when}</span>
                <span className="edu-log__node" aria-hidden="true" />
                <span className="edu-log__what">{t.what}</span>
                <span className="edu-log__detail">{t.detail}</span>
              </li>
            ))}
          </ol>
        </section>
      </div>
    </div>
  );
}
