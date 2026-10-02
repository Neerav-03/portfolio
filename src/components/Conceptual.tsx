import { Info } from 'lucide-react';
import type { ReactNode } from 'react';

/** Marks a visualization as a conceptual/illustrative representation, not internal architecture. */
export function Conceptual({ children }: { children?: ReactNode }) {
  return (
    <p className="note">
      <Info size={13} aria-hidden="true" />
      <span>
        {children ??
          'Conceptual representation of the work described in the resume — not Netradyne’s internal architecture. Service names, schemas and APIs are intentionally omitted.'}
      </span>
    </p>
  );
}

export function Stat({ value, label }: { value: ReactNode; label: string }) {
  return (
    <div className="stat">
      <div className="stat__value">{value}</div>
      <div className="stat__label">{label}</div>
    </div>
  );
}
