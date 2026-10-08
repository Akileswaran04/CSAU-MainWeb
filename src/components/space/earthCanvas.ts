import type { EarthView } from "./earth";

/* Paints the site's Earth (earth.ts) into a canvas, in a worker so the page never stalls on it. The noise costs
   about 4us a pixel on a desktop and several times that on a phone, so the picture is painted at no more than
   `budget` pixels (BUDGET unless a slower, sharper picture is worth it) and the canvas is scaled up to its size
   on the page. At the sizes the site shows Earth the finest coastline is a few pixels across, so little is lost.
   ponytail: one worker, jobs in order; a second worker if two big paints ever overlap. */
const BUDGET = 60000;

type Job = { view: EarthView; done: (px: Uint8ClampedArray<ArrayBuffer>) => void };
let worker: Worker | null | undefined;
let seq = 0;
const jobs = new Map<number, Job>();

/* no worker (or it failed): paint here instead */
const onMain = (job: Job) => void import("./earth").then((m) => job.done(m.paintEarth(job.view)));

function send(job: Job) {
  if (worker === undefined) {
    try {
      worker = new Worker(new URL("./earth.worker.ts", import.meta.url));
      worker.onmessage = (e: MessageEvent<{ id: number; px: Uint8ClampedArray<ArrayBuffer> }>) => {
        jobs.get(e.data.id)?.done(e.data.px);
        jobs.delete(e.data.id);
      };
      worker.onerror = () => {
        worker = null;
        jobs.forEach(onMain);
        jobs.clear();
      };
    } catch {
      worker = null;
    }
  }
  if (!worker) return onMain(job);
  jobs.set(++seq, job);
  worker.postMessage({ id: seq, view: job.view });
}

/** Paint Earth into `canvas`, shown at `w` x `h` CSS px; the view's disc is in CSS px too. Resolves once it is on
    the canvas. */
export function paintEarthInto(canvas: HTMLCanvasElement, w: number, h: number, view: Omit<EarthView, "w" | "h">, budget = BUDGET): Promise<void> {
  const k = Math.min(window.devicePixelRatio || 1, Math.sqrt(budget / Math.max(1, w * h)));
  const pw = Math.max(1, Math.round(w * k));
  const ph = Math.max(1, Math.round(h * k));
  return new Promise((resolve) =>
    send({
      view: { ...view, w: pw, h: ph, cx: view.cx * k, cy: view.cy * k, r: view.r * k },
      done: (px) => {
        canvas.width = pw;
        canvas.height = ph;
        canvas.getContext("2d")?.putImageData(new ImageData(px, pw, ph), 0, 0);
        resolve();
      },
    })
  );
}
