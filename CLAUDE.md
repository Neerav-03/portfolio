# NEERAV OS: repo rules

The portfolio of Neerav Daswani, built as a small OS (React 19 + Vite + TypeScript, static, deployed to GitHub Pages).
These rules apply to every change, whether made by a person or an agent.

## Hard rules

1. **Facts come only from the resume** (`public/Neerav_Daswani_Resume.pdf`) or from values Neerav supplied explicitly.
   - Never invent Netradyne internals, metrics, users, technologies or responsibilities.
   - Diagrams of internal systems must say they are conceptual (`<Conceptual />`).
   - Synthetic chart data must be labelled illustrative.
   - All facts live in `src/data/portfolio.ts`. `src/data/portfolio.test.ts` pins them, so if a fact changes, update that test as well.
2. **Colours come from tokens.** Use `var(--…)` from `src/styles/tokens.css`, which has a dark `:root` block and a light `:root[data-theme='light']` block.
   - Don't hardcode hex/rgb values; `src/test/design-system.test.ts` fails if you do.
   - Every colour token needs a light-theme value.
   - Every text tone must meet WCAG AA (4.5:1) on every surface. The tests compute this.
3. **Accessibility is part of "done".** Use real buttons and links and keyboard paths, and keep focus visible. Put `aria-label` only on elements that have a role. Respect `prefers-reduced-motion`. CI runs axe on every view in both themes.
4. **Personal data.**
   - The only photo is `src/assets/profile-*.webp`, cropped with all metadata stripped. Don't copy it elsewhere or add other personal images.
   - Don't put the phone number on the site.
5. **Tests ship with the change.**
   - New logic gets unit tests (`*.test.ts` next to the code).
   - New UI behaviour gets a component test or a Playwright spec in `e2e/`.
   - Coverage thresholds in `vitest.config.ts` must keep passing.

## Commands

| Command               | What it does                                                                             |
| --------------------- | ---------------------------------------------------------------------------------------- |
| `npm run dev`         | Dev server                                                                               |
| `npm run verify:fast` | Types + lint + unit tests (~30s). Run before every commit; the pre-push hook runs it too |
| `npm run test:e2e`    | Playwright against the production build (desktop + mobile, includes axe)                 |
| `npm run verify`      | Everything CI runs                                                                       |
| `npm run format`      | Prettier                                                                                 |

Git hooks (installed by `npm install`):

- **pre-commit:** ESLint and Prettier on staged files.
- **pre-push:** `verify:fast`.

CI (`.github/workflows/ci.yml`) runs the full suite, including e2e and accessibility, on every pull request. `deploy.yml` deploys `main` only after that suite passes.

## Where things live

- `src/data/`: content (source of truth) and types
- `src/os/`: shell (boot, desktop, window manager, dock, palette, state in `osState.ts`, `useOS` hook)
- `src/apps/<app>/`: one folder per app, lazy-loaded via `src/apps/registry.ts`
- `src/components/`: `ArchitectureGraph`, `MiniCharts`, `ResumeViewer`, `Avatar`, shared bits
- `src/terminal/commands.ts`: terminal commands (every command is exercised by a test)
- `src/lib/theme.ts`: theme store. Keep its default in sync with the inline script in `index.html` (a test checks this)
- `e2e/`: Playwright specs. `fixtures.ts` fails any test whose page logs an error

## Conventions

- External navigation into an app (palette, terminal, links) bumps `nonce`. Apps react with the "adjust state during render" pattern, not `useEffect` + `setState`.
- Components that only render while open (palette, modal) start with fresh state. Don't reset state in effects.
- Prefer CSS container queries (window width) over media queries for layouts inside app windows.
