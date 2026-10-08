import { paintEarth, type EarthView } from "./earth";

/* paints Earth off the main thread for earthCanvas.ts */
self.onmessage = (e: MessageEvent<{ id: number; view: EarthView }>) => {
  const px = paintEarth(e.data.view);
  self.postMessage({ id: e.data.id, px }, { transfer: [px.buffer] });
};
