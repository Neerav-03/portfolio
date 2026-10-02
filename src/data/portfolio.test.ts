/**
 * Content guard: the site must only state facts from the resume (or ones
 * Neerav supplied explicitly). If a fact changes, update the resume first,
 * then this test, then src/data/portfolio.ts.
 */
import { existsSync, readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { describe, expect, it } from 'vitest';
import {
  codingProfiles,
  contests,
  drpBucketTiersDays,
  education,
  exams,
  experience,
  extracurriculars,
  profile,
  projects,
} from './portfolio';

const root = resolve(__dirname, '../..');

describe('portfolio facts', () => {
  it('profile', () => {
    expect(profile.name).toBe('Neerav Daswani');
    expect(profile.title).toBe('Software Engineer');
    expect(profile.company).toBe('Netradyne');
    expect(profile.coreStack).toEqual(['AWS', 'Java', 'C++', 'PostgreSQL']);
    expect(profile.email).toMatch(/^[^@\s]+@[^@\s]+\.[a-z]+$/);
  });

  it('education and exams', () => {
    expect(education).toMatchObject({
      shortName: 'IIT (BHU)',
      gpa: 9.59,
      gpaScale: 10,
      start: 'Dec 2021',
      end: 'May 2025',
    });
    expect(exams).toEqual([
      { exam: 'JEE Advanced', year: 2021, rank: 'AIR 3150' },
      { exam: 'JEE Main', year: 2021, rank: 'AIR 2220', percentile: 99.8 },
    ]);
  });

  it('experience', () => {
    const [netradyne, exl] = experience;
    expect(netradyne).toMatchObject({ role: 'Software Engineer', start: 'July 2025', end: 'Present' });
    expect(netradyne.bullets).toHaveLength(4);
    expect(netradyne.bullets.join(' ')).toMatch(/five duration tiers, 62–403 days/);
    expect(exl).toMatchObject({ role: 'Decision Analyst Intern', start: 'May 2024', end: 'July 2024' });
    expect(exl.bullets.join(' ')).toMatch(/5 retail stores over 2 years \(857 products\)/);
  });

  it('competitive programming', () => {
    expect(codingProfiles.map((c) => [c.platform, c.title, c.maxRating])).toEqual([
      ['Codeforces', 'Expert', 1639],
      ['CodeChef', '4 Star', 1853],
    ]);
    expect(contests.map((c) => c.rank)).toEqual([946, 989]);
  });

  it('extracurriculars', () => {
    expect(extracurriculars.map((x) => [x.id, x.stat])).toEqual([
      ['aptiquest', '400+'],
      ['admad', '18'],
      ['karate', '1st'],
    ]);
  });

  it('DRP bucket tiers stay inside the documented 62–403 day range', () => {
    expect(drpBucketTiersDays).toEqual([62, 93, 124, 217, 403]);
    expect(drpBucketTiersDays).toHaveLength(5);
    expect([...drpBucketTiersDays].sort((a, b) => a - b)).toEqual([...drpBucketTiersDays]);
  });

  it('all external links are https and point at the right accounts', () => {
    const links = [
      ...Object.values(profile.links),
      ...projects.map((p) => p.repo),
      ...codingProfiles.map((c) => c.url),
    ];
    for (const href of links) expect(href).toMatch(/^https:\/\//);
    expect(profile.links.github).toBe('https://github.com/Neerav-03');
    for (const p of projects) expect(p.repo.startsWith(profile.links.github)).toBe(true);
  });

  it('the resume PDF ships with the site', () => {
    const file = resolve(root, 'public', profile.resumeFile);
    expect(existsSync(file)).toBe(true);
    expect(readFileSync(file).subarray(0, 5).toString()).toBe('%PDF-');
  });
});
