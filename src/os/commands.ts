import {
  ArrowUpRight,
  Box,
  Copy,
  Download,
  Eye,
  Gamepad2,
  KeyRound,
  LayoutGrid,
  Monitor,
  Moon,
  ShieldCheck,
  Store,
  SquareTerminal,
  Sun,
  Timer,
  UserRoundCheck,
  Workflow,
  XSquare,
  type LucideIcon,
} from 'lucide-react';
import type { AppId, AppParams } from '../data/types';
import { codingProfiles, profile, projects, resumeUrl } from '../data/portfolio';
import { downloadFile } from '../lib/fuzzy';
import { setThemePreference } from '../lib/theme';
import { APP_META, DESKTOP_APPS } from './appMeta';

export interface CommandContext {
  openApp: (id: AppId, params?: AppParams) => void;
  setTerminal: (open: boolean) => void;
  setMode: (mode: 'system' | 'recruiter') => void;
  closeAll: () => void;
  copyEmail: () => void;
  previewResume: () => void;
  play: () => void;
}

export interface PaletteCommand {
  id: string;
  group: string;
  title: string;
  sub?: string;
  keywords?: string;
  icon: LucideIcon;
  external?: boolean;
  run: (ctx: CommandContext) => void;
}

const openUrl = (url: string) => window.open(url, '_blank', 'noopener,noreferrer');

