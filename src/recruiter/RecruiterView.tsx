import { ArrowUpRight, Download, Eye, Mail, Search } from 'lucide-react';
import {
  codingProfiles,
  contests,
  education,
  exams,
  experience,
  extracurriculars,
  profile,
  projects,
  resumeUrl,
  skills,
} from '../data/portfolio';
import { Avatar } from '../components/Avatar';
import { GitHubIcon, LinkedInIcon } from '../components/BrandIcons';
import { MOD_LABEL } from '../lib/platform';
import { appHref } from '../lib/route';
import { ModeToggle } from '../os/ModeToggle';
import { ThemeToggle } from '../os/ThemeToggle';
import { useOS } from '../os/useOS';
import { Logo } from '../os/TopBar';
import './recruiter.css';

/** Map Netradyne bullets to their interactive deep-dive in System mode. */
const NETRADYNE_DEEP_LINKS = ['drp', 'drp', 'dal', 'encryption'];

function Section({
  index,
  title,
  id,
  children,
}: {
  index: string;
  title: string;
  id: string;
  children: React.ReactNode;
}) {
  return (
    <section className="rv-section" aria-labelledby={id}>
      <div className="rv-section__label mono">
        <span>{index}</span>
        <h2 id={id}>{title}</h2>
      </div>
      <div className="rv-section__body">{children}</div>
    </section>
  );
}

