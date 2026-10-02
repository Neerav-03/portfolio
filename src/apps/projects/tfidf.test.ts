import { describe, expect, it } from 'vitest';
import { buildModel, cosine, recommend, sharedTerms, TOY_MOVIES } from './tfidf';

describe('TF-IDF + cosine similarity', () => {
  const model = buildModel(TOY_MOVIES.map((m) => m.tags));
  const idx = (title: string) => TOY_MOVIES.findIndex((m) => m.title === title);

  it('produces L2-normalised vectors', () => {
    for (const v of model.vectors) {
      expect(cosine(v, v)).toBeCloseTo(1, 10);
    }
  });

  it('weights rare terms above common ones', () => {
    // "layers" appears once, "scifi" appears in several titles.
    expect(model.idf.get('layers')!).toBeGreaterThan(model.idf.get('scifi')!);
  });

  it('is symmetric and bounded', () => {
    const a = model.vectors[0];
    const b = model.vectors[1];
    expect(cosine(a, b)).toBeCloseTo(cosine(b, a), 12);
    expect(cosine(a, b)).toBeGreaterThanOrEqual(0);
    expect(cosine(a, b)).toBeLessThanOrEqual(1);
  });

  it('recommends thematically similar titles and never the title itself', () => {
    const recs = recommend(model, idx('The Dark Knight'), 3);
    expect(recs).toHaveLength(3);
    expect(recs.map((r) => r.i)).not.toContain(idx('The Dark Knight'));
    expect(TOY_MOVIES[recs[0].i].title).toBe('Batman Begins');
    expect(recs[0].score).toBeGreaterThanOrEqual(recs[1].score);
  });

  it('lists shared terms', () => {
    expect(sharedTerms(model, idx('Gravity'), idx('The Martian'))).toEqual(
      expect.arrayContaining(['space', 'astronaut', 'survival', 'stranded']),
    );
  });
});
