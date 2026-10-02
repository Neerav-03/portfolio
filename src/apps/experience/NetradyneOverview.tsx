import { ArrowRight, KeyRound, ShieldCheck, Timer, type LucideIcon } from 'lucide-react';
import { useState } from 'react';
import type { ExperienceEntry } from '../../data/types';
import { ArchitectureGraph } from '../../components/ArchitectureGraph';
import { Conceptual, Stat } from '../../components/Conceptual';
import { MODULE_HIGHLIGHT, NODE_INFO, PLATFORM_EDGES, PLATFORM_NODES } from './netradyneGraph';
import type { ExpView } from './ExperienceApp';

interface ModuleCard {
  view: Extract<ExpView, 'drp' | 'dal' | 'encryption'>;
  code: string;
  title: string;
  summary: string;
  facts: string[];
  icon: LucideIcon;
}

const MODULES: ModuleCard[] = [
  {
    view: 'drp',
    code: 'DRP',
    title: 'Data Retention Policy',
    summary: 'Configurable video retention enforced across core services, backed by banded S3 buckets.',
    facts: ['5 tiers · 62–403 days', 'lifecycle tagging', 'presigned-URL gating'],
    icon: Timer,
  },
  {
    view: 'dal',
    code: 'DAL',
    title: 'GDPR Data Access Levels',
    summary: 'A 4-tier, config-driven privacy framework enforcing per-tenant data-access restrictions.',
    facts: ['4 levels', 'validation guards', 'audit logging'],
    icon: ShieldCheck,
  },
  {
    view: 'encryption',
    code: 'TEK',
    title: 'Encryption migration',
    summary: 'Moved from AWS CMK to tenant-specific local encryption, refactoring key storage and decryption.',
    facts: ['CMK → TEK', 'per-tenant keys', 'lower KMS cost'],
    icon: KeyRound,
  },
];

export function NetradyneOverview({ entry, onOpen }: { entry: ExperienceEntry; onOpen: (v: ExpView) => void }) {
  const [hoverModule, setHoverModule] = useState<ModuleCard['view'] | null>(null);
  const [selected, setSelected] = useState<string | null>('services');

  // A selected node lights up together with its direct neighbours.
  const neighbours = selected
    ? PLATFORM_EDGES.flatMap((e) => (e.from === selected ? [e.to] : e.to === selected ? [e.from] : []))
    : [];
  const active = hoverModule ? MODULE_HIGHLIGHT[hoverModule] : selected ? [selected, ...neighbours] : [];
  const info = selected ? NODE_INFO[selected] : null;

  return (
    <div className="stack-lg">
      <section aria-labelledby="sysmap-title" className="stack">
        <div className="section-head">
          <h3 id="sysmap-title">
            <span className="label">Video platform</span> · system map
          </h3>
          <span className="label">select a node</span>
        </div>
        <div className="xp-map">
          <ArchitectureGraph
            label="Conceptual video platform map: device, video services, S3, IAM, KMS, PostgreSQL and the retention system"
            nodes={PLATFORM_NODES}
            edges={PLATFORM_EDGES}
            width={760}
            height={420}
            active={active}
            selected={hoverModule ? null : selected}
            onSelect={(id) => setSelected((cur) => (cur === id ? null : id))}
            center
            flow
            minWidth={620}
          />
          <aside className="xp-inspector panel" aria-live="polite">
            {info ? (
              <>
                <p className="label">inspector</p>
                <h4 className="xp-inspector__title mono">{info.title}</h4>
                <p className="xp-inspector__body">{info.body}</p>
                {info.modules.length > 0 && (
                  <div className="chips">
                    {info.modules.map((m) => (
                      <button key={m} className="chip chip--accent" onClick={() => onOpen(m)}>
                        {m === 'encryption' ? 'TEK' : m.toUpperCase()} <ArrowRight size={11} />
                      </button>
                    ))}
                  </div>
                )}
              </>
            ) : (
              <p className="xp-inspector__body">Select a node to see which documented work touches it.</p>
            )}
          </aside>
        </div>
        <Conceptual />
      </section>

      <section aria-labelledby="modules-title-xp">
        <div className="section-head">
          <h3 id="modules-title-xp">Engineering modules</h3>
          <span className="label">click to zoom in</span>
        </div>
        <div className="xp-modules">
          {MODULES.map((m) => (
            <button
              key={m.view}
              className="xp-module"
              onClick={() => onOpen(m.view)}
              onMouseEnter={() => setHoverModule(m.view)}
              onMouseLeave={() => setHoverModule(null)}
              onFocus={() => setHoverModule(m.view)}
              onBlur={() => setHoverModule(null)}
            >
              <span className="xp-module__top">
                <span className="xp-module__code mono">
                  <m.icon size={13} aria-hidden="true" /> {m.code}
                </span>
                <ArrowRight size={14} className="xp-module__go" aria-hidden="true" />
              </span>
              <span className="xp-module__title">{m.title}</span>
              <span className="xp-module__summary">{m.summary}</span>
              <span className="chips">
                {m.facts.map((f) => (
                  <span key={f} className="chip">
                    {f}
                  </span>
                ))}
              </span>
            </button>
          ))}
        </div>
      </section>

      <section className="stats" aria-label="Documented scope">
        <Stat value="5" label="S3 duration tiers" />
        <Stat value="62–403" label="days of retention range" />
        <Stat value="4" label="GDPR access levels" />
        <Stat value="0" label="objects migrated" />
      </section>

      <section aria-labelledby="resume-bullets">
        <div className="section-head">
          <h3 id="resume-bullets">As documented</h3>
          <span className="label">resume · verbatim</span>
        </div>
        <ul className="bullets">
          {entry.bullets.map((b, i) => (
            <li key={i}>{b}</li>
          ))}
        </ul>
      </section>
    </div>
  );
}
