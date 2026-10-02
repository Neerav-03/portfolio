import { useEffect, useState, type RefObject } from 'react';

/**
 * True while the element's content overflows it (on the given axis).
 * Scrollable regions must be keyboard-focusable (WCAG 2.1.1); callers use this to
 * add tabIndex={0} only when there is actually something to scroll, so wide
 * screens don't get extra tab stops.
 */
export function useScrollable(ref: RefObject<HTMLElement | null>, axis: 'x' | 'y' | 'both' = 'both'): boolean {
  const [scrollable, setScrollable] = useState(false);
  useEffect(() => {
    const el = ref.current;
    if (!el || typeof ResizeObserver === 'undefined') return;
    const check = () => {
      const x = el.scrollWidth > el.clientWidth + 1;
      const y = el.scrollHeight > el.clientHeight + 1;
      setScrollable(axis === 'x' ? x : axis === 'y' ? y : x || y);
    };
    const ro = new ResizeObserver(check);
    ro.observe(el);
    for (const child of Array.from(el.children)) ro.observe(child);
    check();
    return () => ro.disconnect();
  }, [ref, axis]);
  return scrollable;
}
