import { useMemo, useState } from 'react';
import type { ExperienceEntry } from '../../data/types';
import { ArchitectureGraph, type GraphEdge, type GraphNode } from '../../components/ArchitectureGraph';
import { Conceptual, Stat } from '../../components/Conceptual';
import { BarChart, HeatGrid, LineChart, ScatterChart, seeded } from '../../components/MiniCharts';

const PIPE_NODES: GraphNode[] = [
  { id: 'stores', label: 'STORES', sub: '5 retail stores', x: 76, y: 60, w: 124, kind: 'client', stack: true },
  { id: 'tx', label: 'TRANSACTIONS', sub: '2 years · 857 SKUs', x: 236, y: 60, w: 148, kind: 'data' },
  { id: 'views', label: 'SALES · PRICE', sub: '· ELASTICITY', x: 404, y: 60, w: 140, kind: 'compute' },
  { id: 'rfm', label: 'RFM', sub: 'segmentation', x: 558, y: 60, w: 120, kind: 'identity' },
  { id: 'insight', label: 'PRICING', sub: 'insights', x: 700, y: 60, w: 116, kind: 'storage' },
];
const PIPE_EDGES: GraphEdge[] = [
  { from: 'stores', to: 'tx' },
  { from: 'tx', to: 'views' },
  { from: 'views', to: 'rfm' },
  { from: 'rfm', to: 'insight' },
];

const TABS = ['Overview', 'Sales', 'Price', 'Elasticity'] as const;
type Tab = (typeof TABS)[number];

function useIllustrativeData() {
  return useMemo(() => {
    const rnd = seeded(857);
    const months = Array.from({ length: 24 }, (_, i) => `M${i + 1}`);
    const sales = months.map((label, i) => ({
      label,
      value: 60 + i * 1.1 + Math.sin((i / 12) * Math.PI * 2) * 9 + (rnd() - 0.5) * 8,
    }));
    const own = months.map((_, i) => 100 + Math.sin(i / 3) * 3 + (rnd() - 0.5) * 2 + i * 0.12);
    const comp = months.map((_, i) => 101 + Math.cos(i / 4) * 3.5 + (rnd() - 0.5) * 2);
    const points = Array.from({ length: 46 }, () => {
      const x = (rnd() - 0.5) * 36;
      return { x, y: -1.35 * x + (rnd() - 0.5) * 18 };
    });
    const heat = Array.from({ length: 5 }, (_, r) => Array.from({ length: 5 }, (_, c) => Math.max(0.6, 2 + (4 - Math.abs(r - c)) * 1.4 + (rnd() - 0.3) * 2.5)));
    return { months, sales, own, comp, points, heat };
  }, []);
}

export function ExlModule({ entry }: { entry: ExperienceEntry }) {
  const [tab, setTab] = useState<Tab>('Overview');
  const d = useIllustrativeData();

  return (
    <div className="stack-lg">
      <header className="xp-head">
        <div>
          <p className="label">EXL · {entry.location}</p>
          <h2 className="page-title">{entry.role}</h2>
          <p className="page-sub">Competitive price monitoring</p>
        </div>
        <span className="chip xp-date">
          {entry.start} – {entry.end}
        </span>
      </header>

      <section className="stats" aria-label="Documented scope">
        <Stat value="5" label="retail stores" />
        <Stat value="2 yrs" label="of transaction-level data" />
        <Stat value="857" label="products analyzed" />
        <Stat value="4" label="dashboard views" />
      </section>

      <section className="stack" aria-labelledby="exl-pipe">
        <div className="section-head">
          <h3 id="exl-pipe">Analysis pipeline</h3>
        </div>
        <ArchitectureGraph
          label="Stores feed transaction data into sales, price and elasticity views, then RFM segmentation, producing pricing insights"
          nodes={PIPE_NODES}
          edges={PIPE_EDGES}
          width={776}
          height={120}
          flow
          minWidth={640}
        />
      </section>

      <section className="exl-dash panel" aria-labelledby="exl-dash-title">
        <div className="exl-dash__head">
          <h3 id="exl-dash-title" className="mono exl-dash__title">
            price-monitor <span className="t-dim">/ {tab.toLowerCase()}</span>
          </h3>
          <span className="chip exl-illus">
            <span className="dot dot--warn" /> ILLUSTRATIVE · synthetic data
          </span>
        </div>
        <div className="tabs" role="tablist" aria-label="Dashboard views">
          {TABS.map((t) => (
            <button key={t} role="tab" id={`exl-tab-${t}`} aria-selected={tab === t} aria-controls="exl-panel" className="tab" onClick={() => setTab(t)}>
              {t}
            </button>
          ))}
        </div>
        <div id="exl-panel" role="tabpanel" aria-labelledby={`exl-tab-${tab}`} className="exl-dash__body fade-in" key={tab}>
          {tab === 'Overview' && (
            <div className="exl-overview">
              <div className="stack">
                <p className="label">KPIs &amp; views</p>
                <div className="exl-kpis">
                  {['Sales growth (KPI)', 'Retention (KPI)', 'Competitive price · Price view', 'Price elasticity · Elasticity view'].map((k) => (
                    <div key={k} className="exl-kpi">
                      <span className="dot dot--accent" /> {k}
                    </div>
                  ))}
                </div>
                <p className="exl-caption">The dashboard combined these views so strategists could set profitable prices based on elasticities.</p>
              </div>
              <div className="stack">
                <p className="label">RFM segmentation · share of customers</p>
                <HeatGrid
                  values={d.heat}
                  rows={['R5', 'R4', 'R3', 'R2', 'R1']}
                  cols={['F1', 'F2', 'F3', 'F4', 'F5']}
                  label="Illustrative RFM grid: recency score by frequency score, shaded by share of customers"
                />
              </div>
            </div>
          )}
          {tab === 'Sales' && <BarChart data={d.sales} label="Illustrative monthly sales index over 24 months" format={(v) => `index ${v.toFixed(0)}`} />}
          {tab === 'Price' && (
            <LineChart
              labels={d.months}
              series={[
                { name: 'Store price index', color: 'var(--series-1)', values: d.own },
                { name: 'Competitor average', color: 'var(--series-2)', values: d.comp },
              ]}
              min={92}
              max={108}
              label="Illustrative price index of a store versus competitor average over 24 months"
            />
          )}
          {tab === 'Elasticity' && (
            <div className="stack">
              <ScatterChart points={d.points} slope={-1.35} intercept={0} label="Illustrative scatter of price change versus unit sales change with a fitted downward trend" />
              <p className="exl-caption">Price change (x) vs. change in units sold (y). A steeper downward fit means demand is more price-sensitive.</p>
            </div>
          )}
        </div>
      </section>

      <Conceptual>
        Charts use synthetic, randomly generated data to illustrate the dashboard&rsquo;s views. The real dataset (5 stores, 2
        years, 857 products) is not reproduced here.
      </Conceptual>

      <section>
        <div className="section-head">
          <h3>As documented</h3>
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
