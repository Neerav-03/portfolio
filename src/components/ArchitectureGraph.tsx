import { useEffect, useId, useRef, type KeyboardEvent } from 'react';
import { useReducedMotion } from '../hooks/useMediaQuery';
import './graph.css';

export type NodeKind = 'compute' | 'storage' | 'identity' | 'data' | 'client' | 'security';

export interface GraphNode {
  id: string;
  label: string;
  sub?: string;
  /** Center coordinates in viewBox units. */
  x: number;
  y: number;
  w?: number;
  h?: number;
  kind?: NodeKind;
  /** Draws a stacked "multiple instances" shadow. */
  stack?: boolean;
  badge?: string;
  interactive?: boolean;
}

export interface GraphEdge {
  from: string;
  to: string;
  label?: string;
  dashed?: boolean;
  /** Force vertical (top/bottom anchors) or horizontal (side anchors) routing. */
  route?: 'v' | 'h';
}

interface ArchitectureGraphProps {
  nodes: GraphNode[];
  edges: GraphEdge[];
  width: number;
  height: number;
  label: string;
  /** Highlighted node ids. When non-empty, other nodes are dimmed. */
  active?: string[];
  selected?: string | null;
  onSelect?: (id: string) => void;
  /** Animate packets along edges between active nodes (or all edges when nothing is active). */
  flow?: boolean;
  /** Minimum rendered width in px before the graph scrolls horizontally. */
  minWidth?: number;
  /** When the graph overflows (narrow screens), start scrolled to its centre instead of its left edge. */
  center?: boolean;
  className?: string;
}

const DEFAULT_W = 148;
const DEFAULT_H = 48;

function edgePath(a: GraphNode, b: GraphNode, route?: 'v' | 'h'): { d: string; mx: number; my: number } {
  const aw = (a.w ?? DEFAULT_W) / 2;
  const ah = (a.h ?? DEFAULT_H) / 2;
  const bw = (b.w ?? DEFAULT_W) / 2;
  const bh = (b.h ?? DEFAULT_H) / 2;
  const dx = b.x - a.x;
  const dy = b.y - a.y;
  const vertical = route ? route === 'v' : Math.abs(dy) > Math.abs(dx) * 0.55;
  if (vertical) {
    const dir = Math.sign(dy) || 1;
    const sx = a.x;
    const sy = a.y + ah * dir;
    const tx = b.x;
    const ty = b.y - bh * dir;
    const c = (ty - sy) / 2;
    return {
      d: `M${sx},${sy} C${sx},${sy + c} ${tx},${ty - c} ${tx},${ty}`,
      mx: (sx + tx) / 2,
      my: (sy + ty) / 2,
    };
  }
  const dir = Math.sign(dx) || 1;
  const sx = a.x + aw * dir;
  const sy = a.y;
  const tx = b.x - bw * dir;
  const ty = b.y;
  const c = (tx - sx) / 2;
  return {
    d: `M${sx},${sy} C${sx + c},${sy} ${tx - c},${ty} ${tx},${ty}`,
    mx: (sx + tx) / 2,
    my: (sy + ty) / 2,
  };
}

