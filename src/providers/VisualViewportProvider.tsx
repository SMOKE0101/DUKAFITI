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
          root.style.setProperty("--vvh", `${Math.round(vv.height)}px`);
        } else {
          // Fallback
          root.style.setProperty("--vvh", `${window.innerHeight}px`);
        }
      } catch {
        root.style.setProperty("--vvh", `${window.innerHeight}px`);
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
