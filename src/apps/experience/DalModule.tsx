import { Check, Send, TriangleAlert } from 'lucide-react';
import { useEffect, useRef, useState } from 'react';
import { ArchitectureGraph, type GraphEdge, type GraphNode } from '../../components/ArchitectureGraph';
import { Conceptual } from '../../components/Conceptual';

const NODES: GraphNode[] = [
  { id: 'tenant', label: 'TENANT CONFIG', sub: 'access level', x: 330, y: 44, w: 170, kind: 'client' },
  { id: 'backend', label: 'BACKEND', sub: 'service restrictions', x: 170, y: 150, w: 170, kind: 'compute' },
  { id: 'device', label: 'DEVICE CONFIG', sub: 'device restrictions', x: 490, y: 150, w: 170, kind: 'compute' },
  { id: 'guard', label: 'ACCESS VALIDATION', sub: 'validation guards', x: 330, y: 256, w: 190, kind: 'identity' },
  { id: 'audit', label: 'AUDIT LOG', sub: 'change record', x: 330, y: 354, w: 170, kind: 'data' },
];
const EDGES: GraphEdge[] = [
  { from: 'tenant', to: 'backend', route: 'v' },
  { from: 'tenant', to: 'device', route: 'v' },
  { from: 'backend', to: 'guard', route: 'v' },
  { from: 'device', to: 'guard', route: 'v' },
  { from: 'guard', to: 'audit', route: 'v' },
];

/** Stages of the propagation animation → nodes lit at each stage. */
const STAGES: string[][] = [
  [],
  ['tenant'],
  ['tenant', 'backend', 'device'],
  ['tenant', 'backend', 'device', 'guard'],
  ['tenant', 'backend', 'device', 'guard', 'audit'],
];

const TENANTS = ['tenant-a', 'tenant-b', 'tenant-c'];

interface AuditLine {
  id: number;
  time: string;
  tenant: string;
  text: string;
  ok: boolean;
}

export function DalModule() {
  const [levels, setLevels] = useState<Record<string, number>>({ 'tenant-a': 1, 'tenant-b': 3, 'tenant-c': 2 });
  const [tenant, setTenant] = useState('tenant-a');
  const [draft, setDraft] = useState(2);
  const [stage, setStage] = useState(0);
  const [rejected, setRejected] = useState(false);
  const [audit, setAudit] = useState<AuditLine[]>([]);
  const timers = useRef<number[]>([]);

  useEffect(() => () => timers.current.forEach(clearTimeout), []);

  const run = (level: number, valid: boolean) => {
    timers.current.forEach(clearTimeout);
    timers.current = [];
    setRejected(false);
    const lastStage = valid ? 4 : 3;
    for (let s = 1; s <= lastStage; s++) {
      timers.current.push(
        window.setTimeout(() => {
          setStage(s);
          if (s === 3 && !valid) setRejected(true);
          if (s === lastStage) {
            const time = new Date().toLocaleTimeString(undefined, { hour12: false });
            if (valid) setLevels((prev) => ({ ...prev, [tenant]: level }));
            setAudit((prev) =>
              [
                {
                  id: Date.now(),
                  time,
                  tenant,
                  ok: valid,
                  text: valid
                    ? `access level → L${level} · applied to backend + device config`
                    : `invalid level "L${level}" · rejected by validation guard`,
                },
                ...prev,
              ].slice(0, 6),
            );
          }
        }, s * 360),
      );
    }
  };

  const current = levels[tenant];

  return (
    <div className="stack-lg">
      <section className="stack">
        <div>
          <p className="label">Module · DAL</p>
          <h3 className="xp-module-title">GDPR Data Access Levels</h3>
          <p className="prose">
            A 4-tier, config-driven privacy framework that enforces per-tenant data-access restrictions across both
            backend and device configuration, with validation guards and audit logging.
          </p>
        </div>
        <div className="chips">
          {[
            '4 access levels',
            'config-driven',
            'per-tenant',
            'backend + device',
            'validation guards',
            'audit logging',
          ].map((c) => (
            <span key={c} className="chip chip--accent">
              {c}
            </span>
          ))}
        </div>
      </section>

      <section className="dal-grid">
        <div className="stack">
          <div className="section-head">
            <h3>Enforcement path</h3>
            <span className="label">
              {rejected ? 'guard · rejected' : stage === 4 ? 'applied' : stage > 0 ? 'propagating…' : 'idle'}
            </span>
          </div>
          <ArchitectureGraph
            label="Tenant access level propagates to backend and device configuration, passes access validation, and is recorded in the audit log"
            nodes={NODES}
            edges={EDGES}
            width={660}
            height={400}
            active={STAGES[stage]}
            center
            flow={stage > 0}
            minWidth={520}
            className={rejected ? 'graph--rejected' : undefined}
          />
        </div>

        <div className="stack dal-console">
          <div className="panel dal-panel">
            <p className="label">Tenants · illustrative</p>
            <div className="dal-tenants" role="radiogroup" aria-label="Tenant">
              {TENANTS.map((t) => (
                <button
                  key={t}
                  role="radio"
                  aria-checked={tenant === t}
                  className="dal-tenant"
                  onClick={() => setTenant(t)}
                >
                  <span className="mono">{t}</span>
                  <LevelMeter level={levels[t]} />
                </button>
              ))}
            </div>
          </div>

          <div className="panel dal-panel">
            <p className="label" id="dal-level-label">
              Set access level for <span className="mono">{tenant}</span>
            </p>
            <div className="seg dal-levels" role="radiogroup" aria-labelledby="dal-level-label">
              {[1, 2, 3, 4].map((l) => (
                <button
                  key={l}
                  className="seg__btn"
                  role="radio"
                  aria-checked={draft === l}
                  onClick={() => setDraft(l)}
                >
                  L{l}
                  {current === l ? ' ·' : ''}
                </button>
              ))}
            </div>
            <div className="dal-actions">
              <button className="btn btn--sm btn--primary" onClick={() => run(draft, true)}>
                <Send size={12} /> Apply config
              </button>
              <button className="btn btn--sm" onClick={() => run(5, false)}>
                <TriangleAlert size={12} /> Push invalid config
              </button>
            </div>
          </div>

          <div className="panel dal-panel">
            <p className="label">Audit log</p>
            {audit.length === 0 ? (
              <p className="dal-empty mono">no events yet — apply a config change</p>
            ) : (
              <ol className="dal-audit mono" aria-live="polite">
                {audit.map((a) => (
                  <li key={a.id}>
                    <span className="t-dim">{a.time}</span>{' '}
                    {a.ok ? <Check size={11} className="t-ok" /> : <TriangleAlert size={11} className="t-err" />}{' '}
                    <span className="t-accent">{a.tenant}</span>{' '}
                    <span className={a.ok ? undefined : 't-err'}>{a.text}</span>
                  </li>
                ))}
              </ol>
            )}
          </div>
        </div>
      </section>

      <Conceptual>
        Conceptual model. The resume documents four access levels, config-driven per-tenant restrictions across backend
        and device configuration, validation guards and audit logging; what each level restricts, and the internal
        schema, are intentionally not shown. Tenant names are placeholders.
      </Conceptual>
    </div>
  );
}

function LevelMeter({ level }: { level: number }) {
  return (
    <span className="dal-meter" role="img" aria-label={`Level ${level} of 4`}>
      {[1, 2, 3, 4].map((i) => (
        <span key={i} className={i <= level ? 'is-on' : undefined} />
      ))}
      <span className="mono" aria-hidden="true">
        L{level}
      </span>
    </span>
  );
}
