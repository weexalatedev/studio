// Generates the PWA icons (no image dependencies): a rounded gradient tile
// with a white four-point spark, matching the sidebar mark.
// Run with `node scripts/make-icons.mjs`.
import { mkdirSync, writeFileSync } from 'node:fs'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'
import { deflateSync } from 'node:zlib'

const OUT = join(dirname(fileURLToPath(import.meta.url)), '..', 'public', 'icons')

const CRC_TABLE = (() => {
  const table = new Int32Array(256)
  for (let n = 0; n < 256; n++) {
    let c = n
    for (let k = 0; k < 8; k++) c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1
    table[n] = c
  }
  return table
})()

function crc32(buf) {
  let c = 0xffffffff
  for (const byte of buf) c = CRC_TABLE[(c ^ byte) & 0xff] ^ (c >>> 8)
  return (c ^ 0xffffffff) >>> 0
}

function chunk(type, data) {
  const length = Buffer.alloc(4)
  length.writeUInt32BE(data.length)
  const body = Buffer.concat([Buffer.from(type, 'ascii'), data])
  const crc = Buffer.alloc(4)
  crc.writeUInt32BE(crc32(body))
  return Buffer.concat([length, body, crc])
}

function encodePng(size, rgba) {
  const ihdr = Buffer.alloc(13)
  ihdr.writeUInt32BE(size, 0)
  ihdr.writeUInt32BE(size, 4)
  ihdr[8] = 8 // bit depth
  ihdr[9] = 6 // RGBA
  const raw = Buffer.alloc((size * 4 + 1) * size)
  for (let y = 0; y < size; y++) {
    const rowStart = y * (size * 4 + 1)
    raw[rowStart] = 0 // filter: none
    rgba.copy(raw, rowStart + 1, y * size * 4, (y + 1) * size * 4)
  }
  return Buffer.concat([
    Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]),
    chunk('IHDR', ihdr),
    chunk('IDAT', deflateSync(raw, { level: 9 })),
    chunk('IEND', Buffer.alloc(0)),
  ])
}

const lerp = (a, b, t) => a + (b - a) * t
const mix = (c1, c2, t) => [lerp(c1[0], c2[0], t), lerp(c1[1], c2[1], t), lerp(c1[2], c2[2], t)]

// Four-point spark: sqrt(|x|/r) + sqrt(|y|/r) <= 1
function spark(x, y, r) {
  return Math.sqrt(Math.abs(x) / r) + Math.sqrt(Math.abs(y) / r) <= 1
}

function roundedCoverage(x, y, size, radius) {
  const rx = Math.min(x, size - 1 - x)
  const ry = Math.min(y, size - 1 - y)
  if (rx >= radius || ry >= radius) return 1
  const dx = radius - rx
  const dy = radius - ry
  return Math.hypot(dx, dy) <= radius ? 1 : 0
}

function draw(size, { maskable = false } = {}) {
  const top = [74, 163, 255]
  const bottom = [31, 124, 246]
  const rgba = Buffer.alloc(size * size * 4)
  const radius = maskable ? 0 : size * 0.23
  const starR = maskable ? size * 0.26 : size * 0.3
  const center = (size - 1) / 2
  const samples = 3

  for (let y = 0; y < size; y++) {
    for (let x = 0; x < size; x++) {
      let cover = 0
      let star = 0
      for (let sy = 0; sy < samples; sy++) {
        for (let sx = 0; sx < samples; sx++) {
          const px = x + (sx + 0.5) / samples
          const py = y + (sy + 0.5) / samples
          cover += roundedCoverage(px, py, size, radius)
          if (spark(px - center, py - center, starR)) star += 1
        }
      }
      const n = samples * samples
      cover /= n
      star /= n
      const base = mix(top, bottom, y / (size - 1))
      const color = mix(base, [255, 255, 255], star)
      const i = (y * size + x) * 4
      rgba[i] = Math.round(color[0])
      rgba[i + 1] = Math.round(color[1])
      rgba[i + 2] = Math.round(color[2])
      rgba[i + 3] = Math.round(255 * cover)
    }
  }
  return encodePng(size, rgba)
}

mkdirSync(OUT, { recursive: true })
const files = [
  ['icon-192.png', draw(192)],
  ['icon-512.png', draw(512)],
  ['maskable-512.png', draw(512, { maskable: true })],
  ['apple-touch-icon.png', draw(180, { maskable: true })],
]
for (const [name, buffer] of files) {
  writeFileSync(join(OUT, name), buffer)
  console.log(`wrote public/icons/${name} (${buffer.length} bytes)`)
}
