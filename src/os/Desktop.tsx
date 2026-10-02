import { ArrowUpRight, Download, Eye, Mail } from 'lucide-react';
import type { AppId, AppParams } from '../data/types';
import { codingProfiles, education, exams, profile, resumeUrl } from '../data/portfolio';
import { preloadApp } from '../apps/registry';
import { GitHubIcon, LinkedInIcon } from '../components/BrandIcons';
import { MOD_LABEL } from '../lib/platform';
import { APP_META, DESKTOP_APPS } from './appMeta';
import { useOS } from './OSContext';

interface ModuleLink {
  code: string;
  title: string;
  sub: string;
  app: AppId;
  params?: AppParams;
}

export const FEATURED_MODULES: ModuleLink[] = [
  { code: 'SYS', title: 'Netradyne system map', sub: 'Conceptual platform overview', app: 'experience', params: { view: 'netradyne' } },
  { code: 'DRP', title: 'Data Retention Policy', sub: '5 S3 duration tiers · 62–403 days', app: 'experience', params: { view: 'drp' } },
  { code: 'DAL', title: 'GDPR Data Access Levels', sub: '4-tier config-driven privacy', app: 'experience', params: { view: 'dal' } },
  { code: 'TEK', title: 'Encryption migration', sub: 'AWS CMK → tenant-specific keys', app: 'experience', params: { view: 'encryption' } },
  { code: 'EXL', title: 'Price monitoring dashboard', sub: '5 stores · 2 years · 857 products', app: 'experience', params: { view: 'exl' } },
  { code: 'MM', title: 'MovieMate', sub: 'Next.js · Flask · TF-IDF', app: 'projects', params: { view: 'moviemate' } },
  { code: 'DL', title: 'Doc-Link', sub: 'React · Express · MongoDB', app: 'projects', params: { view: 'doclink' } },
];

export function IdentityCard() {
  const { copyEmail, openApp, previewResume } = useOS();
  return (
    <section className="widget identity" aria-labelledby="identity-name">
      <div className="widget__head">
        <span className="label">Identity</span>
        <span className="label">neerav@neerav-os</span>
      </div>
      <h1 id="identity-name" className="identity__name">
        {profile.name}
      </h1>
      <p className="identity__role">
        {profile.title} · <strong>{profile.company}</strong>
      </p>
      <dl className="kv">
        <div>
          <dt>edu</dt>
          <dd>
            {education.shortName} · B.Tech EE · GPA {education.gpa}
          </dd>
        </div>
        <div>
          <dt>since</dt>
          <dd>Jul 2025 · {profile.location}</dd>
        </div>
        <div>
          <dt>stack</dt>
          <dd className="chips">
            {profile.coreStack.map((s) => (
              <span className="chip" key={s}>
                {s}
              </span>
            ))}
          </dd>
        </div>
      </dl>
      <div className="identity__resume">
        <span className="label">Resume</span>
        <div className="identity__actions">
          <button className="btn btn--primary btn--sm" onClick={previewResume} onMouseEnter={() => preloadApp('resume')}>
            <Eye size={13} /> Preview
          </button>
          <a className="btn btn--sm" href={resumeUrl} download={profile.resumeFile}>
            <Download size={13} /> Download
          </a>
        </div>
      </div>
      <div className="identity__actions">
        <a className="btn btn--sm" href={profile.links.github} target="_blank" rel="noreferrer">
          <GitHubIcon size={13} /> GitHub
        </a>
        <a className="btn btn--sm" href={profile.links.linkedin} target="_blank" rel="noreferrer">
          <LinkedInIcon size={13} /> LinkedIn
        </a>
        <button className="btn btn--sm btn--ghost" onClick={copyEmail} aria-label={`Copy email address ${profile.email}`}>
          <Mail size={13} /> Email
        </button>
      </div>
      <button className="identity__start" onClick={() => openApp('experience', { view: 'netradyne' })} onMouseEnter={() => preloadApp('experience')}>
        <span>
          <span className="label">Start here</span>
          <span className="identity__start-title">Explore the Netradyne systems</span>
        </span>
        <ArrowUpRight size={16} />
      </button>
    </section>
  );
}

function ModulesWidget() {
  const { openApp } = useOS();
  return (
    <section className="widget" aria-labelledby="modules-title">
      <div className="widget__head">
        <h2 id="modules-title" className="label">
          Engineering modules
        </h2>
        <span className="label">{FEATURED_MODULES.length} loaded</span>
      </div>
      <ul className="modules">
        {FEATURED_MODULES.map((m) => (
          <li key={m.code}>
            <button className="module-row" onClick={() => openApp(m.app, m.params)} onMouseEnter={() => preloadApp(m.app)}>
              <span className="module-row__code mono">{m.code}</span>
              <span className="module-row__text">
                <span className="module-row__title">{m.title}</span>
                <span className="module-row__sub">{m.sub}</span>
              </span>
              <span className="dot dot--ok" aria-hidden="true" />
            </button>
          </li>
        ))}
      </ul>
    </section>
  );
}

function TelemetryWidget() {
  const cf = codingProfiles[0];
  const cc = codingProfiles[1];
  const adv = exams[0];
  const rows: [string, string][] = [
    ['codeforces.max', `${cf.maxRating} · ${cf.title}`],
    ['codechef.max', `${cc.maxRating} · ${cc.title}`],
    ['gpa', `${education.gpa} / ${education.gpaScale}`],
    ['jee_adv.2021', adv.rank],
  ];
  return (
    <section className="widget" aria-labelledby="telemetry-title">
      <div className="widget__head">
        <h2 id="telemetry-title" className="label">
          Telemetry
        </h2>
      </div>
      <dl className="telemetry mono">
        {rows.map(([k, v]) => (
          <div key={k}>
            <dt>{k}</dt>
            <dd>{v}</dd>
          </div>
        ))}
      </dl>
    </section>
  );
}

export function DesktopIcons() {
  const { openApp, setTerminal } = useOS();
  return (
    <nav className="desk-icons" aria-label="Applications">
      {DESKTOP_APPS.map((id) => {
        const meta = APP_META[id];
        return (
          <button key={id} className="desk-icon" onClick={() => openApp(id)} onMouseEnter={() => preloadApp(id)} onFocus={() => preloadApp(id)}>
            <span className="desk-icon__glyph">
              <meta.icon size={20} strokeWidth={1.6} />
            </span>
            <span className="desk-icon__label mono">{meta.title.toUpperCase()}</span>
          </button>
        );
      })}
      <button className="desk-icon" onClick={() => setTerminal(true)}>
        <span className="desk-icon__glyph desk-icon__glyph--term mono">&gt;_</span>
        <span className="desk-icon__label mono">TERMINAL</span>
      </button>
    </nav>
  );
}

export function Desktop() {
  return (
    <main id="main" className="desktop">
      <DesktopIcons />
      <aside className="desk-widgets" aria-label="Overview">
        <IdentityCard />
        <ModulesWidget />
        <TelemetryWidget />
      </aside>
      <p className="desk-hint mono" aria-hidden="true">
        <span className="kbd">{MOD_LABEL}</span>
        <span className="kbd">K</span> search
        <span className="desk-hint__sep" />
        <span className="kbd">{MOD_LABEL === 'Ctrl' ? 'Ctrl' : '⌃'}</span>
        <span className="kbd">`</span> terminal
        <span className="desk-hint__sep" />
        <span className="kbd">Esc</span> close window
      </p>
    </main>
  );
}
