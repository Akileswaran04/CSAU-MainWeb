import { paintEarthMap } from "./earthMap";

/* paints Earth's map off the main thread for planet.tsx */
self.onmessage = (e: MessageEvent<{ id: number; w: number; h: number; seed: number }>) => {
  const px = paintEarthMap(e.data.w, e.data.h, e.data.seed);
  self.postMessage({ id: e.data.id, px }, { transfer: [px.buffer] });
};
