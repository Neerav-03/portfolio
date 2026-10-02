# NEERAV OS

The portfolio of **Neerav Daswani**, Software Engineer, built as a small operating system. The OS handles navigation, and the content is interactive explanations of the engineering work on the resume.

- **System mode** has a boot sequence, a desktop with draggable windows, a dock, a terminal (<kbd>Ctrl</kbd> + <kbd>`</kbd>) and a command palette (<kbd>Ctrl</kbd>/<kbd>⌘</kbd> + <kbd>K</kbd>).
- **Recruiter mode** is a fast single-page summary with the resume download, GitHub and LinkedIn.
- Every view is deep-linkable, e.g. `#/experience/drp`, `#/projects/moviemate` or `#/recruiter`.

## Stack

React 19, Vite and TypeScript, styled with plain CSS (design tokens plus per-app stylesheets). The only runtime dependencies are `lucide-react` (icons) and self-hosted Geist fonts. There is no backend; everything is static.

## Run locally

```bash
npm install
npm run dev        # http://localhost:5173
npm run build      # typecheck + production build into dist/
npm run preview    # serve the production build
```

## Updating content

All factual content lives in **`src/data/portfolio.ts`**: profile, experience bullets, projects, education, competitive programming and extracurriculars. Update that file, and the desktop, recruiter mode, terminal and command palette all pick up the change.

The resume PDF is `public/Neerav_Daswani_Resume.pdf`. Replace it with the same filename.

The conceptual diagrams are defined next to their apps:

| What | Where |
| --- | --- |
| Netradyne system map | `src/apps/experience/netradyneGraph.ts` |
| DRP / DAL / Encryption modules | `src/apps/experience/*Module.tsx` |
| EXL dashboard (illustrative data) | `src/apps/experience/ExlModule.tsx` |
| MovieMate / Doc-Link | `src/apps/projects/` |
| Skill → evidence matrix | `src/apps/engineering/EngineeringApp.tsx` |
| Terminal commands | `src/terminal/commands.ts` |
| Command palette entries | `src/os/commands.ts` |

## Project layout

```
src/
  data/          portfolio content + types (source of truth)
  os/            shell: boot, desktop, window manager, dock, palette, state
  components/    ArchitectureGraph, MiniCharts, shared UI
  apps/          one folder per application (code-split, lazy-loaded)
  terminal/      terminal UI + command definitions
  recruiter/     recruiter mode
  styles/        tokens, base and shared UI styles
```

## Deploy to GitHub Pages

`.github/workflows/deploy.yml` builds and deploys on every push to `main`.

1. Create a GitHub repository. Name it `Neerav-03.github.io` to serve from the root URL, or use any name to get a project page at `https://neerav-03.github.io/<repo>/`.
2. Push this folder to the `main` branch.
3. In the repository, go to **Settings → Pages → Build and deployment** and set **Source** to **GitHub Actions**.

The build uses relative asset paths (`base: './'`), so it works at either URL without changes. The workflow derives the canonical/Open Graph URL from the repository name. To use a custom domain, set a repository variable `SITE_URL` (e.g. `https://example.com/`). For local builds, the URL comes from `.env`.

## Accessibility and performance

- Fully keyboard-operable, with visible focus states, ARIA roles on windows, the palette (combobox/listbox) and the terminal (log + labelled input).
- `prefers-reduced-motion` turns off flow animations and shortens the boot sequence.
- Apps, the terminal and the palette are code-split. The shell loads first, and app chunks are prefetched on hover.
