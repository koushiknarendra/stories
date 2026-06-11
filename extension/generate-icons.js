// Generates icons/icon16.png, icon48.png, icon128.png
// Run: node generate-icons.js
// No dependencies — pure Node.js built-ins only.

const zlib = require("zlib");
const fs   = require("fs");
const path = require("path");

function crc32(buf) {
  let c = 0xffffffff;
  for (const b of buf) {
    c ^= b;
    for (let i = 0; i < 8; i++) c = c & 1 ? (c >>> 1) ^ 0xedb88320 : c >>> 1;
  }
  return (c ^ 0xffffffff) >>> 0;
}

function chunk(type, data) {
  const len = Buffer.alloc(4); len.writeUInt32BE(data.length);
  const t   = Buffer.from(type);
  const crc = Buffer.alloc(4); crc.writeUInt32BE(crc32(Buffer.concat([t, data])));
  return Buffer.concat([len, t, data, crc]);
}

// Draw a rounded-rect Storis icon: purple bg + white stacked-cards mark
function renderIcon(size) {
  // RGBA pixels
  const pixels = new Uint8Array(size * size * 4);

  const R = 124, G = 92, B = 255; // #7C5CFF purple

  // Corner radius ~22% of size
  const radius = Math.round(size * 0.22);

  function inRoundedRect(x, y) {
    const x0 = Math.max(x - (size - 1 - radius), 0);
    const x1 = Math.max(radius - x, 0);
    const y0 = Math.max(y - (size - 1 - radius), 0);
    const y1 = Math.max(radius - y, 0);
    return x0 * x0 + y0 * y0 < radius * radius &&
           x1 * x1 + y0 * y0 < radius * radius &&
           x0 * x0 + y1 * y1 < radius * radius &&
           x1 * x1 + y1 * y1 < radius * radius;
  }

  for (let y = 0; y < size; y++) {
    for (let x = 0; x < size; x++) {
      const i = (y * size + x) * 4;
      if (inRoundedRect(x, y)) {
        pixels[i]     = R;
        pixels[i + 1] = G;
        pixels[i + 2] = B;
        pixels[i + 3] = 255;
      } else {
        pixels[i + 3] = 0; // transparent
      }
    }
  }

  // Draw two white rounded-rect "cards" offset from each other
  function drawCard(px, py, pw, ph, alpha) {
    const cr = Math.max(1, Math.round(pw * 0.18));
    for (let y = py; y < py + ph; y++) {
      for (let x = px; x < px + pw; x++) {
        if (x < 0 || x >= size || y < 0 || y >= size) continue;
        const lx = x - px, ly = y - py;
        const rx0 = Math.max(lx - (pw - 1 - cr), 0);
        const rx1 = Math.max(cr - lx, 0);
        const ry0 = Math.max(ly - (ph - 1 - cr), 0);
        const ry1 = Math.max(cr - ly, 0);
        const inside =
          rx0 * rx0 + ry0 * ry0 < cr * cr &&
          rx1 * rx1 + ry0 * ry0 < cr * cr &&
          rx0 * rx0 + ry1 * ry1 < cr * cr &&
          rx1 * rx1 + ry1 * ry1 < cr * cr;
        if (inside) {
          const i = (y * size + x) * 4;
          if (pixels[i + 3] === 255) { // only draw on purple bg
            pixels[i]     = 255;
            pixels[i + 1] = 255;
            pixels[i + 2] = 255;
            pixels[i + 3] = Math.round(255 * alpha);
          }
        }
      }
    }
  }

  const pad  = Math.round(size * 0.18);
  const cw   = Math.round(size * 0.52);
  const ch   = Math.round(size * 0.66);
  const cx   = Math.round((size - cw) / 2);
  const cy   = Math.round((size - ch) / 2);
  const off  = Math.round(size * 0.09);

  // Back card (offset, semi-transparent)
  drawCard(cx - off, cy + off, cw, ch, 0.45);
  // Front card (solid)
  drawCard(cx, cy, cw, ch, 0.92);

  return pixels;
}

function buildPNG(size) {
  const pixels = renderIcon(size);

  // RGBA raw data with filter byte per row
  const raw = Buffer.alloc(size * (1 + size * 4));
  for (let y = 0; y < size; y++) {
    raw[y * (size * 4 + 1)] = 0; // filter None
    for (let x = 0; x < size; x++) {
      const src = (y * size + x) * 4;
      const dst = y * (size * 4 + 1) + 1 + x * 4;
      raw[dst]     = pixels[src];
      raw[dst + 1] = pixels[src + 1];
      raw[dst + 2] = pixels[src + 2];
      raw[dst + 3] = pixels[src + 3];
    }
  }

  const ihdr = Buffer.alloc(13);
  ihdr.writeUInt32BE(size, 0);
  ihdr.writeUInt32BE(size, 4);
  ihdr[8]  = 8; // bit depth
  ihdr[9]  = 6; // RGBA
  ihdr[10] = 0; ihdr[11] = 0; ihdr[12] = 0;

  const sig  = Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]);
  const idat = zlib.deflateSync(raw, { level: 9 });

  return Buffer.concat([
    sig,
    chunk("IHDR", ihdr),
    chunk("IDAT", idat),
    chunk("IEND", Buffer.alloc(0)),
  ]);
}

const outDir = path.join(__dirname, "icons");
if (!fs.existsSync(outDir)) fs.mkdirSync(outDir);

for (const size of [16, 48, 128]) {
  const png = buildPNG(size);
  fs.writeFileSync(path.join(outDir, `icon${size}.png`), png);
  console.log(`✓ icons/icon${size}.png`);
}
console.log("Done.");