export function RecruiterView() {
  const { setPalette, copyEmail, previewResume } = useOS();
  const cf = codingProfiles[0];
  const cc = codingProfiles[1];

  return (
    <div className="rv">
      <header className="rv-bar">
        <span className="rv-bar__brand mono">
          <Logo /> NEERAV OS
          <span className="rv-bar__mode">recruiter mode</span>
        </span>
        <div className="rv-bar__right">
          <button className="topbar__btn mono" onClick={() => setPalette(true)} aria-label="Open command palette">
            <Search size={13} />
            <span className="topbar__hint">
              <span className="kbd">{MOD_LABEL}</span>
              <span className="kbd">K</span>
            </span>
          </button>
          <ThemeToggle />
          <ModeToggle />
        </div>
      </header>

      <main id="main" className="rv-main">
        <div className="rv-hero">
          <p className="label rv-hero__eyebrow">
            <span className="dot dot--ok" /> Profile · {profile.location}
          </p>
          <div className="rv-hero__who">
            <Avatar size={92} />
            <div>
              <h1 className="rv-hero__name">{profile.name}</h1>
              <p className="rv-hero__role">
                {profile.title} at <strong>{profile.company}</strong>
              </p>
              <p className="rv-hero__meta">
                {education.shortName} · {education.degree} · GPA {education.gpa}/{education.gpaScale}
              </p>
            </div>
          </div>
          <div className="chips rv-hero__stack" aria-label="Core stack">
            {profile.coreStack.map((s) => (
              <span key={s} className="chip chip--accent">
                {s}
              </span>
            ))}
          </div>
          <div className="rv-hero__actions">
            <span className="rv-resume">
              <a className="btn btn--primary" href={resumeUrl} download={profile.resumeFile}>
                <Download size={14} /> Download Resume
              </a>
              <button className="btn" onClick={previewResume}>
                <Eye size={14} /> Preview
              </button>
            </span>
            <a className="btn" href={profile.links.github} target="_blank" rel="noreferrer">
              <GitHubIcon size={14} /> GitHub
            </a>
            <a className="btn" href={profile.links.linkedin} target="_blank" rel="noreferrer">
              <LinkedInIcon size={14} /> LinkedIn
            </a>
            <button className="btn btn--ghost" onClick={copyEmail}>
              <Mail size={14} /> {profile.email}
            </button>
          </div>
        </div>

        <div className="stats rv-stats">
          <div className="stat">
            <div className="stat__value">Jul 2025</div>
            <div className="stat__label">SWE at Netradyne</div>
          </div>
          <div className="stat">
            <div className="stat__value">{education.gpa}</div>
            <div className="stat__label">GPA · IIT (BHU)</div>
          </div>
          <div className="stat">
            <div className="stat__value">{cf.maxRating}</div>
            <div className="stat__label">Codeforces {cf.title}</div>
          </div>
          <div className="stat">
            <div className="stat__value">{cc.maxRating}</div>
            <div className="stat__label">CodeChef {cc.title}</div>
          </div>
          <div className="stat">
            <div className="stat__value">{exams[0].rank.replace('AIR ', '#')}</div>
            <div className="stat__label">JEE Advanced 2021 AIR</div>
          </div>
        </div>

        <Section index="01" title="Experience" id="rv-exp">
          {experience.map((e) => (
            <article key={e.id} className="rv-entry">
              <div className="rv-entry__head">
                <h3>
                  {e.role} · <span>{e.company}</span>
                </h3>
                <span className="rv-entry__date mono">
                  {e.start} – {e.end}
                </span>
              </div>
              <p className="rv-entry__loc">{e.location}</p>
              <ul className="bullets">
                {e.bullets.map((b, i) => (
                  <li key={i}>
                    {b}
                    {e.id === 'netradyne' && (
                      <a className="rv-deep mono" href={appHref('experience', NETRADYNE_DEEP_LINKS[i])}>
                        explore <ArrowUpRight size={11} />
                      </a>
                    )}
                    {e.id === 'exl' && i === 0 && (
                      <a className="rv-deep mono" href={appHref('experience', 'exl')}>
                        explore <ArrowUpRight size={11} />
                      </a>
                    )}
                  </li>
                ))}
              </ul>
            </article>
          ))}
        </Section>

        <Section index="02" title="Projects" id="rv-proj">
          <div className="rv-projects">
            {projects.map((p) => (
              <article key={p.id} className="rv-project panel">
                <div className="rv-entry__head">
                  <h3>{p.name}</h3>
                  <a className="mono rv-repo" href={p.repo} target="_blank" rel="noreferrer">
                    <GitHubIcon size={12} /> repo
                  </a>
                </div>
                <p className="rv-project__tag">{p.tagline}</p>
                <div className="chips">
                  {p.tech.map((t) => (
                    <span key={t} className="chip">
                      {t}
                    </span>
                  ))}
                </div>
                <ul className="bullets">
                  {p.bullets.map((b, i) => (
                    <li key={i}>{b}</li>
                  ))}
                </ul>
                <a className="rv-deep mono" href={appHref('projects', p.id)}>
                  view architecture <ArrowUpRight size={11} />
                </a>
              </article>
            ))}
          </div>
        </Section>

        <Section index="03" title="Skills" id="rv-skills">
          <dl className="rv-skills">
            {skills.map((g) => (
              <div key={g.label}>
                <dt className="label">{g.label}</dt>
                <dd className="chips">
                  {g.items.map((s) => (
                    <span key={s} className="chip">
                      {s}
                    </span>
                  ))}
                </dd>
              </div>
            ))}
          </dl>
        </Section>

        <Section index="04" title="Achievements" id="rv-ach">
          <ul className="bullets">
            {codingProfiles.map((c) => (
              <li key={c.id}>
                <strong>{c.title}</strong> on{' '}
                <a href={c.url} target="_blank" rel="noreferrer">
                  {c.platform}
                </a>{' '}
                — maximum rating {c.maxRating}
              </li>
            ))}
            {contests.map((c) => (
              <li key={c.contest}>
                Global rank {c.rank} — {c.contest}
              </li>
            ))}
            {exams.map((x) => (
              <li key={x.exam}>
                {x.rank} in {x.exam} {x.year}
                {x.percentile ? ` (${x.percentile.toFixed(2)} percentile)` : ''}
              </li>
            ))}
          </ul>
        </Section>

        <Section index="05" title="Education" id="rv-edu">
          <div className="rv-entry">
            <div className="rv-entry__head">
              <h3>{education.institution}</h3>
              <span className="rv-entry__date mono">
                {education.start} – {education.end}
              </span>
            </div>
            <p className="rv-entry__loc">
              {education.degree} · GPA {education.gpa}/{education.gpaScale}
            </p>
          </div>
        </Section>

        <Section index="06" title="Beyond code" id="rv-extra">
          <ul className="bullets">
            {extracurriculars.map((x) => (
              <li key={x.id}>
                <strong>{x.name}</strong> — {x.detail}
                {x.id === 'aptiquest' && ' 400+ participants.'}
              </li>
            ))}
          </ul>
        </Section>

        <footer className="rv-foot mono">
          <span>NEERAV OS v1.0 · built as a product, not a template</span>
          <a href={appHref('experience', 'netradyne')}>Enter System mode →</a>
        </footer>
      </main>
    </div>
  );
}
