import { useEffect, useState } from "react";

/**
 * True one frame after mount. React's dev-only double mount (StrictMode) would
 * otherwise mount a react-three-fiber <Canvas> twice: fiber schedules the first
 * mount's cleanup with a timer, and that timer force-loses the WebGL context
 * the second mount is already using. Rendering the Canvas only once this is
 * true means it mounts exactly once.
 */
export function useSettled(): boolean {
  const [ready, setReady] = useState(false);
  useEffect(() => {
    const id = requestAnimationFrame(() => setReady(true));
    return () => cancelAnimationFrame(id);
  }, []);
  return ready;
}