export function ArchitectureGraph({
  nodes,
  edges,
  width,
  height,
  label,
  active = [],
  selected = null,
  onSelect,
  flow = false,
  minWidth,
  center = false,
  className,
}: ArchitectureGraphProps) {
  const wrapRef = useRef<HTMLDivElement>(null);
  useEffect(() => {
    const el = wrapRef.current;
    if (center && el && el.scrollWidth > el.clientWidth) el.scrollLeft = (el.scrollWidth - el.clientWidth) / 2;
  }, [center]);
  const uid = useId().replace(/:/g, '');
  const reduced = useReducedMotion();
  const byId = new Map(nodes.map((n) => [n.id, n]));
  const activeSet = new Set(active);
  const hasActive = activeSet.size > 0;

  const onKey = (e: KeyboardEvent, id: string) => {
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault();
      onSelect?.(id);
    }
  };

  return (
    <div ref={wrapRef} className={`graph ${className ?? ''}`}>
      <svg
        viewBox={`0 0 ${width} ${height}`}
        style={{ minWidth: minWidth ?? Math.round(width * 0.72) }}
        role="group"
        aria-label={label}
      >
        <defs>
          <marker
            id={`arrow-${uid}`}
            viewBox="0 0 8 8"
            refX="7"
            refY="4"
            markerWidth="7"
            markerHeight="7"
            orient="auto-start-reverse"
          >
            <path d="M0,0.8 L7,4 L0,7.2" fill="none" stroke="var(--line-strong)" strokeWidth="1.4" />
          </marker>
          <marker
            id={`arrow-on-${uid}`}
            viewBox="0 0 8 8"
            refX="7"
            refY="4"
            markerWidth="7"
            markerHeight="7"
            orient="auto-start-reverse"
          >
            <path d="M0,0.8 L7,4 L0,7.2" fill="none" stroke="var(--accent)" strokeWidth="1.4" />
          </marker>
        </defs>

        <g className="graph__edges">
          {edges.map((e) => {
            const a = byId.get(e.from);
            const b = byId.get(e.to);
            if (!a || !b) return null;
            const { d, mx, my } = edgePath(a, b, e.route);
            const on = hasActive ? activeSet.has(e.from) && activeSet.has(e.to) : false;
            const dim = hasActive && !on;
            const animate = flow && !reduced && (on || !hasActive);
            return (
              <g key={`${e.from}-${e.to}`} className={`graph__edge${on ? ' is-on' : ''}${dim ? ' is-dim' : ''}`}>
                <path
                  d={d}
                  fill="none"
                  strokeDasharray={e.dashed ? '3 4' : undefined}
                  markerEnd={`url(#${on ? 'arrow-on' : 'arrow'}-${uid})`}
                />
                {animate && (
                  <circle r="2.6" className="graph__packet">
                    <animateMotion dur={on ? '1.6s' : '2.8s'} repeatCount="indefinite" path={d} />
                  </circle>
                )}
                {e.label && (
                  <g className="graph__edge-label" transform={`translate(${mx},${my})`}>
                    <rect x={-(e.label.length * 3.3 + 7)} y={-8} width={e.label.length * 6.6 + 14} height={16} rx={3} />
                    <text textAnchor="middle" dy="3.5">
                      {e.label}
                    </text>
                  </g>
                )}
              </g>
            );
          })}
        </g>

        <g className="graph__nodes">
          {nodes.map((n) => {
            const w = n.w ?? DEFAULT_W;
            const h = n.h ?? DEFAULT_H;
            const interactive = Boolean(onSelect) && n.interactive !== false;
            const on = activeSet.has(n.id);
            const dim = hasActive && !on;
            const isSel = selected === n.id;
            const cls = [
              'graph__node',
              `kind-${n.kind ?? 'compute'}`,
              on ? 'is-on' : '',
              dim ? 'is-dim' : '',
              isSel ? 'is-selected' : '',
              interactive ? 'is-interactive' : '',
            ]
              .filter(Boolean)
              .join(' ');
            return (
              <g
                key={n.id}
                className={cls}
                transform={`translate(${n.x - w / 2},${n.y - h / 2})`}
                {...(interactive
                  ? {
                      role: 'button',
                      tabIndex: 0,
                      'aria-pressed': isSel,
                      'aria-label': `${n.label}${n.sub ? ` — ${n.sub}` : ''}`,
                      onClick: () => onSelect?.(n.id),
                      onKeyDown: (e: KeyboardEvent) => onKey(e, n.id),
                    }
                  : {})}
              >
                {n.stack && (
                  <>
                    <rect className="graph__stack" x={6} y={-6} width={w} height={h} rx={6} />
                    <rect className="graph__stack" x={3} y={-3} width={w} height={h} rx={6} />
                  </>
                )}
                <rect className="graph__box" width={w} height={h} rx={6} />
                <rect className="graph__accent" x={0} y={10} width={2} height={h - 20} rx={1} />
                <text className="graph__label" x={14} y={n.sub ? h / 2 - 3 : h / 2 + 4}>
                  {n.label}
                </text>
                {n.sub && (
                  <text className="graph__sub" x={14} y={h / 2 + 12}>
                    {n.sub}
                  </text>
                )}
                {n.badge && (
                  <text className="graph__badge" x={w - 10} y={15} textAnchor="end">
                    {n.badge}
                  </text>
                )}
              </g>
            );
          })}
        </g>
      </svg>
    </div>
  );
}
