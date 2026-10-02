/**
 * Start Neerav Quest from anywhere (desktop PLAY icon, terminal, palette).
 * If the game isn't mounted yet (e.g. we're switching from recruiter mode),
 * the request is remembered and picked up when it mounts.
 */
export const QUEST_EVENT = 'neeravos:quest';
let pending = false;

export function launchQuest(): void {
  pending = true;
  window.dispatchEvent(new CustomEvent(QUEST_EVENT));
}

/** Called by the game; returns true (once) if a launch was requested. */
export function consumeQuestLaunch(): boolean {
  const was = pending;
  pending = false;
  return was;
}
