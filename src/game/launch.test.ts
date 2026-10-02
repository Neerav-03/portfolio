import { describe, expect, it, vi } from 'vitest';
import { consumeQuestLaunch, launchQuest, QUEST_EVENT } from './launch';

describe('launchQuest', () => {
  it('fires the event and leaves a one-shot pending flag for a game that mounts later', () => {
    const listener = vi.fn();
    window.addEventListener(QUEST_EVENT, listener);
    launchQuest();
    expect(listener).toHaveBeenCalledOnce();
    expect(consumeQuestLaunch()).toBe(true);
    expect(consumeQuestLaunch()).toBe(false);
    window.removeEventListener(QUEST_EVENT, listener);
  });
});
