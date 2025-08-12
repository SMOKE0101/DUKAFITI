import { useEffect } from "react";

// Sets CSS variables that follow the real visual viewport height on mobile
// This makes dialogs/modals adapt when the virtual keyboard is visible.
const VisualViewportProvider = () => {
  useEffect(() => {
    const root = document.documentElement;

    const setVars = () => {
      try {
        const vv = (window as any).visualViewport as VisualViewport | undefined;
        if (vv) {
          const vvh = Math.round(vv.height);
          const kbHeight = Math.max(0, window.innerHeight - vvh);
          root.style.setProperty("--vvh", `${vvh}px`);
          root.style.setProperty("--kb", `${Math.round(kbHeight)}px`);
          root.setAttribute('data-kb-open', kbHeight > 80 ? 'true' : 'false');
        } else {
          // Fallback
          root.style.setProperty("--vvh", `${window.innerHeight}px`);
          root.style.setProperty("--kb", `0px`);
          root.setAttribute('data-kb-open', 'false');
        }
      } catch {
        root.style.setProperty("--vvh", `${window.innerHeight}px`);
        root.style.setProperty("--kb", `0px`);
        root.setAttribute('data-kb-open', 'false');
      }
    };

    setVars();

    const vv = (window as any).visualViewport as VisualViewport | undefined;
    if (vv) {
      vv.addEventListener("resize", setVars);
      vv.addEventListener("scroll", setVars);
    }
    window.addEventListener("orientationchange", setVars);
    window.addEventListener("resize", setVars);

    return () => {
      if (vv) {
        vv.removeEventListener("resize", setVars);
        vv.removeEventListener("scroll", setVars);
      }
      window.removeEventListener("orientationchange", setVars);
      window.removeEventListener("resize", setVars);
    };
  }, []);

    return null;
};

export default VisualViewportProvider;
