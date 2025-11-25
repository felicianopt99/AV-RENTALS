#!/usr/bin/env node
import fs from 'node:fs';
import path from 'node:path';
import url from 'node:url';
import pkg from 'pngjs';

const { PNG } = pkg;

const __dirname = path.dirname(url.fileURLToPath(import.meta.url));
const projectRoot = path.resolve(__dirname, '..');
const publicDir = path.join(projectRoot, 'public');

/**
 * Create a solid color PNG of given size
 * @param {number} width
 * @param {number} height
 * @param {string} hexColor like "#3b82f6"
 * @param {string} outPath absolute path to write
 */
async function createSolidPng(width, height, hexColor, outPath) {
  const png = new PNG({ width, height });
  const { r, g, b, a } = hexToRgba(hexColor);

  for (let y = 0; y < height; y++) {
    for (let x = 0; x < width; x++) {
      const idx = (width * y + x) << 2;
      png.data[idx] = r;
      png.data[idx + 1] = g;
      png.data[idx + 2] = b;
      png.data[idx + 3] = a;
    }
  }

  await new Promise((resolve, reject) => {
    const stream = fs.createWriteStream(outPath);
    stream.on('error', reject);
    stream.on('finish', resolve);
    png.pack().pipe(stream);
  });
}

function hexToRgba(hex) {
  let h = hex.replace('#', '');
  if (h.length === 3) {
    h = h.split('').map((c) => c + c).join('');
  }
  const num = parseInt(h, 16);
  const r = (num >> 16) & 255;
  const g = (num >> 8) & 255;
  const b = num & 255;
  return { r, g, b, a: 255 };
}

async function main() {
  if (!fs.existsSync(publicDir)) {
    throw new Error(`public directory not found at ${publicDir}`);
  }

  const color = '#3b82f6'; // Tailwind blue-500 to match theme_color

  const targets = [
    { size: 192, file: 'icon-192.png' },
    { size: 512, file: 'icon-512.png' },
  ];

  for (const t of targets) {
    const out = path.join(publicDir, t.file);
    await createSolidPng(t.size, t.size, color, out);
    console.log(`Generated ${t.file} (${t.size}x${t.size})`);
  }

  console.log('All icons generated in public/.');
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
