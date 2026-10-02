import { useMemo, useState } from 'react';
import { ArchitectureGraph, type GraphEdge, type GraphNode } from '../../components/ArchitectureGraph';
import { Conceptual } from '../../components/Conceptual';
import { buildModel, recommend, sharedTerms, TOY_MOVIES } from './tfidf';

const WEB_NODES: GraphNode[] = [
  { id: 'browser', label: 'BROWSER', sub: 'dark / light mode', x: 90, y: 58, w: 150, kind: 'client' },
  { id: 'next', label: 'NEXT.JS', sub: 'movie details UI', x: 300, y: 58, w: 150, kind: 'compute' },
  { id: 'tmdb', label: 'TMDB API', sub: 'movie metadata', x: 510, y: 58, w: 150, kind: 'data' },
  { id: 'disqus', label: 'DISQUS', sub: 'comment section', x: 300, y: 156, w: 150, kind: 'identity' },
];
const WEB_EDGES: GraphEdge[] = [
  { from: 'browser', to: 'next' },
  { from: 'next', to: 'tmdb', label: 'fetch' },
  { from: 'next', to: 'disqus', dashed: true, route: 'v' },
];

const REC_NODES: GraphNode[] = [
  { id: 'data', label: 'MOVIE DATA', sub: 'text features', x: 76, y: 56, w: 128, kind: 'data' },
  { id: 'flask', label: 'FLASK', sub: 'rec. service', x: 230, y: 56, w: 128, kind: 'compute' },
  { id: 'tfidf', label: 'TF-IDF', sub: 'vectorize', x: 384, y: 56, w: 128, kind: 'identity' },
  { id: 'cos', label: 'COSINE SIM.', sub: 'rank neighbours', x: 538, y: 56, w: 128, kind: 'identity' },
  { id: 'recs', label: 'RESULTS', sub: 'recommendations', x: 692, y: 56, w: 128, kind: 'client' },
];
const REC_EDGES: GraphEdge[] = [
  { from: 'data', to: 'flask' },
  { from: 'flask', to: 'tfidf' },
  { from: 'tfidf', to: 'cos' },
  { from: 'cos', to: 'recs' },
];

export function MovieMateView() {
  const model = useMemo(() => buildModel(TOY_MOVIES.map((m) => m.tags)), []);
  const [pick, setPick] = useState(0);
  const recs = recommend(model, pick, 3);

  return (
    <>
      <section className="stack" aria-labelledby="mm-web">
        <div className="section-head">
          <h3 id="mm-web">Web app</h3>
          <span className="label">conceptual</span>
        </div>
        <ArchitectureGraph label="Browser to Next.js app, which fetches from the TMDB API and embeds a Disqus comment section" nodes={WEB_NODES} edges={WEB_EDGES} width={600} height={200} flow minWidth={480} />
      </section>

      <section className="stack" aria-labelledby="mm-rec">
        <div className="section-head">
          <h3 id="mm-rec">Recommendation service</h3>
          <span className="label">conceptual</span>
        </div>
        <ArchitectureGraph label="Movie data flows into a Flask service that applies TF-IDF vectorization and cosine similarity to produce recommendations" nodes={REC_NODES} edges={REC_EDGES} width={770} height={112} flow minWidth={620} />
      </section>

      <section className="stack pj-demo panel" aria-labelledby="mm-demo">
        <div className="section-head">
          <h3 id="mm-demo">Try the technique</h3>
          <span className="label">live · in your browser</span>
        </div>
        <p className="prose">
          Pick a movie. Its keywords are vectorized with TF-IDF, and the nearest neighbours by cosine similarity are returned
          &mdash; the same idea behind MovieMate&rsquo;s Flask backend, on a 12-title toy corpus.
        </p>
        <div className="pj-movies" role="radiogroup" aria-label="Movie">
          {TOY_MOVIES.map((m, i) => (
            <button key={m.title} role="radio" aria-checked={pick === i} className="pj-movie" onClick={() => setPick(i)}>
              {m.title}
            </button>
          ))}
        </div>
        <ol className="pj-recs" aria-live="polite">
          {recs.map((r, rank) => {
            const terms = sharedTerms(model, pick, r.i);
            return (
              <li key={r.i} className="pj-rec">
                <span className="pj-rec__rank mono">#{rank + 1}</span>
                <span className="pj-rec__title">{TOY_MOVIES[r.i].title}</span>
                <span className="pj-rec__bar" aria-hidden="true">
                  <span style={{ width: `${Math.max(2, r.score * 100)}%` }} />
                </span>
                <span className="pj-rec__score mono">{r.score.toFixed(3)}</span>
                <span className="pj-rec__terms mono">{terms.length ? terms.join(' · ') : 'no shared terms'}</span>
              </li>
            );
          })}
        </ol>
        <Conceptual>Toy demo of TF-IDF + cosine similarity. The titles and keywords are hand-written examples, not MovieMate&rsquo;s data.</Conceptual>
      </section>
    </>
  );
}
