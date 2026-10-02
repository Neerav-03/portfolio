import { describe, expect, it, vi } from 'vitest';
import { fuzzyScore } from './fuzzy';

describe('fuzzyScore', () => {
  it('matches everything for an empty query', () => {
    expect(fuzzyScore('', 'anything')).toBeGreaterThan(0);
  });

  it('ranks prefix > word prefix > substring > subsequence', () => {
    const prefix = fuzzyScore('dal', 'DAL — GDPR Data Access Levels');
    const word = fuzzyScore('data', 'GDPR Data Access Levels');
    const substring = fuzzyScore('ention', 'Data Retention Policy');
    const subsequence = fuzzyScore('mvm', 'MovieMate');
    expect(prefix).toBeGreaterThan(word);
    expect(word).toBeGreaterThan(substring);
    expect(substring).toBeGreaterThan(subsequence);
    expect(subsequence).toBeGreaterThan(0);
  });

  it('is case-insensitive', () => {
    expect(fuzzyScore('DRP', 'drp — data retention')).toBe(fuzzyScore('drp', 'DRP — Data Retention'));
  });

  it('rejects characters scattered across the whole string', () => {
    expect(fuzzyScore('theme', 'Switch to Recruiter mode')).toBe(0);
    expect(fuzzyScore('dal', 'Copy email address')).toBe(0);
  });

  it('returns 0 when a character is missing', () => {
    expect(fuzzyScore('xyz', 'Codeforces')).toBe(0);
  });
});

describe('downloadFile', () => {
  it('clicks a temporary download link and removes it', async () => {
    const { downloadFile } = await import('./fuzzy');
    const clicked: HTMLAnchorElement[] = [];
    const spy = vi.spyOn(HTMLAnchorElement.prototype, 'click').mockImplementation(function (this: HTMLAnchorElement) {
      clicked.push(this);
    });
    downloadFile('/resume.pdf', 'resume.pdf');
    expect(spy).toHaveBeenCalledOnce();
    expect(clicked[0].download).toBe('resume.pdf');
    expect(clicked[0].getAttribute('href')).toBe('/resume.pdf');
    expect(document.querySelector('a[download]')).toBeNull();
  });
});
