import { Suspense, useCallback } from 'react';
import { APP_COMPONENTS } from '../apps/registry';
import { useOS } from './useOS';
import type { WindowState } from './osState';
import { Window } from './Window';

function WindowHost({ win, z, isTop, isMobile }: { win: WindowState; z: number; isTop: boolean; isMobile: boolean }) {
  const { reportView } = useOS();
  const App = APP_COMPONENTS[win.id];
  const onView = useCallback((view: string) => reportView(win.id, view), [reportView, win.id]);
  return (
    <Window win={win} z={z} isTop={isTop} isMobile={isMobile}>
      <Suspense fallback={<div className="loading">loading {win.id}…</div>}>
        <App params={win.params} nonce={win.nonce} onView={onView} />
      </Suspense>
    </Window>
  );
}

export function WindowLayer({ isMobile }: { isMobile: boolean }) {
  const { state } = useOS();
  const visible = state.windows.filter((w) => !w.minimized && !w.closing);
  const topId = visible[visible.length - 1]?.id;
  return (
    <>
      {state.windows.map((w, i) => (
        <WindowHost key={w.id} win={w} z={20 + i} isTop={w.id === topId || (w.closing && !topId)} isMobile={isMobile} />
      ))}
    </>
  );
}
