import { ArrowRight, Play } from 'lucide-react';
import { useEffect, useRef, useState } from 'react';
import { ArchitectureGraph, type GraphEdge, type GraphNode } from '../../components/ArchitectureGraph';
import { Conceptual } from '../../components/Conceptual';

type Phase = 'before' | 'after';

const GRAPHS: Record<Phase, { nodes: GraphNode[]; edges: GraphEdge[]; active: string[] }> = {
  before: {
    nodes: [
      { id: 'svc', label: 'SERVICE', sub: 'backend services', x: 300, y: 48, w: 180, kind: 'compute' },
      { id: 'cmk', label: 'AWS KMS · CMK', sub: 'customer managed key', x: 300, y: 172, w: 200, kind: 'security' },
      { id: 'data', label: 'ENCRYPTED DATA', x: 300, y: 296, w: 180, kind: 'storage' },
    ],
    edges: [
      { from: 'svc', to: 'cmk', label: 'encrypt / decrypt' },
      { from: 'cmk', to: 'data' },
    ],
    active: ['svc', 'cmk', 'data'],
  },
  after: {
    nodes: [
      { id: 'svc', label: 'SERVICE', sub: 'refactored decryption', x: 300, y: 36, w: 180, kind: 'compute' },
      { id: 'tse', label: 'TENANT-SPECIFIC ENC.', sub: 'local encryption', x: 300, y: 128, w: 210, kind: 'identity' },
      {
        id: 'tek',
        label: 'TEK',
        sub: 'per-tenant key',
        x: 300,
        y: 220,
        w: 170,
        kind: 'security',
        stack: true,
        badge: 'per tenant',
      },
      { id: 'data', label: 'ENCRYPTED DATA', x: 300, y: 312, w: 180, kind: 'storage' },
    ],
    edges: [
      { from: 'svc', to: 'tse' },
      { from: 'tse', to: 'tek', label: 'key storage' },
      { from: 'tek', to: 'data' },
    ],
    active: ['svc', 'tse', 'tek', 'data'],
  },
};

const CHANGES: { aspect: string; before: string; after: string }[] = [
  { aspect: 'Encryption', before: 'AWS CMK via KMS', after: 'Tenant-specific local encryption (TEK)' },
  { aspect: 'Key storage', before: 'Previous model', after: 'Refactored' },
  { aspect: 'Decryption logic', before: 'Previous model', after: 'Refactored across services' },
  { aspect: 'Outcome', before: '—', after: 'Stronger data security · lower overall KMS cost' },
];

export function EncryptionModule() {
  const [phase, setPhase] = useState<Phase>('after');
  const [playing, setPlaying] = useState(false);
  const timer = useRef<number | undefined>(undefined);

  useEffect(() => () => window.clearTimeout(timer.current), []);

  const play = () => {
    window.clearTimeout(timer.current);
    setPlaying(true);
    setPhase('before');
    timer.current = window.setTimeout(() => {
      setPhase('after');
      setPlaying(false);
    }, 1400);
  };

  const g = GRAPHS[phase];

  return (
    <div className="stack-lg">
      <section className="stack">
        <div>
          <p className="label">Module · TEK</p>
          <h3 className="xp-module-title">Encryption migration</h3>
          <p className="prose">
            Migrated the encryption framework from AWS CMK to tenant-specific local encryption (TEK), refactoring key
            storage and decryption logic across services to strengthen data security and reduce overall KMS costs.
          </p>
        </div>
      </section>

      <section className="enc-grid">
        <div className="stack">
          <div className="section-head">
            <div className="seg" role="radiogroup" aria-label="Migration state">
              <button
                className="seg__btn"
                role="radio"
                aria-checked={phase === 'before'}
                onClick={() => setPhase('before')}
              >
                BEFORE
              </button>
              <button
                className="seg__btn"
                role="radio"
                aria-checked={phase === 'after'}
                onClick={() => setPhase('after')}
              >
                AFTER
              </button>
            </div>
            <button className="btn btn--sm" onClick={play} disabled={playing}>
              <Play size={12} /> {playing ? 'migrating…' : 'Play migration'}
            </button>
          </div>
          <div key={phase} className="fade-in">
            <ArchitectureGraph
              label={
                phase === 'before'
                  ? 'Before: service encrypts and decrypts via an AWS KMS customer managed key'
                  : 'After: service uses tenant-specific local encryption with a per-tenant key (TEK)'
              }
              nodes={g.nodes}
              edges={g.edges}
              width={600}
              height={phase === 'before' ? 340 : 350}
              active={g.active}
              center
              flow
              minWidth={420}
            />
          </div>
        </div>

        <div className="stack">
          <div className="section-head">
            <h3>What changed</h3>
          </div>
          <div className="enc-table" role="table" aria-label="Before and after comparison">
            <div className="enc-row enc-row--head label" role="row">
              <span role="columnheader">Aspect</span>
              <span role="columnheader">Before</span>
              <span role="columnheader" />
              <span role="columnheader">After</span>
            </div>
            {CHANGES.map((c) => (
              <div key={c.aspect} className="enc-row" role="row">
                <span role="cell" className="mono enc-aspect">
                  {c.aspect}
                </span>
                <span role="cell" className={phase === 'before' ? 'is-hl' : 'is-muted'}>
                  {c.before}
                </span>
                <span role="cell" aria-hidden="true">
                  <ArrowRight size={12} />
                </span>
                <span role="cell" className={phase === 'after' ? 'is-hl' : 'is-muted'}>
                  {c.after}
                </span>
              </div>
            ))}
          </div>
          <Conceptual>
            Before/after concept only. Algorithms, key hierarchy, key storage location and rotation details are
            intentionally not described.
          </Conceptual>
        </div>
      </section>
    </div>
  );
}
