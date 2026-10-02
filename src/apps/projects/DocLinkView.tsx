import { Check, Play } from 'lucide-react';
import { useEffect, useRef, useState } from 'react';
import { ArchitectureGraph, type GraphEdge, type GraphNode } from '../../components/ArchitectureGraph';

type Role = 'user' | 'doctor' | 'admin';

const NODES: GraphNode[] = [
  { id: 'user', label: 'USER UI', sub: 'patients', x: 110, y: 46, w: 140, kind: 'client' },
  { id: 'doctor', label: 'DOCTOR UI', sub: 'availability', x: 300, y: 46, w: 140, kind: 'client' },
  { id: 'admin', label: 'ADMIN UI', sub: 'approvals', x: 490, y: 46, w: 140, kind: 'client' },
  { id: 'react', label: 'REACT APP', sub: '3 interfaces', x: 300, y: 146, w: 170, kind: 'compute' },
  { id: 'api', label: 'EXPRESS API', sub: 'Node.js', x: 300, y: 246, w: 170, kind: 'compute' },
  { id: 'auth', label: 'AUTH', sub: 'bcrypt.js hashing', x: 96, y: 246, w: 150, kind: 'security' },
  { id: 'notify', label: 'NOTIFICATIONS', sub: 'push', x: 504, y: 246, w: 150, kind: 'identity' },
  { id: 'db', label: 'MONGODB', sub: 'database service', x: 300, y: 346, w: 200, kind: 'data' },
];
const EDGES: GraphEdge[] = [
  { from: 'user', to: 'react', route: 'v' },
  { from: 'doctor', to: 'react', route: 'v' },
  { from: 'admin', to: 'react', route: 'v' },
  { from: 'react', to: 'api', route: 'v' },
  { from: 'api', to: 'auth', route: 'h' },
  { from: 'api', to: 'notify', route: 'h' },
  { from: 'api', to: 'db', route: 'v' },
];

const ROLES: Record<Role, { label: string; can: string[]; nodes: string[] }> = {
  user: {
    label: 'User',
    can: ['Register and log in (passwords hashed with bcrypt.js)', 'Check doctor availability', 'Request an appointment', 'Receive push notifications'],
    nodes: ['user', 'react', 'api', 'auth', 'notify', 'db'],
  },
  doctor: {
    label: 'Doctor',
    can: ['Register as a doctor (pending admin approval)', 'Approve appointment requests', 'Receive push notifications'],
    nodes: ['doctor', 'react', 'api', 'notify', 'db'],
  },
  admin: {
    label: 'Admin',
    can: ['Approve or reject doctor registrations'],
    nodes: ['admin', 'react', 'api', 'db'],
  },
};

const FLOW = [
  { label: 'User checks doctor availability', nodes: ['user', 'react', 'api', 'db'] },
  { label: 'User requests an appointment', nodes: ['user', 'react', 'api', 'db'] },
  { label: 'Doctor approves the request', nodes: ['doctor', 'react', 'api', 'db'] },
  { label: 'Notification sent to the user', nodes: ['api', 'notify', 'react', 'user'] },
];

export function DocLinkView() {
  const [role, setRole] = useState<Role>('user');
  const [step, setStep] = useState<number | null>(null);
  const timers = useRef<number[]>([]);
  useEffect(() => () => timers.current.forEach(clearTimeout), []);

  const play = () => {
    timers.current.forEach(clearTimeout);
    timers.current = FLOW.map((_, i) => window.setTimeout(() => setStep(i), i * 900));
    timers.current.push(window.setTimeout(() => setStep(null), FLOW.length * 900 + 600));
  };

  const active = step !== null ? FLOW[step].nodes : ROLES[role].nodes;

  return (
    <>
      <section className="pj-split">
        <div className="stack">
          <div className="section-head">
            <h3>Architecture</h3>
            <span className="label">conceptual</span>
          </div>
          <ArchitectureGraph
            label="Doc-Link: User, Doctor and Admin interfaces in a React app call an Express API on Node.js, which handles bcrypt.js authentication, push notifications and MongoDB storage"
            nodes={NODES}
            edges={EDGES}
            width={600}
            height={390}
            active={active}
            center
            flow
            minWidth={480}
          />
        </div>
        <div className="stack">
          <div className="section-head">
            <div className="seg" role="radiogroup" aria-label="Role">
              {(Object.keys(ROLES) as Role[]).map((r) => (
                <button key={r} className="seg__btn" role="radio" aria-checked={role === r && step === null} onClick={() => { setStep(null); setRole(r); }}>
                  {ROLES[r].label.toUpperCase()}
                </button>
              ))}
            </div>
          </div>
          <div className="panel pj-role">
            <p className="label">{ROLES[role].label} interface can</p>
            <ul className="pj-can">
              {ROLES[role].can.map((c) => (
                <li key={c}>
                  <Check size={12} aria-hidden="true" /> {c}
                </li>
              ))}
            </ul>
          </div>
          <div className="panel pj-role">
            <div className="section-head" style={{ marginBottom: 0 }}>
              <p className="label">Booking flow</p>
              <button className="btn btn--sm" onClick={play}>
                <Play size={12} /> Run
              </button>
            </div>
            <ol className="pj-flow" aria-live="polite">
              {FLOW.map((f, i) => (
                <li key={f.label} className={step === i ? 'is-on' : step !== null && i < step ? 'is-done' : undefined}>
                  <span className="mono">{i + 1}</span> {f.label}
                </li>
              ))}
            </ol>
          </div>
        </div>
      </section>
    </>
  );
}
