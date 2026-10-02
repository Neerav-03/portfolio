import type { AppId, AppParams } from '../data/types';

/** Deep links listed in the desktop's "Engineering modules" widget. */
export interface ModuleLink {
  code: string;
  title: string;
  sub: string;
  app: AppId;
  params?: AppParams;
}

export const FEATURED_MODULES: ModuleLink[] = [
  {
    code: 'SYS',
    title: 'Netradyne system map',
    sub: 'Conceptual platform overview',
    app: 'experience',
    params: { view: 'netradyne' },
  },
  {
    code: 'DRP',
    title: 'Data Retention Policy',
    sub: '5 S3 duration tiers · 62–403 days',
    app: 'experience',
    params: { view: 'drp' },
  },
  {
    code: 'DAL',
    title: 'GDPR Data Access Levels',
    sub: '4-tier config-driven privacy',
    app: 'experience',
    params: { view: 'dal' },
  },
  {
    code: 'TEK',
    title: 'Encryption migration',
    sub: 'AWS CMK → tenant-specific keys',
    app: 'experience',
    params: { view: 'encryption' },
  },
  {
    code: 'EXL',
    title: 'Price monitoring dashboard',
    sub: '5 stores · 2 years · 857 products',
    app: 'experience',
    params: { view: 'exl' },
  },
  { code: 'MM', title: 'MovieMate', sub: 'Next.js · Flask · TF-IDF', app: 'projects', params: { view: 'moviemate' } },
  { code: 'DL', title: 'Doc-Link', sub: 'React · Express · MongoDB', app: 'projects', params: { view: 'doclink' } },
];
