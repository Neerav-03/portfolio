/**
 * Tiny fuzzy scorer: exact prefix > word prefix > substring > subsequence.
 * Returns 0 for no match.
 */
export function fuzzyScore(query: string, text: string): number {
  const q = query.trim().toLowerCase();
  if (!q) return 1;
  const t = text.toLowerCase();
  if (t.startsWith(q)) return 100 - t.length * 0.1;
  if (t.split(/[\s\-·/()]+/).some((w) => w.startsWith(q))) return 80 - t.length * 0.1;
  const idx = t.indexOf(q);
  if (idx >= 0) return 60 - idx;
  // Subsequence match, rewarding contiguous runs. Matches scattered across the
  // whole string (e.g. "theme" in "swiTcH to rEcruiter MoDE") don't count.
  let ti = 0;
  let score = 0;
  let run = 0;
  let first = -1;
  for (const ch of q) {
    const found = t.indexOf(ch, ti);
    if (found < 0) return 0;
    if (first < 0) first = found;
    run = found === ti ? run + 1 : 0;
    score += 1 + run;
    ti = found + 1;
  }
  if (ti - first > q.length * 2 + 1) return 0;
  return Math.min(40, score);
}

export function downloadFile(href: string, filename: string): void {
  const a = document.createElement('a');
  a.href = href;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  a.remove();
}
