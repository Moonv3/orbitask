/**
 * Generates the PWA icons without any image dependency: a tiny PNG encoder
 * plus a stylised sun/orbit drawn per pixel. Run with `node scripts/generate-icons.mjs`.
 */
import fs from "node:fs";
import path from "node:path";
import zlib from "node:zlib";

const OUT_DIR = path.resolve("public/icons");

const crcTable = new Int32Array(256);
for (let n = 0; n < 256; n += 1) {
  let c = n;
  for (let k = 0; k < 8; k += 1) {
    c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1;
  }
  crcTable[n] = c;
}

function crc32(buffer) {
  let c = -1;
  for (const byte of buffer) c = crcTable[(c ^ byte) & 0xff] ^ (c >>> 8);
  return (c ^ -1) >>> 0;
}

function chunk(type, data) {
  const name = Buffer.from(type, "ascii");
  const length = Buffer.alloc(4);
  length.writeUInt32BE(data.length);
  const crc = Buffer.alloc(4);
  crc.writeUInt32BE(crc32(Buffer.concat([name, data])));
  return Buffer.concat([length, name, data, crc]);
}

const clamp01 = (value) => Math.min(1, Math.max(0, value));
const smooth = (a, b, x) => {
  const t = clamp01((x - a) / (b - a));
  return t * t * (3 - 2 * t);
};
const mix = (from, to, t) =>
  from.map((value, index) => value + (to[index] - value) * clamp01(t));

function pixel(px, py, size) {
  const x = (px + 0.5) / size;
  const y = (py + 0.5) / size;
  const dx = x - 0.5;
  const dy = y - 0.5;
  const fromCenter = Math.hypot(dx, dy);

  let color = [8, 13, 26];
  color = mix(color, [90, 48, 24], Math.exp(-(fromCenter * fromCenter) / 0.03) * 0.4);

  const rotation = (-24 * Math.PI) / 180;
  const ux = dx * Math.cos(rotation) + dy * Math.sin(rotation);
  const uy = -dx * Math.sin(rotation) + dy * Math.cos(rotation);
  const rx = 0.38;
  const ry = 0.16;
  const ellipse = Math.hypot(ux / rx, uy / ry);
  const ringDistance = Math.abs(ellipse - 1) * Math.min(rx, ry);
  const ring = 1 - smooth(0.006, 0.016, ringDistance);
  color = mix(color, [94, 234, 212], ring * 0.95);

  color = mix(
    color,
    [120, 70, 30],
    Math.exp(-(fromCenter * fromCenter) / 0.012) * 0.55,
  );
  const sunRadius = 0.14;
  const sun = 1 - smooth(sunRadius - 0.008, sunRadius + 0.008, fromCenter);
  const sunColor = mix([255, 215, 163], [255, 138, 61], fromCenter / sunRadius);
  color = mix(color, sunColor, sun);

  const planetDistance = Math.hypot(x - 0.78, y - 0.31);
  const planet = 1 - smooth(0.048, 0.058, planetDistance);
  color = mix(color, [122, 162, 255], planet);

  return color.map((value) => Math.round(clamp01(value / 255) * 255));
}

function writePng(size, filename) {
  const stride = size * 3 + 1;
  const raw = Buffer.alloc(stride * size);

  for (let y = 0; y < size; y += 1) {
    const row = y * stride;
    raw[row] = 0;
    for (let x = 0; x < size; x += 1) {
      const [r, g, b] = pixel(x, y, size);
      const offset = row + 1 + x * 3;
      raw[offset] = r;
      raw[offset + 1] = g;
      raw[offset + 2] = b;
    }
  }

  const header = Buffer.alloc(13);
  header.writeUInt32BE(size, 0);
  header.writeUInt32BE(size, 4);
  header[8] = 8; // bit depth
  header[9] = 2; // truecolour
  header[10] = 0;
  header[11] = 0;
  header[12] = 0;

  const png = Buffer.concat([
    Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]),
    chunk("IHDR", header),
    chunk("IDAT", zlib.deflateSync(raw, { level: 9 })),
    chunk("IEND", Buffer.alloc(0)),
  ]);

  fs.writeFileSync(path.join(OUT_DIR, filename), png);
  console.log(`${filename}: ${png.length} bytes`);
}

fs.mkdirSync(OUT_DIR, { recursive: true });
writePng(192, "icon-192.png");
writePng(512, "icon-512.png");
