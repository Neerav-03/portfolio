import type { AppId, AppParams } from '../data/types';
import { isAppId } from '../os/appMeta';
import type { Mode } from '../os/osState';

export type Route =
  | { kind: 'recruiter' }
  | { kind: 'app'; id: AppId; params: AppParams }
  | { kind: 'desktop' };

/** Hash routes: #/recruiter, #/experience, #/experience/drp, ... */
export function parseHash(hash: string): Route {
  const parts = hash.replace(/^#\/?/, '').split('/').filter(Boolean);
  if (parts[0] === 'recruiter') return { kind: 'recruiter' };
  if (parts[0] && isAppId(parts[0])) {
    return { kind: 'app', id: parts[0], params: parts[1] ? { view: parts[1] } : {} };
  }
  return { kind: 'desktop' };
}

export function buildHash(mode: Mode, top?: { id: AppId; view?: string }): string {
  if (mode === 'recruiter') return '#/recruiter';
  if (!top) return '';
  return top.view ? `#/${top.id}/${top.view}` : `#/${top.id}`;
}

export function appHref(id: AppId, view?: string): string {
  return view ? `#/${id}/${view}` : `#/${id}`;
}
