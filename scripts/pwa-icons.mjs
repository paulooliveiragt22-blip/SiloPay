import { deflateSync } from "node:zlib";
import { mkdirSync, writeFileSync } from "node:fs";

const navy = [0x18, 0x30, 0x4f, 255];
const white = [0xf1, 0xf5, 0xf9, 255];

function crc32(buffer) {
  let crc = ~0;
  for (let i = 0; i < buffer.length; i += 1) {
    crc ^= buffer[i];
    for (let bit = 0; bit < 8; bit += 1) crc = (crc >>> 1) ^ (0xedb88320 & -(crc & 1));
  }
  return ~crc >>> 0;
}

function chunk(type, data) {
  const length = Buffer.alloc(4);
  length.writeUInt32BE(data.length);
  const name = Buffer.from(type);
  const crc = Buffer.alloc(4);
  crc.writeUInt32BE(crc32(Buffer.concat([name, data])));
  return Buffer.concat([length, name, data, crc]);
}

function png(size, paint) {
  const stride = size * 4 + 1;
  const raw = Buffer.alloc(stride * size);
  for (let y = 0; y < size; y += 1) {
    const row = y * stride;
    raw[row] = 0;
    for (let x = 0; x < size; x += 1) {
      const [r, g, b, a] = paint(x, y, size);
      const index = row + 1 + x * 4;
      raw[index] = r;
      raw[index + 1] = g;
      raw[index + 2] = b;
      raw[index + 3] = a;
    }
  }
  const ihdr = Buffer.alloc(13);
  ihdr.writeUInt32BE(size, 0);
  ihdr.writeUInt32BE(size, 4);
  ihdr[8] = 8;
  ihdr[9] = 6;
  return Buffer.concat([
    Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]),
    chunk("IHDR", ihdr),
    chunk("IDAT", deflateSync(raw)),
    chunk("IEND", Buffer.alloc(0)),
  ]);
}

function silo(x, y, size, inset) {
  const nx = x / (size - 1);
  const ny = y / (size - 1);
  const left = inset;
  const right = 1 - inset;
  const top = inset;
  const bottom = 1 - inset;
  if (nx < left || nx > right || ny < top || ny > bottom) return navy;
  const cx = 0.5;
  const body = nx >= 0.36 && nx <= 0.64 && ny >= 0.46 && ny <= 0.78;
  const dx = (nx - cx) / 0.14;
  const dy = (ny - 0.46) / 0.12;
  const dome = dx * dx + dy * dy <= 1 && ny <= 0.48;
  const door = nx >= 0.46 && nx <= 0.54 && ny >= 0.64 && ny <= 0.78;
  return (body || dome) && !door ? white : navy;
}

mkdirSync("public/icons", { recursive: true });
writeFileSync("public/icons/icon-192.png", png(192, (x, y, size) => silo(x, y, size, 0.16)));
writeFileSync("public/icons/icon-512.png", png(512, (x, y, size) => silo(x, y, size, 0.16)));
writeFileSync("public/icons/icon-maskable-512.png", png(512, (x, y, size) => silo(x, y, size, 0.28)));
writeFileSync("public/apple-touch-icon.png", png(180, (x, y, size) => silo(x, y, size, 0.16)));
