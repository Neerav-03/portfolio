import { Play } from 'lucide-react';
import { useId, useState } from 'react';
import { ArchitectureGraph, type GraphEdge, type GraphNode } from '../../components/ArchitectureGraph';
import { Conceptual } from '../../components/Conceptual';

/** Only the endpoints of the tier range are documented (62 and 403 days). */
const TIERS = [
  { id: 1, days: 62 as number | null },
  { id: 2, days: null },
  { id: 3, days: null },
  { id: 4, days: null },
  { id: 5, days: 403 as number | null },
];

const CONCEPTS = [
  'day-exact expiry',
  'month-rounded expiry',
  'presigned-URL gating',
  'S3 lifecycle tagging',
  '5 duration tiers',
  '62–403 days',
  'zero object migration',
];

const PIPELINE_NODES: GraphNode[] = [
  { id: 'upload', label: 'UPLOAD', sub: 'video upload', x: 82, y: 52, w: 132, kind: 'client' },
  { id: 'derived', label: 'DERIVED', sub: 'video artifacts', x: 82, y: 142, w: 132, kind: 'client' },
  { id: 'storage', label: 'VIDEO STORAGE', sub: 'S3 · tagged', x: 252, y: 97, w: 150, kind: 'storage' },
  { id: 'policy', label: 'RETENTION POLICY', sub: 'configurable', x: 432, y: 97, w: 158, kind: 'compute' },
  { id: 'enforce', label: 'ENFORCEMENT', sub: 'lifecycle + access', x: 612, y: 97, w: 150, kind: 'identity' },
  { id: 'expiry', label: 'EXPIRY', sub: 'automatic', x: 772, y: 97, w: 112, kind: 'security' },
];
const PIPELINE_EDGES: GraphEdge[] = [
  { from: 'upload', to: 'storage', route: 'h' },
  { from: 'derived', to: 'storage', route: 'h' },
  { from: 'storage', to: 'policy' },
  { from: 'policy', to: 'enforce' },
  { from: 'enforce', to: 'expiry' },
];

function bandNodes(tier: number): GraphNode[] {
  return [
    { id: 'obj', label: 'VIDEO OBJECT', sub: `lifecycle tag → tier ${tier}`, x: 96, y: 150, w: 168, kind: 'storage' },
    ...TIERS.map((t, i) => ({
      id: `b${t.id}`,
      label: `BAND ${t.id}`,
      sub: t.days ? `${t.days} days` : 'intermediate',
      x: 380,
      y: 34 + i * 58,
      w: 150,
      h: 44,
      kind: 'storage' as const,
    })),
    { id: 'rule', label: 'LIFECYCLE RULE', sub: 'per-day expiry', x: 656, y: 150, w: 160, kind: 'compute' },
  ];
}
const BAND_EDGES: GraphEdge[] = [
  ...TIERS.map((t) => ({ from: 'obj', to: `b${t.id}`, route: 'h' as const })),
  ...TIERS.map((t) => ({ from: `b${t.id}`, to: 'rule', route: 'h' as const })),
];

interface LogLine {
  id: number;
  ok: boolean;
  text: string;
}

