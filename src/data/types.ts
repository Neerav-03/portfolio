export type AppId = 'experience' | 'projects' | 'engineering' | 'code' | 'education' | 'about' | 'resume';

/** Optional deep-link target inside an app, e.g. { view: 'drp' }. */
export interface AppParams {
  view?: string;
}

export interface Link {
  label: string;
  href: string;
}

export interface Profile {
  name: string;
  handle: string;
  title: string;
  company: string;
  location: string;
  email: string;
  headline: string;
  summary: string;
  coreStack: string[];
  links: {
    github: string;
    linkedin: string;
    codeforces: string;
    codechef: string;
  };
  resumeFile: string;
}

export interface ExperienceEntry {
  id: 'netradyne' | 'exl';
  company: string;
  role: string;
  location: string;
  start: string;
  end: string;
  /** Resume bullets, verbatim in substance. */
  bullets: string[];
  tags: string[];
}

export interface Project {
  id: 'moviemate' | 'doclink';
  name: string;
  tagline: string;
  repo: string;
  tech: string[];
  bullets: string[];
}

export interface Education {
  institution: string;
  shortName: string;
  degree: string;
  start: string;
  end: string;
  gpa: number;
  gpaScale: number;
}

export interface ExamResult {
  exam: string;
  year: number;
  rank: string;
  percentile?: number;
}

export interface CodingProfile {
  id: 'codeforces' | 'codechef';
  platform: string;
  handle: string;
  url: string;
  title: string;
  maxRating: number;
  note: string;
}

export interface ContestResult {
  contest: string;
  rank: number;
  platform: string;
}

export interface SkillGroup {
  label: string;
  items: string[];
}

export interface Extracurricular {
  id: 'aptiquest' | 'admad' | 'karate';
  name: string;
  role: string;
  stat: string;
  statLabel: string;
  detail: string;
}
