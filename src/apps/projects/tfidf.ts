/**
 * Minimal TF-IDF + cosine similarity, used by the MovieMate toy demo.
 * The tiny corpus is hand-written keyword lists, not MovieMate's dataset.
 */
export const TOY_MOVIES: { title: string; tags: string }[] = [
  { title: 'Inception', tags: 'dream heist subconscious mind thriller scifi layers' },
  { title: 'Interstellar', tags: 'space wormhole time father survival scifi astronaut' },
  { title: 'The Matrix', tags: 'simulation hacker reality scifi action mind' },
  { title: 'The Martian', tags: 'mars astronaut survival space science stranded' },
  { title: 'Gravity', tags: 'space astronaut survival orbit stranded' },
  { title: 'The Dark Knight', tags: 'batman joker crime vigilante gotham chaos' },
  { title: 'Batman Begins', tags: 'batman origin vigilante gotham crime fear' },
  { title: 'Shutter Island', tags: 'asylum mystery detective mind thriller island' },
  { title: 'The Prestige', tags: 'magicians rivalry mystery obsession thriller' },
  { title: 'Toy Story', tags: 'toys friendship animation adventure family' },
  { title: 'Finding Nemo', tags: 'ocean fish father adventure animation family' },
  { title: 'Up', tags: 'balloon adventure animation family journey' },
];

type Vector = Map<string, number>;

export interface TfIdfModel {
  vectors: Vector[];
  idf: Map<string, number>;
}

export function buildModel(docs: string[]): TfIdfModel {
  const tokens = docs.map((d) => d.toLowerCase().split(/\s+/).filter(Boolean));
  const df = new Map<string, number>();
  tokens.forEach((t) => new Set(t).forEach((w) => df.set(w, (df.get(w) ?? 0) + 1)));
  const n = docs.length;
  // Smoothed IDF, as in scikit-learn's TfidfVectorizer defaults.
  const idf = new Map([...df].map(([w, c]) => [w, Math.log((1 + n) / (1 + c)) + 1]));
  const vectors = tokens.map((t) => {
    const tf = new Map<string, number>();
    t.forEach((w) => tf.set(w, (tf.get(w) ?? 0) + 1));
    const v: Vector = new Map([...tf].map(([w, c]) => [w, c * (idf.get(w) ?? 0)]));
    const norm = Math.sqrt([...v.values()].reduce((s, x) => s + x * x, 0)) || 1;
    v.forEach((x, w) => v.set(w, x / norm));
    return v;
  });
  return { vectors, idf };
}

export function cosine(a: Vector, b: Vector): number {
  let dot = 0;
  a.forEach((x, w) => {
    const y = b.get(w);
    if (y) dot += x * y;
  });
  return dot; // vectors are L2-normalised
}

export function recommend(model: TfIdfModel, index: number, k = 3) {
  const target = model.vectors[index];
  return model.vectors
    .map((v, i) => ({ i, score: i === index ? -1 : cosine(target, v) }))
    .sort((a, b) => b.score - a.score)
    .slice(0, k);
}

export function sharedTerms(model: TfIdfModel, a: number, b: number): string[] {
  const va = model.vectors[a];
  const vb = model.vectors[b];
  return [...va.keys()].filter((w) => vb.has(w));
}
