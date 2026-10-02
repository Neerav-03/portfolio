import type { AppId, AppParams } from '../data/types';
import {
  codingProfiles,
  contests,
  education,
  exams,
  experience,
  extracurriculars,
  profile,
  projects,
  resumeUrl,
  skills,
} from '../data/portfolio';
import { isAppId } from '../os/appMeta';

export type Tone = 'dim' | 'ok' | 'err' | 'warn' | 'accent' | 'head';
export interface Seg {
  text: string;
  tone?: Tone;
  href?: string;
}
export type Line = string | Seg[];

export interface TermContext {
  openApp: (id: AppId, params?: AppParams) => void;
  setTerminal: (open: boolean) => void;
  setMode: (mode: 'system' | 'recruiter') => void;
  history: string[];
}

export interface CommandResult {
  lines?: Line[];
  clear?: boolean;
  /** Runs after output is printed (open an app, close the terminal…). */
  after?: () => void;
}

type Handler = (args: string[], ctx: TermContext) => CommandResult;

interface CommandDef {
  description: string;
  hidden?: boolean;
  run: Handler;
}

const head = (text: string): Line => [{ text, tone: 'head' }];
const dim = (text: string): Line => [{ text, tone: 'dim' }];
const kv = (k: string, v: string, pad = 14): Line => [{ text: k.padEnd(pad), tone: 'dim' }, { text: v }];
const link = (label: string, href: string): Line => [{ text: label, href, tone: 'accent' }];
const hint = (cmd: string, rest: string): Line => [{ text: '→ ', tone: 'dim' }, { text: cmd, tone: 'accent' }, { text: rest, tone: 'dim' }];

