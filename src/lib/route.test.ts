import { describe, expect, it } from 'vitest';
import { appHref, buildHash, parseHash } from './route';

describe('parseHash', () => {
  it.each([
    ['', { kind: 'desktop' }],
    ['#/', { kind: 'desktop' }],
    ['#/nope', { kind: 'desktop' }],
    ['#/recruiter', { kind: 'recruiter' }],
    ['#/experience', { kind: 'app', id: 'experience', params: {} }],
    ['#/experience/drp', { kind: 'app', id: 'experience', params: { view: 'drp' } }],
    ['#projects/doclink', { kind: 'app', id: 'projects', params: { view: 'doclink' } }],
  ])('%s', (hash, expected) => {
    expect(parseHash(hash)).toEqual(expected);
  });
});

describe('buildHash', () => {
  it('encodes mode and focused window', () => {
    expect(buildHash('recruiter')).toBe('#/recruiter');
    expect(buildHash('system')).toBe('');
    expect(buildHash('system', { id: 'code' })).toBe('#/code');
    expect(buildHash('system', { id: 'experience', view: 'dal' })).toBe('#/experience/dal');
  });

  it('round-trips through parseHash', () => {
    const hash = buildHash('system', { id: 'projects', view: 'moviemate' });
    expect(parseHash(hash)).toEqual({ kind: 'app', id: 'projects', params: { view: 'moviemate' } });
    expect(appHref('projects', 'moviemate')).toBe(hash);
  });
});
