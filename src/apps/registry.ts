import { lazy, type ComponentType, type LazyExoticComponent } from 'react';
import type { AppId, AppParams } from '../data/types';

export interface AppProps {
  params: AppParams;
  /** Changes whenever params are pushed from outside (palette / terminal / links). */
  nonce: number;
  /** Report the app's current sub-view so the OS can reflect it in the title bar + URL. */
  onView: (view: string) => void;
}

type LazyApp = LazyExoticComponent<ComponentType<AppProps>>;

// Each app is code-split so the shell loads fast and apps load on first open.
export const APP_COMPONENTS: Record<AppId, LazyApp> = {
  experience: lazy(() => import('./experience/ExperienceApp')),
  projects: lazy(() => import('./projects/ProjectsApp')),
  engineering: lazy(() => import('./engineering/EngineeringApp')),
  code: lazy(() => import('./code/CodeApp')),
  education: lazy(() => import('./education/EducationApp')),
  about: lazy(() => import('./about/AboutApp')),
  resume: lazy(() => import('./resume/ResumeApp')),
};

/** Warm the chunk for an app (e.g. on hover) so opening it feels instant. */
const preloaders: Record<AppId, () => Promise<unknown>> = {
  experience: () => import('./experience/ExperienceApp'),
  projects: () => import('./projects/ProjectsApp'),
  engineering: () => import('./engineering/EngineeringApp'),
  code: () => import('./code/CodeApp'),
  education: () => import('./education/EducationApp'),
  about: () => import('./about/AboutApp'),
  resume: () => import('./resume/ResumeApp'),
};

export function preloadApp(id: AppId): void {
  void preloaders[id]().catch(() => undefined);
}
