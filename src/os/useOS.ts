import { createContext, useContext } from 'react';
import type { AppId, AppParams } from '../data/types';
import type { Mode, OSState } from './osState';

export interface OSApi {
  state: OSState;
  openApp: (id: AppId, params?: AppParams) => void;
  closeApp: (id: AppId) => void;
  removeApp: (id: AppId) => void;
  minimizeApp: (id: AppId) => void;
  focusApp: (id: AppId) => void;
  toggleMax: (id: AppId) => void;
  setBounds: (id: AppId, b: { x: number; y: number; w?: number; h?: number }) => void;
  reportView: (id: AppId, view: string) => void;
  setTerminal: (open: boolean) => void;
  setPalette: (open: boolean) => void;
  setMode: (mode: Mode) => void;
  /** Minimise every window (and leave recruiter mode) so the desktop is visible. */
  showDesktop: () => void;
  /** Show the desktop and start Neerav Quest. */
  playQuest: () => void;
  previewResume: () => void;
  closeResumePreview: () => void;
  toast: (text: string) => void;
  copyEmail: () => void;
}

export const OSContext = createContext<OSApi | null>(null);

export function useOS(): OSApi {
  const ctx = useContext(OSContext);
  if (!ctx) throw new Error('useOS must be used inside <OSProvider>');
  return ctx;
}