export function DrpModule() {
  const [tier, setTier] = useState(3);
  const [mode, setMode] = useState<'exact' | 'month'>('exact');
  const [age, setAge] = useState(45);
  const [log, setLog] = useState<LogLine[]>([]);
  const sliderId = useId();

  const t = TIERS[tier - 1];
  const expired = age >= 100;
  const ageText = t.days ? `day ${Math.round((age / 100) * t.days)} of ${t.days}` : `${age}% of retention window`;

  const request = () => {
    setLog((prev) =>
      [
        {
          id: Date.now(),
          ok: !expired,
          text: expired
            ? `tier ${tier} · ${ageText} → access gated, no presigned URL issued`
            : `tier ${tier} · ${ageText} → presigned URL issued`,
        },
        ...prev,
      ].slice(0, 5),
    );
  };

  return (
    <div className="stack-lg">
      <section className="stack">
        <div>
          <p className="label">Module · DRP</p>
          <h3 className="xp-module-title">Data Retention Policy</h3>
          <p className="prose">
            Configurable video retention enforced across the backend platform&rsquo;s core services &mdash; covering uploads and
            derived video artifacts &mdash; backed by banded S3 bucket infrastructure with per-day lifecycle expiry rules and
            cross-environment IAM.
          </p>
        </div>
        <div className="chips">
          {CONCEPTS.map((c) => (
            <span key={c} className="chip chip--accent">
              {c}
            </span>
          ))}
        </div>
      </section>

      <section className="stack" aria-labelledby="drp-flow">
        <div className="section-head">
          <h3 id="drp-flow">Lifecycle</h3>
          <span className="label">{expired ? 'state · expired' : 'state · retained'}</span>
        </div>
        <ArchitectureGraph
          label="Retention lifecycle: upload and derived artifacts flow into video storage, then retention policy, enforcement and expiry"
          nodes={PIPELINE_NODES}
          edges={PIPELINE_EDGES}
          width={840}
          height={190}
          active={expired ? PIPELINE_NODES.map((n) => n.id) : ['upload', 'derived', 'storage', 'policy', 'enforce']}
          flow
          minWidth={560}
        />
      </section>

      <section className="stack drp-sim" aria-labelledby="drp-sim">
        <div className="section-head">
          <h3 id="drp-sim">Retention simulator</h3>
          <span className="label">illustrative</span>
        </div>

        <div className="drp-controls">
          <div className="drp-control">
            <span className="label" id="tier-label">
              Duration tier
            </span>
            <div className="seg" role="radiogroup" aria-labelledby="tier-label">
              {TIERS.map((x) => (
                <button key={x.id} className="seg__btn" role="radio" aria-checked={tier === x.id} onClick={() => setTier(x.id)}>
                  T{x.id}
                  {x.days ? ` · ${x.days}d` : ''}
                </button>
              ))}
            </div>
          </div>
          <div className="drp-control">
            <span className="label" id="mode-label">
              Expiry mode
            </span>
            <div className="seg" role="radiogroup" aria-labelledby="mode-label">
              <button className="seg__btn" role="radio" aria-checked={mode === 'exact'} onClick={() => setMode('exact')}>
                day-exact
              </button>
              <button className="seg__btn" role="radio" aria-checked={mode === 'month'} onClick={() => setMode('month')}>
                month-rounded
              </button>
            </div>
          </div>
        </div>

        <ArchitectureGraph
          label={`Banded storage: the object's lifecycle tag routes it to band ${tier}, whose per-day lifecycle rule expires it`}
          nodes={bandNodes(tier)}
          edges={BAND_EDGES}
          width={760}
          height={300}
          active={['obj', `b${tier}`, 'rule']}
          flow
          minWidth={600}
        />

        <ExpiryStrip mode={mode} />

        <div className="drp-age panel">
          <div className="drp-age__row">
            <label htmlFor={sliderId} className="label">
              Object age
            </label>
            <span className="mono drp-age__value">{ageText}</span>
          </div>
          <input
            id={sliderId}
            className="range"
            type="range"
            min={0}
            max={130}
            value={age}
            onChange={(e) => setAge(Number(e.target.value))}
            style={{ ['--fill' as string]: `${(age / 130) * 100}%`, ['--mark' as string]: `${(100 / 130) * 100}%` }}
            aria-valuetext={ageText}
          />
          <div className="drp-age__row">
            <span className={`drp-status mono ${expired ? 'is-err' : 'is-ok'}`}>
              <span className={`dot ${expired ? 'dot--err' : 'dot--ok'}`} />
              {expired ? 'past retention — presigned URL gated · lifecycle rule expires object' : 'within retention — presigned URL can be issued'}
            </span>
            <button className="btn btn--sm" onClick={request}>
              <Play size={12} /> Request playback
            </button>
          </div>
          {log.length > 0 && (
            <ol className="drp-log mono" aria-live="polite">
              {log.map((l) => (
                <li key={l.id} className={l.ok ? 't-ok' : 't-err'}>
                  {l.ok ? '200' : '403'} <span className="t-dim">{l.text}</span>
                </li>
              ))}
            </ol>
          )}
        </div>

        <Conceptual>
          Illustrative model of the documented concepts. Only the 62–403 day range of the five tiers is documented, so
          intermediate tier durations are not shown. Bucket names, tag keys and APIs are intentionally omitted.
        </Conceptual>
      </section>

      <section className="xp-facts" aria-label="Key properties">
        <div className="panel xp-fact">
          <p className="label">Zero object migration</p>
          <p>Banded buckets with per-day lifecycle rules enable automatic, cost-controlled video expiry without migrating existing objects.</p>
        </div>
        <div className="panel xp-fact">
          <p className="label">Presigned-URL gating</p>
          <p>Access to video is gated at the point of issuing presigned URLs, so retention is enforced on reads, not only by deletion.</p>
        </div>
        <div className="panel xp-fact">
          <p className="label">Lifecycle tagging</p>
          <p>Uploads and derived video artifacts are tagged for S3 lifecycle handling, so expiry is carried out by storage rules.</p>
        </div>
      </section>
    </div>
  );
}

/** Day-exact vs month-rounded expiry on a three-month strip. Rounding target is illustrative. */
function ExpiryStrip({ mode }: { mode: 'exact' | 'month' }) {
  const months = ['M', 'M+1', 'M+2'];
  const exactPos = (1 + 17 / 30) / 3; // a day inside the second month
  const monthPos = 2 / 3; // the month boundary
  const pos = mode === 'exact' ? exactPos : monthPos;
  return (
    <div className="drp-strip panel" aria-label={mode === 'exact' ? 'Day-exact: expiry falls on the exact computed day' : 'Month-rounded: expiry aligns to a month boundary'}>
      <div className="drp-strip__head">
        <span className="label">{mode === 'exact' ? 'day-exact' : 'month-rounded'}</span>
        <span className="drp-strip__desc">
          {mode === 'exact' ? 'Expiry falls on the exact computed day.' : 'Expiry is computed at month granularity.'}
        </span>
      </div>
      <div className="drp-strip__track" aria-hidden="true">
        {months.map((m) => (
          <div key={m} className="drp-strip__month">
            <span className="drp-strip__mlabel mono">{m}</span>
            <div className="drp-strip__days">
              {Array.from({ length: 30 }, (_, d) => (
                <span key={d} />
              ))}
            </div>
          </div>
        ))}
        <span className="drp-strip__marker" style={{ left: `${pos * 100}%` }}>
          <span className="mono">expiry</span>
        </span>
      </div>
    </div>
  );
}
