import { useState, type ReactNode } from 'react';
import './charts.css';

/** Deterministic PRNG so illustrative data is stable across renders. */
export function seeded(seed: number) {
  let a = seed >>> 0;
  return () => {
    a = (a + 0x6d2b79f5) >>> 0;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

const W = 640;
const H = 220;
const PAD = { l: 40, r: 16, t: 14, b: 26 };
const IW = W - PAD.l - PAD.r;
const IH = H - PAD.t - PAD.b;

function Tooltip({ x, y, children }: { x: number; y: number; children: ReactNode }) {
  return (
    <div className="chart__tip mono" style={{ left: `${(x / W) * 100}%`, top: `${(y / H) * 100}%` }}>
      {children}
    </div>
  );
}

function Grid({ ticks, max, min = 0, format = (v: number) => String(v) }: { ticks: number; max: number; min?: number; format?: (v: number) => string }) {
  return (
    <g className="chart__grid">
      {Array.from({ length: ticks + 1 }, (_, i) => {
        const v = min + ((max - min) * i) / ticks;
        const y = PAD.t + IH - (IH * i) / ticks;
        return (
          <g key={i}>
            <line x1={PAD.l} x2={W - PAD.r} y1={y} y2={y} />
            <text x={PAD.l - 8} y={y + 3} textAnchor="end">
              {format(v)}
            </text>
          </g>
        );
      })}
    </g>
  );
}

export function BarChart({ data, label, format = (v) => v.toFixed(0) }: { data: { label: string; value: number }[]; label: string; format?: (v: number) => string }) {
  const [hover, setHover] = useState<number | null>(null);
  const max = Math.ceil(Math.max(...data.map((d) => d.value)) / 20) * 20;
  const slot = IW / data.length;
  const bw = Math.max(4, slot - 4);
  return (
    <div className="chart">
      <svg viewBox={`0 0 ${W} ${H}`} role="img" aria-label={label} onMouseLeave={() => setHover(null)}>
        <Grid ticks={4} max={max} />
        {data.map((d, i) => {
          const h = (d.value / max) * IH;
          const x = PAD.l + i * slot + (slot - bw) / 2;
          const y = PAD.t + IH - h;
          return (
            <g key={d.label} onMouseEnter={() => setHover(i)}>
              <rect className="chart__hit" x={PAD.l + i * slot} y={PAD.t} width={slot} height={IH} />
              <path
                className={`chart__bar${hover === i ? ' is-hover' : ''}`}
                d={`M${x},${PAD.t + IH} V${y + 3} Q${x},${y} ${x + 3},${y} H${x + bw - 3} Q${x + bw},${y} ${x + bw},${y + 3} V${PAD.t + IH} Z`}
              />
              {i % 3 === 0 && (
                <text className="chart__xlabel" x={x + bw / 2} y={H - 8} textAnchor="middle">
                  {d.label}
                </text>
              )}
            </g>
          );
        })}
      </svg>
      {hover !== null && (
        <Tooltip x={PAD.l + hover * slot + slot / 2} y={PAD.t + IH - (data[hover].value / max) * IH}>
          {data[hover].label} · {format(data[hover].value)}
        </Tooltip>
      )}
    </div>
  );
}

export interface Series {
  name: string;
  color: string;
  values: number[];
}

export function LineChart({ series, labels, label, min, max }: { series: Series[]; labels: string[]; label: string; min: number; max: number }) {
  const [hover, setHover] = useState<number | null>(null);
  const n = labels.length;
  const x = (i: number) => PAD.l + (IW * i) / (n - 1);
  const y = (v: number) => PAD.t + IH - ((v - min) / (max - min)) * IH;
  return (
    <div className="chart">
      <ul className="chart__legend">
        {series.map((s) => (
          <li key={s.name}>
            <span className="chart__swatch" style={{ background: s.color }} /> {s.name}
          </li>
        ))}
      </ul>
      <svg
        viewBox={`0 0 ${W} ${H}`}
        role="img"
        aria-label={label}
        onMouseMove={(e) => {
          const r = e.currentTarget.getBoundingClientRect();
          const px = ((e.clientX - r.left) / r.width) * W;
          setHover(Math.max(0, Math.min(n - 1, Math.round(((px - PAD.l) / IW) * (n - 1)))));
        }}
        onMouseLeave={() => setHover(null)}
      >
        <Grid ticks={4} min={min} max={max} format={(v) => v.toFixed(0)} />
        {labels.map((l, i) =>
          i % 3 === 0 ? (
            <text key={l} className="chart__xlabel" x={x(i)} y={H - 8} textAnchor="middle">
              {l}
            </text>
          ) : null,
        )}
        {hover !== null && <line className="chart__cross" x1={x(hover)} x2={x(hover)} y1={PAD.t} y2={PAD.t + IH} />}
        {series.map((s) => (
          <g key={s.name}>
            <path className="chart__line" stroke={s.color} d={s.values.map((v, i) => `${i ? 'L' : 'M'}${x(i)},${y(v)}`).join(' ')} />
            {hover !== null && <circle className="chart__dot" cx={x(hover)} cy={y(s.values[hover])} r={4} fill={s.color} />}
          </g>
        ))}
      </svg>
      {hover !== null && (
        <Tooltip x={x(hover)} y={PAD.t}>
          <strong>{labels[hover]}</strong>
          {series.map((s) => (
            <span key={s.name} className="chart__tip-row">
              <span className="chart__swatch" style={{ background: s.color }} /> {s.name} {s.values[hover].toFixed(1)}
            </span>
          ))}
        </Tooltip>
      )}
    </div>
  );
}

export function ScatterChart({ points, label, slope, intercept }: { points: { x: number; y: number }[]; label: string; slope: number; intercept: number }) {
  const [hover, setHover] = useState<number | null>(null);
  const xr = [-20, 20];
  const yr = [-40, 40];
  const sx = (v: number) => PAD.l + ((v - xr[0]) / (xr[1] - xr[0])) * IW;
  const sy = (v: number) => PAD.t + IH - ((v - yr[0]) / (yr[1] - yr[0])) * IH;
  return (
    <div className="chart">
      <svg viewBox={`0 0 ${W} ${H}`} role="img" aria-label={label} onMouseLeave={() => setHover(null)}>
        <Grid ticks={4} min={yr[0]} max={yr[1]} format={(v) => `${v > 0 ? '+' : ''}${v}%`} />
        <line className="chart__axis0" x1={sx(0)} x2={sx(0)} y1={PAD.t} y2={PAD.t + IH} />
        {[-20, -10, 0, 10, 20].map((v) => (
          <text key={v} className="chart__xlabel" x={sx(v)} y={H - 8} textAnchor="middle">
            {`${v > 0 ? '+' : ''}${v}%`}
          </text>
        ))}
        <line className="chart__fit" x1={sx(xr[0])} y1={sy(slope * xr[0] + intercept)} x2={sx(xr[1])} y2={sy(slope * xr[1] + intercept)} />
        {points.map((p, i) => (
          <g key={i} onMouseEnter={() => setHover(i)}>
            <circle className="chart__hit" cx={sx(p.x)} cy={sy(p.y)} r={9} />
            <circle className={`chart__pt${hover === i ? ' is-hover' : ''}`} cx={sx(p.x)} cy={sy(p.y)} r={4} />
          </g>
        ))}
      </svg>
      {hover !== null && (
        <Tooltip x={sx(points[hover].x)} y={sy(points[hover].y)}>
          price {points[hover].x.toFixed(1)}% · units {points[hover].y.toFixed(1)}%
        </Tooltip>
      )}
    </div>
  );
}

export function HeatGrid({ values, rows, cols, label }: { values: number[][]; rows: string[]; cols: string[]; label: string }) {
  const [hover, setHover] = useState<[number, number] | null>(null);
  const max = Math.max(...values.flat());
  return (
    <div className="heat" role="img" aria-label={label} onMouseLeave={() => setHover(null)}>
      <span className="heat__corner mono">R ↓ · F →</span>
      {cols.map((c) => (
        <span key={c} className="heat__col mono">
          {c}
        </span>
      ))}
      {values.map((row, r) => (
        <div key={r} className="heat__row">
          <span className="heat__rlabel mono">{rows[r]}</span>
          {row.map((v, c) => {
            const t = v / max;
            return (
              <span
                key={c}
                className={`heat__cell${hover?.[0] === r && hover?.[1] === c ? ' is-hover' : ''}`}
                style={{ background: `color-mix(in srgb, #3987e5 ${Math.round(12 + t * 78)}%, #121418)` }}
                onMouseEnter={() => setHover([r, c])}
              >
                {hover?.[0] === r && hover?.[1] === c ? `${v.toFixed(1)}%` : ''}
              </span>
            );
          })}
        </div>
      ))}
    </div>
  );
}