const commands: Record<string, CommandDef> = {
  help: {
    description: 'List available commands',
    run: () => ({
      lines: [
        'Available commands:',
        ...Object.entries(commands)
          .filter(([, c]) => !c.hidden)
          .map(([name, c]): Line => [{ text: `  ${name.padEnd(14)}`, tone: 'accent' }, { text: c.description, tone: 'dim' }]),
        '',
        dim('Also: open <app>, ls, whoami, neofetch, history — and a few undocumented ones.'),
      ],
    }),
  },

  about: {
    description: 'Who is Neerav?',
    run: () => ({
      lines: [
        head(`${profile.name} — ${profile.title}`),
        profile.summary,
        '',
        kv('location', profile.location),
        kv('company', `${profile.company} (since July 2025)`),
        kv('education', `${education.shortName}, ${education.degree}`),
        '',
        hint('experience', ' for the work, `projects` for side builds.'),
      ],
    }),
  },

  experience: {
    description: 'Work history',
    run: () => ({
      lines: experience.flatMap((e): Line[] => [
        head(`${e.role} · ${e.company}`),
        dim(`${e.start} – ${e.end} · ${e.location}`),
        ...e.bullets.map((b): Line => `  • ${b}`),
        '',
      ]).concat([hint('open experience', ' for the interactive system diagrams (DRP · DAL · TEK).')]),
    }),
  },

  projects: {
    description: 'Side projects',
    run: () => ({
      lines: projects.flatMap((p): Line[] => [
        head(p.name),
        dim(p.tech.join(' · ')),
        ...p.bullets.map((b): Line => `  • ${b}`),
        [{ text: '  repo: ', tone: 'dim' }, { text: p.repo.replace('https://', ''), href: p.repo, tone: 'accent' }],
        '',
      ]),
    }),
  },

  skills: {
    description: 'Languages & technologies',
    run: () => ({
      lines: skills.map((g) => kv(g.label.toLowerCase(), g.items.join(', '), 12)),
    }),
  },

  education: {
    description: 'Academic record',
    run: () => ({
      lines: [
        head(education.institution),
        `${education.degree} · ${education.start} – ${education.end}`,
        kv('gpa', `${education.gpa} / ${education.gpaScale}`, 16),
        ...exams.map((x) => kv(`${x.exam} ${x.year}`.toLowerCase(), `${x.rank}${x.percentile ? ` · ${x.percentile.toFixed(2)} percentile` : ''}`, 16)),
      ],
    }),
  },

  achievements: {
    description: 'Competitive programming & more',
    run: () => ({
      lines: [
        ...codingProfiles.map((c) => kv(c.platform.toLowerCase(), `${c.title} · max rating ${c.maxRating}`, 12)),
        ...contests.map((c) => kv('rank', `Global #${c.rank} — ${c.contest}`, 12)),
        ...exams.map((x) => kv(x.exam.toLowerCase().replace(' ', '_'), `${x.rank} (${x.year})`, 12)),
        '',
        ...extracurriculars.map((x) => kv(x.id, x.detail, 12)),
      ],
    }),
  },

  resume: {
    description: 'Open the resume (PDF)',
    run: (_a, ctx) => ({
      lines: [
        [{ text: 'Opening resume.pdf … ', tone: 'dim' }, { text: 'download', href: resumeUrl, tone: 'accent' }],
      ],
      after: () => {
        ctx.openApp('resume');
        ctx.setTerminal(false);
      },
    }),
  },

  github: {
    description: 'GitHub profile',
    run: () => {
      window.open(profile.links.github, '_blank', 'noopener,noreferrer');
      return { lines: [link(profile.links.github.replace('https://', ''), profile.links.github)] };
    },
  },

  contact: {
    description: 'Ways to reach Neerav',
    run: () => ({
      lines: [
        [{ text: 'email'.padEnd(10), tone: 'dim' }, { text: profile.email, href: `mailto:${profile.email}`, tone: 'accent' }],
        [{ text: 'linkedin'.padEnd(10), tone: 'dim' }, { text: 'linkedin.com/in/neerav-daswani', href: profile.links.linkedin, tone: 'accent' }],
        [{ text: 'github'.padEnd(10), tone: 'dim' }, { text: profile.links.github.replace('https://', ''), href: profile.links.github, tone: 'accent' }],
      ],
    }),
  },

  clear: {
    description: 'Clear the screen',
    run: () => ({ clear: true }),
  },

  // ---------- Undocumented / utility ----------
  open: {
    description: 'Open an app',
    hidden: true,
    run: (args, ctx) => {
      const target = (args[0] ?? '').toLowerCase().replace(/\.app$/, '');
      const alias: Record<string, [AppId, string?]> = {
        drp: ['experience', 'drp'],
        dal: ['experience', 'dal'],
        tek: ['experience', 'encryption'],
        encryption: ['experience', 'encryption'],
        netradyne: ['experience', 'netradyne'],
        exl: ['experience', 'exl'],
        moviemate: ['projects', 'moviemate'],
        'doc-link': ['projects', 'doclink'],
        doclink: ['projects', 'doclink'],
        codeforces: ['code', 'codeforces'],
        codechef: ['code', 'codechef'],
      };
      const hit = isAppId(target) ? ([target] as [AppId]) : alias[target];
      if (!hit) return { lines: [[{ text: `open: no such app '${args[0] ?? ''}'. `, tone: 'err' }, { text: 'Try: experience, projects, engineering, code, education, about, resume, drp, dal, tek', tone: 'dim' }]] };
      return {
        lines: [dim(`launching ${hit[0]}${hit[1] ? `/${hit[1]}` : ''} …`)],
        after: () => {
          ctx.openApp(hit[0], hit[1] ? { view: hit[1] } : undefined);
          ctx.setTerminal(false);
        },
      };
    },
  },
  drp: { description: 'Open DRP module', hidden: true, run: (_a, ctx) => commands.open.run(['drp'], ctx) },
  dal: { description: 'Open DAL module', hidden: true, run: (_a, ctx) => commands.open.run(['dal'], ctx) },
  tek: { description: 'Open encryption module', hidden: true, run: (_a, ctx) => commands.open.run(['tek'], ctx) },

  ls: {
    description: 'List files',
    hidden: true,
    run: () => ({
      lines: [
        [
          { text: 'experience/  ', tone: 'accent' },
          { text: 'projects/  ', tone: 'accent' },
          { text: 'code/  ', tone: 'accent' },
          { text: 'skills.txt  about.md  resume.pdf  ' },
          { text: '.secrets', tone: 'dim' },
        ],
      ],
    }),
  },
  cat: {
    description: 'Print a file',
    hidden: true,
    run: (args, ctx) => {
      const f = args[0] ?? '';
      if (!f) return { lines: ['usage: cat <file>'] };
      if (f === 'skills.txt') return commands.skills.run([], ctx);
      if (f === 'about.md') return commands.about.run([], ctx);
      if (f === 'resume.pdf') return { lines: [dim('cat: resume.pdf is a binary file. Try `resume`.')] };
      if (f === '.secrets') return { lines: [[{ text: '�#9f!x…', tone: 'dim' }], dim('Encrypted with a tenant-specific key. Not this tenant, though.')] };
      return { lines: [[{ text: `cat: ${f}: No such file or directory`, tone: 'err' }]] };
    },
  },
  cd: {
    description: 'Change directory',
    hidden: true,
    run: (args) => ({ lines: [dim(`cd: ${args[0] ?? '~'}: this OS is a single page. Try \`open ${args[0]?.replace(/\/$/, '') ?? 'experience'}\`.`)] }),
  },
  pwd: { description: 'Print working directory', hidden: true, run: () => ({ lines: ['/home/neerav'] }) },
  whoami: {
    description: 'Current user',
    hidden: true,
    run: () => ({ lines: ['guest', dim('(the owner is `neerav`. try `about`.)')] }),
  },
  neofetch: {
    description: 'System info',
    hidden: true,
    run: () => {
      const rows: [string, string][] = [
        ['os', 'NEERAV OS v1.0 (static, GitHub Pages)'],
        ['host', `${profile.company} · ${profile.title}`],
        ['uptime', 'since July 2025'],
        ['kernel', `${education.shortName} · Electrical Engineering`],
        ['shell', 'C/C++ · Java · JavaScript · SQL'],
        ['cloud', 'AWS S3 · IAM · KMS · Lambda · EventBridge'],
        ['rating', `CF ${codingProfiles[0].maxRating} · CC ${codingProfiles[1].maxRating}`],
      ];
      const logo = ['███╗   ██╗', '████╗  ██║', '██╔██╗ ██║', '██║╚██╗██║', '██║ ╚████║', '╚═╝  ╚═══╝', ''];
      // The ASCII logo only fits beside the info on wider terminals.
      const withLogo = window.innerWidth >= 640;
      return {
        lines: rows.map(([k, v], i): Line => [
          ...(withLogo ? [{ text: `${(logo[i] ?? '').padEnd(14)}`, tone: 'accent' as const }] : []),
          { text: `${k}`.padEnd(8), tone: 'ok' },
          { text: v },
        ]),
      };
    },
  },
  history: {
    description: 'Command history',
    hidden: true,
    run: (_a, ctx) => ({ lines: ctx.history.length ? ctx.history.map((h, i) => `${String(i + 1).padStart(4)}  ${h}`) : [dim('no history yet')] }),
  },
  date: { description: 'Print date', hidden: true, run: () => ({ lines: [new Date().toString()] }) },
  echo: { description: 'Echo text', hidden: true, run: (args) => ({ lines: [args.join(' ')] }) },
  mode: {
    description: 'Switch mode',
    hidden: true,
    run: (args, ctx) => {
      const m = args[0];
      if (m !== 'recruiter' && m !== 'system') return { lines: ['usage: mode recruiter | system'] };
      return { lines: [dim(`switching to ${m} mode …`)], after: () => ctx.setMode(m) };
    },
  },
  exit: { description: 'Close terminal', hidden: true, run: (_a, ctx) => ({ after: () => ctx.setTerminal(false) }) },
  sudo: {
    description: 'Superuser',
    hidden: true,
    run: (args) => {
      const rest = args.join(' ').toLowerCase();
      if (/^hire\s+neerav/.test(rest)) {
        return {
          lines: [
            dim('[sudo] password for guest: ••••••••'),
            dim('Verifying candidate…'),
            [{ text: '  ✓ ', tone: 'ok' }, { text: `B.Tech EE, ${education.shortName} — GPA ${education.gpa}/10` }],
            [{ text: '  ✓ ', tone: 'ok' }, { text: 'Ships retention, privacy and encryption systems on AWS' }],
            [{ text: '  ✓ ', tone: 'ok' }, { text: `Codeforces Expert (${codingProfiles[0].maxRating}) · CodeChef 4★ (${codingProfiles[1].maxRating})` }],
            [{ text: '  ✓ ', tone: 'ok' }, { text: 'Shito-Ryu 1st Dan — stays calm under load' }],
            [{ text: 'Permission granted. ', tone: 'ok' }, { text: 'Remaining step requires a human: ' }, { text: profile.email, href: `mailto:${profile.email}?subject=Let%27s%20talk`, tone: 'accent' }],
          ],
        };
      }
      if (/^rm\s+-rf/.test(rest)) return commands.rm.run(args.slice(1), { history: [], openApp: () => undefined, setTerminal: () => undefined, setMode: () => undefined });
      return { lines: [[{ text: 'guest is not in the sudoers file. This incident will be reported.', tone: 'err' }], dim('(hint: there is exactly one thing sudo can do here.)')] };
    },
  },
  rm: {
    description: 'Remove files',
    hidden: true,
    run: (args) => {
      if (args.includes('-rf') || args.includes('-fr')) {
        return { lines: [[{ text: 'rm: refusing to delete /', tone: 'err' }], dim('Expiry here is handled by retention policy — on schedule, per tier, no manual deletes.')] };
      }
      return { lines: [dim('rm: read-only file system')] };
    },
  },
  vim: { description: 'Editor', hidden: true, run: () => ({ lines: [dim('You are now in vim. Just kidding — nobody gets out that easily. :q')] }) },
  nano: { description: 'Editor', hidden: true, run: () => commands.vim.run([], { history: [], openApp: () => undefined, setTerminal: () => undefined, setMode: () => undefined }) },
  ping: { description: 'Ping', hidden: true, run: () => ({ lines: ['pong — 0 ms. No backend; everything here is static.'] }) },
  coffee: { description: 'Brew', hidden: true, run: () => ({ lines: [[{ text: 'HTTP 418', tone: 'warn' }, { text: " — I'm a teapot." }]] }) },
  karate: {
    description: 'Karate',
    hidden: true,
    run: (_a, ctx) => ({
      lines: [[{ text: '押忍 ', tone: 'accent' }, { text: 'Shodan (1st Dan), Shito-Ryu Karate — 2017.' }], dim('opening the dojo …')],
      after: () => {
        ctx.openApp('about', { view: 'karate' });
        ctx.setTerminal(false);
      },
    }),
  },
};

export const COMMAND_NAMES = Object.keys(commands);

export function runCommand(input: string, ctx: TermContext): CommandResult {
  const trimmed = input.trim();
  if (!trimmed) return {};
  const [rawName, ...args] = trimmed.split(/\s+/);
  const name = rawName.toLowerCase();
  const cmd = commands[name];
  if (!cmd) {
    const suggestion = COMMAND_NAMES.find((c) => !commands[c].hidden && (c.startsWith(name.slice(0, 2)) || name.startsWith(c)));
    return {
      lines: [
        [{ text: `command not found: ${rawName}`, tone: 'err' }],
        dim(suggestion ? `did you mean \`${suggestion}\`? type \`help\` for the list.` : 'type `help` for the list of commands.'),
      ],
    };
  }
  return cmd.run(args, ctx);
}

export function complete(partial: string): string[] {
  const p = partial.toLowerCase();
  if (!p) return [];
  return COMMAND_NAMES.filter((c) => c.startsWith(p));
}
