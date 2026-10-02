import { useOS } from './useOS';

export function ModeToggle() {
  const { state, setMode } = useOS();
  return (
    <div className="seg mode-toggle" role="group" aria-label="Display mode">
      <button className="seg__btn" aria-pressed={state.mode === 'recruiter'} onClick={() => setMode('recruiter')}>
        RECRUITER<span className="hide-sm"> MODE</span>
      </button>
      <button className="seg__btn" aria-pressed={state.mode === 'system'} onClick={() => setMode('system')}>
        SYSTEM<span className="hide-sm"> MODE</span>
      </button>
    </div>
  );
}
