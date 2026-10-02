import { defineConfig, mergeConfig } from 'vitest/config';
import viteConfig from './vite.config.ts';

export default mergeConfig(
  viteConfig,
  defineConfig({
    test: {
      environment: 'jsdom',
      // One jsdom per worker (files stay isolated) — much faster than one per file.
      pool: 'vmThreads',
      setupFiles: ['src/test/setup.ts'],
      include: ['src/**/*.test.{ts,tsx}'],
      restoreMocks: true,
      coverage: {
        provider: 'v8',
        reporter: ['text-summary', 'html'],
        // Logic modules carry the coverage bar; UI is covered by component + e2e tests.
        include: [
          'src/lib/**',
          'src/os/osState.ts',
          'src/terminal/commands.ts',
          'src/apps/projects/tfidf.ts',
          'src/game/engine.ts',
          'src/game/level.ts',
          'src/game/facts.ts',
          'src/game/launch.ts',
          'src/data/**',
        ],
        thresholds: { lines: 85, functions: 85, statements: 85, branches: 75 },
      },
    },
  }),
);