export function buildCommands(): PaletteCommand[] {
  const apps: PaletteCommand[] = DESKTOP_APPS.map((id) => ({
    id: `app-${id}`,
    group: 'Applications',
    title: APP_META[id].title,
    sub: APP_META[id].description,
    icon: APP_META[id].icon,
    run: (c) => c.openApp(id),
  }));
  apps.push({
    id: 'app-terminal',
    group: 'Applications',
    title: 'Terminal',
    sub: 'Command line · Ctrl+`',
    keywords: 'shell console cli',
    icon: SquareTerminal,
    run: (c) => c.setTerminal(true),
  });

  const modules: PaletteCommand[] = [
    {
      id: 'netradyne',
      group: 'Experience',
      title: 'Netradyne',
      sub: 'Software Engineer · system map',
      keywords: 'work job video platform',
      icon: Workflow,
      run: (c) => c.openApp('experience', { view: 'netradyne' }),
    },
    {
      id: 'drp',
      group: 'Experience',
      title: 'DRP — Data Retention Policy',
      sub: 'Banded S3 tiers, lifecycle expiry, presigned-URL gating',
      keywords: 'retention s3 lifecycle expiry bucket',
      icon: Timer,
      run: (c) => c.openApp('experience', { view: 'drp' }),
    },
    {
      id: 'dal',
      group: 'Experience',
      title: 'DAL — GDPR Data Access Levels',
      sub: '4-tier config-driven privacy framework',
      keywords: 'gdpr privacy access audit',
      icon: ShieldCheck,
      run: (c) => c.openApp('experience', { view: 'dal' }),
    },
    {
      id: 'encryption',
      group: 'Experience',
      title: 'Encryption — CMK → TEK migration',
      sub: 'Tenant-specific local encryption',
      keywords: 'kms cmk tek keys crypto',
      icon: KeyRound,
      run: (c) => c.openApp('experience', { view: 'encryption' }),
    },
    {
      id: 'exl',
      group: 'Experience',
      title: 'EXL — Price monitoring dashboard',
      sub: 'Decision Analyst Intern',
      keywords: 'rfm elasticity retail pricing',
      icon: Store,
      run: (c) => c.openApp('experience', { view: 'exl' }),
    },
  ];

  const projectCmds: PaletteCommand[] = projects.map((p) => ({
    id: `project-${p.id}`,
    group: 'Projects',
    title: p.name,
    sub: p.tech.slice(0, 4).join(' · '),
    keywords: p.tagline,
    icon: Box,
    run: (c) => c.openApp('projects', { view: p.id }),
  }));

  const code: PaletteCommand[] = codingProfiles.map((cp) => ({
    id: `code-${cp.id}`,
    group: 'Competitive programming',
    title: cp.platform,
    sub: `${cp.title} · max rating ${cp.maxRating}`,
    keywords: 'cp contests rating',
    icon: LayoutGrid,
    run: (c) => c.openApp('code', { view: cp.id }),
  }));

  const actions: PaletteCommand[] = [
    {
      id: 'play',
      group: 'Actions',
      title: 'Play Neerav Quest',
      sub: 'A 45-second platformer through the resume',
      keywords: 'game mario platformer fun',
      icon: Gamepad2,
      run: (c) => c.play(),
    },
    {
      id: 'preview-resume',
      group: 'Actions',
      title: 'Preview resume',
      sub: 'View the PDF in place',
      keywords: 'cv pdf view open',
      icon: Eye,
      run: (c) => c.previewResume(),
    },
    {
      id: 'download-resume',
      group: 'Actions',
      title: 'Download resume',
      sub: 'PDF',
      keywords: 'cv pdf',
      icon: Download,
      run: () => downloadFile(resumeUrl, profile.resumeFile),
    },
    {
      id: 'copy-email',
      group: 'Actions',
      title: 'Copy email address',
      sub: profile.email,
      keywords: 'contact mail',
      icon: Copy,
      run: (c) => c.copyEmail(),
    },
    {
      id: 'recruiter',
      group: 'Actions',
      title: 'Switch to Recruiter mode',
      sub: 'Fast, single-page summary',
      keywords: 'simple summary hr',
      icon: UserRoundCheck,
      run: (c) => c.setMode('recruiter'),
    },
    {
      id: 'system',
      group: 'Actions',
      title: 'Switch to System mode',
      sub: 'Full interactive OS',
      keywords: 'desktop os',
      icon: LayoutGrid,
      run: (c) => c.setMode('system'),
    },
    { id: 'close-all', group: 'Actions', title: 'Close all windows', icon: XSquare, run: (c) => c.closeAll() },
    {
      id: 'theme-light',
      group: 'Appearance',
      title: 'Switch to light theme',
      keywords: 'appearance mode colour color day',
      icon: Sun,
      run: () => setThemePreference('light'),
    },
    {
      id: 'theme-dark',
      group: 'Appearance',
      title: 'Switch to dark theme',
      keywords: 'appearance mode colour color night',
      icon: Moon,
      run: () => setThemePreference('dark'),
    },
    {
      id: 'theme-system',
      group: 'Appearance',
      title: 'Use system theme',
      sub: 'Follow the OS light / dark setting',
      keywords: 'appearance mode auto os',
      icon: Monitor,
      run: () => setThemePreference('system'),
    },
  ];

  const links: PaletteCommand[] = [
    {
      id: 'link-github',
      group: 'Links',
      title: 'GitHub',
      sub: profile.links.github.replace('https://', ''),
      icon: ArrowUpRight,
      external: true,
      run: () => openUrl(profile.links.github),
    },
    {
      id: 'link-linkedin',
      group: 'Links',
      title: 'LinkedIn',
      sub: 'linkedin.com/in/neerav-daswani',
      icon: ArrowUpRight,
      external: true,
      run: () => openUrl(profile.links.linkedin),
    },
    ...codingProfiles.map((cp) => ({
      id: `link-${cp.id}`,
      group: 'Links',
      title: `${cp.platform} profile`,
      sub: cp.url.replace('https://', ''),
      icon: ArrowUpRight,
      external: true,
      run: () => openUrl(cp.url),
    })),
    ...projects.map((p) => ({
      id: `link-${p.id}`,
      group: 'Links',
      title: `${p.name} repository`,
      sub: p.repo.replace('https://', ''),
      icon: ArrowUpRight,
      external: true,
      run: () => openUrl(p.repo),
    })),
  ];

  return [...modules, ...apps, ...projectCmds, ...code, ...actions, ...links];
}
