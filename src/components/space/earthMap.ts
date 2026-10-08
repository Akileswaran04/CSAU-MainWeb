import { cloudDensity, earthColor } from "./earth";

/* ============================================================
   EARTH'S MAP - the site's one Earth (earth.ts: earthColor and
   cloudDensity, unchanged) laid out flat for the story's shader
   Earth (planet.tsx). One RGBA texel per direction on an
   equirectangular grid: RGB = the surface colour (sRGB), A = how
   cloudy. Row 0 is the south pole; u runs east from longitude -pi
   (the -x axis), with longitude = atan(z, x).
   About 0.6s for 512 x 256 on a desktop, so it is painted in a
   worker (earthMap.worker.ts).
   ============================================================ */

export function paintEarthMap(w: number, h: number, seed: number): Uint8Array<ArrayBuffer> {
  const out = new Uint8Array(w * h * 4);
  const base = earthColor(seed);
  for (let j = 0; j < h; j++) {
    const lat = ((j + 0.5) / h - 0.5) * Math.PI;
    const y = Math.sin(lat);
    const c = Math.cos(lat);
    for (let i = 0; i < w; i++) {
      const lon = ((i + 0.5) / w) * Math.PI * 2 - Math.PI;
      const x = c * Math.cos(lon);
      const z = c * Math.sin(lon);
      const col = base(x, y, z);
      const o = (j * w + i) * 4;
      out[o] = col[0] * 255 + 0.5;
      out[o + 1] = col[1] * 255 + 0.5;
      out[o + 2] = col[2] * 255 + 0.5;
      out[o + 3] = Math.min(1, cloudDensity(x, y, z)) * 255 + 0.5;
    }
  }
  return out;
}
