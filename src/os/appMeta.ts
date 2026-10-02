import {
  Briefcase,
  Code,
  FileText,
  FolderGit2,
  GraduationCap,
  Network,
  UserRound,
  type LucideIcon,
} from 'lucide-react';
import type { AppId } from '../data/types';

export interface AppMeta {
  id: AppId;
  title: string;
  /** Shown in the window title bar, e.g. "experience.app". */
  process: string;
  description: string;
  icon: LucideIcon;
  size: { w: number; h: number };
}

export const APP_META: Record<AppId, AppMeta> = {
  experience: {
    id: 'experience',
    title: 'Experience',
    process: 'experience.app',
    description: 'Netradyne systems & EXL dashboard',
    icon: Briefcase,
    size: { w: 1080, h: 720 },
  },
  projects: {
    id: 'projects',
    title: 'Projects',
    process: 'projects.app',
    description: 'MovieMate · Doc-Link',
    icon: FolderGit2,
    size: { w: 1000, h: 680 },
  },
  engineering: {
    id: 'engineering',
    title: 'Engineering',
    process: 'engineering.graph',
    description: 'Skills mapped to where they were used',
    icon: Network,
    size: { w: 920, h: 620 },
  },
  code: {
    id: 'code',
    title: 'Code',
    process: 'code.cp',
    description: 'Competitive programming',
    icon: Code,
    size: { w: 820, h: 600 },
  },
  education: {
    id: 'education',
    title: 'Education',
    process: 'education.sys',
    description: 'IIT (BHU) · JEE',
    icon: GraduationCap,
    size: { w: 780, h: 600 },
  },
  about: {
    id: 'about',
    title: 'About',
    process: 'about.md',
    description: 'Background & hidden modules',
    icon: UserRound,
    size: { w: 760, h: 600 },
  },
  resume: {
    id: 'resume',
    title: 'Resume',
    process: 'resume.pdf',
    description: 'View or download the PDF',
    icon: FileText,
    size: { w: 820, h: 760 },
  },
};

export const DESKTOP_APPS: AppId[] = [
  'experience',
  'projects',
  'engineering',
  'code',
  'education',
  'about',
  'resume',
];

export const DOCK_APPS: AppId[] = ['experience', 'projects', 'engineering', 'code', 'education', 'resume'];

export function isAppId(value: string): value is AppId {
  return value in APP_META;
}
