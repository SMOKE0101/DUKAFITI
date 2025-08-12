import { useEffect } from 'react';

export default function useScrollIntoViewOnFocus(
  containerRef: React.RefObject<HTMLElement>,
  options?: { topOffset?: number; minMargin?: number }
) {
  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;

    const topOffset = options?.topOffset ?? 12; // px from container top
    const minMargin = options?.minMargin ?? 8;  // px margin above keyboard

    const handler = (e: Event) => {
      const target = e.target as HTMLElement | null;
      if (!target) return;

      const tag = target.tagName.toLowerCase();
      const isEditable =
        tag === 'input' ||
        tag === 'textarea' ||
        tag === 'select' ||
        target.isContentEditable;
      if (!isEditable) return;

      // Wait a tick so visualViewport is updated after keyboard opens
      setTimeout(() => {
        const rect = target.getBoundingClientRect();
        const vv = (window as any).visualViewport as VisualViewport | undefined;
        const viewportHeight = vv?.height ?? window.innerHeight;
        const bottomLimit = viewportHeight - minMargin; // visible area bottom

        const container = el;
        const containerRect = container.getBoundingClientRect();
        const currentScroll = container.scrollTop;

        // If input is above the visible top area, scroll up
        if (rect.top < containerRect.top + topOffset) {
          const delta = rect.top - (containerRect.top + topOffset);
          container.scrollTo({ top: currentScroll + delta, behavior: 'smooth' });
        }
        // If input is covered by keyboard area, scroll down
        else if (rect.bottom > bottomLimit) {
          const delta = rect.bottom - bottomLimit;
          container.scrollTo({ top: currentScroll + delta, behavior: 'smooth' });
        }
      }, 50);
    };

    el.addEventListener('focusin', handler);
    return () => el.removeEventListener('focusin', handler);
  }, [containerRef, options?.topOffset, options?.minMargin]);
}
