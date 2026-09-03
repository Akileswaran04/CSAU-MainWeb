import sharp from 'sharp';
import { readFileSync } from 'fs';
import { join } from 'path';

const svgPath = join(process.cwd(), 'public', 'card-pattern.svg');
const pngPath = join(process.cwd(), 'public', 'card-pattern.png');

const svgBuffer = readFileSync(svgPath);

await sharp(svgBuffer)
  .resize(600, 900)
  .png({ quality: 95 })
  .toFile(pngPath);

console.log(`Converted: ${pngPath}`);
