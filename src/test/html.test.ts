import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { describe, expect, it } from 'vitest';
import { DEFAULT_THEME_PREFERENCE } from '../lib/theme';

const html = readFileSync(resolve(__dirname, '../../index.html'), 'utf8');
const doc = new DOMParser().parseFromString(html, 'text/html');
const meta = (sel: string) => doc.querySelector(sel)?.getAttribute('content') ?? '';

describe('index.html', () => {
  it('has the agreed title and an accurate description', () => {
    expect(doc.title).toBe('Neerav Daswani — Software Engineer');
    const description = meta('meta[name="description"]');
    expect(description).toContain('IIT (BHU)');
    expect(description).toContain('Software Engineer');
    expect(description.length).toBeLessThanOrEqual(300);
  });

  it('has Open Graph + Twitter cards, canonical URL and icons', () => {
    for (const sel of [
      'meta[property="og:title"]',
      'meta[property="og:description"]',
      'meta[property="og:image"]',
      'meta[name="twitter:card"]',
    ]) {
      expect(meta(sel), sel).not.toBe('');
    }
    expect(doc.querySelector('link[rel="canonical"]')).not.toBeNull();
    expect(doc.querySelector('link[rel="icon"]')).not.toBeNull();
  });

  it('has valid JSON-LD for the person', () => {
    const ld = JSON.parse(doc.querySelector('script[type="application/ld+json"]')!.textContent!);
    expect(ld).toMatchObject({ '@type': 'Person', name: 'Neerav Daswani', jobTitle: 'Software Engineer' });
  });

  it('has a no-JS fallback with the essentials', () => {
    const noscript = html.slice(html.indexOf('<noscript>'), html.indexOf('</noscript>'));
    expect(noscript).toContain('Neerav_Daswani_Resume.pdf');
    expect(noscript).toContain('github.com/Neerav-03');
  });

  it('pre-paint theme script defaults to the same theme as src/lib/theme.ts', () => {
    const script = [...doc.querySelectorAll('script:not([type]), script[type=""]')]
      .map((s) => s.textContent)
      .join('\n');
    const initial = script.match(/var theme = '(\w+)'/)?.[1];
    expect(initial).toBe(DEFAULT_THEME_PREFERENCE);
    expect(script).toContain('neeravos.theme');
  });
});
