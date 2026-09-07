/*
  PWA 아이콘(PNG)을 만든다. `npm run icons`로 실행한다.

  외부 라이브러리를 쓰지 않는다. Node 내장 zlib만으로 PNG를 직접 인코딩한다.
  아이콘을 손볼 일은 1년에 한 번도 없는데 그걸 위해 이미지 라이브러리를 의존성에
  추가하고 싶지 않았다. 결과 PNG는 public/에 커밋되므로 이 스크립트는 빌드에 끼지 않는다.

  모양: 어두운 배경 위에 마티니 잔 실루엣.
*/
import { deflateSync } from 'node:zlib'
import { writeFileSync, mkdirSync } from 'node:fs'
import { fileURLToPath } from 'node:url'

const OUT_DIR = fileURLToPath(new URL('../public/', import.meta.url))

const BG: RGB = [0x0b, 0x0b, 0x0f] // --color-ink
const FG: RGB = [0xe8, 0xb4, 0x5c] // --color-accent

type RGB = [number, number, number]

// --- PNG 인코딩 ---

const CRC_TABLE = (() => {
  const table = new Uint32Array(256)
  for (let n = 0; n < 256; n++) {
    let c = n
    for (let k = 0; k < 8; k++) c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1
    table[n] = c >>> 0
  }
  return table
})()

function crc32(buf: Uint8Array): number {
  let c = 0xffffffff
  for (const byte of buf) c = CRC_TABLE[(c ^ byte) & 0xff]! ^ (c >>> 8)
  return (c ^ 0xffffffff) >>> 0
}

function chunk(type: string, data: Uint8Array): Uint8Array {
  const typeBytes = new TextEncoder().encode(type)
  const body = new Uint8Array(typeBytes.length + data.length)
  body.set(typeBytes, 0)
  body.set(data, typeBytes.length)

  const out = new Uint8Array(8 + data.length + 4)
  const view = new DataView(out.buffer)
  view.setUint32(0, data.length)
  out.set(body, 4)
  view.setUint32(4 + body.length, crc32(body))
  return out
}

/** RGB 픽셀 배열(size*size*3)을 PNG 바이트로 만든다. */
function encodePng(size: number, rgb: Uint8Array): Uint8Array {
  // 각 스캔라인 앞에 필터 바이트 0(None)을 붙인다.
  const raw = new Uint8Array(size * (size * 3 + 1))
  for (let y = 0; y < size; y++) {
    const rowStart = y * (size * 3 + 1)
    raw[rowStart] = 0
    raw.set(rgb.subarray(y * size * 3, (y + 1) * size * 3), rowStart + 1)
  }

  const ihdr = new Uint8Array(13)
  const ihdrView = new DataView(ihdr.buffer)
  ihdrView.setUint32(0, size)
  ihdrView.setUint32(4, size)
  ihdr[8] = 8 // bit depth
  ihdr[9] = 2 // color type 2 = truecolor RGB
  ihdr[10] = 0 // compression
  ihdr[11] = 0 // filter
  ihdr[12] = 0 // interlace

  const parts = [
    new Uint8Array([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]),
    chunk('IHDR', ihdr),
    chunk('IDAT', new Uint8Array(deflateSync(raw, { level: 9 }))),
    chunk('IEND', new Uint8Array(0)),
  ]

  const total = parts.reduce((sum, part) => sum + part.length, 0)
  const png = new Uint8Array(total)
  let offset = 0
  for (const part of parts) {
    png.set(part, offset)
    offset += part.length
  }
  return png
}

// --- 도형 ---

/** 정규화 좌표(0~1)에서 마티니 잔 안쪽이면 true. */
function inGlass(x: number, y: number): boolean {
  // 잔 몸통: 역삼각형
  if (pointInTriangle(x, y, 0.17, 0.27, 0.83, 0.27, 0.5, 0.63)) return true
  // 잔 테두리 가로선
  if (x >= 0.15 && x <= 0.85 && y >= 0.235 && y <= 0.275) return true
  // 기둥
  if (x >= 0.468 && x <= 0.532 && y >= 0.6 && y <= 0.8) return true
  // 받침
  if (x >= 0.29 && x <= 0.71 && y >= 0.8 && y <= 0.855) return true
  return false
}

function pointInTriangle(
  px: number,
  py: number,
  ax: number,
  ay: number,
  bx: number,
  by: number,
  cx: number,
  cy: number,
): boolean {
  const d1 = (px - bx) * (ay - by) - (ax - bx) * (py - by)
  const d2 = (px - cx) * (by - cy) - (bx - cx) * (py - cy)
  const d3 = (px - ax) * (cy - ay) - (cx - ax) * (py - ay)
  const hasNeg = d1 < 0 || d2 < 0 || d3 < 0
  const hasPos = d1 > 0 || d2 > 0 || d3 > 0
  return !(hasNeg && hasPos)
}

/**
 * @param scale 아이콘 안에서 그림이 차지하는 비율. maskable은 모서리가 잘리므로 작게 그린다.
 */
function renderIcon(size: number, scale: number): Uint8Array {
  const rgb = new Uint8Array(size * size * 3)
  const SAMPLES = 3 // 픽셀당 3x3 서브샘플링으로 계단현상을 줄인다

  for (let y = 0; y < size; y++) {
    for (let x = 0; x < size; x++) {
      let hits = 0
      for (let sy = 0; sy < SAMPLES; sy++) {
        for (let sx = 0; sx < SAMPLES; sx++) {
          const nx = (x + (sx + 0.5) / SAMPLES) / size
          const ny = (y + (sy + 0.5) / SAMPLES) / size
          // 그림을 중앙 기준으로 scale만큼 축소한 좌표계로 옮긴다
          const gx = (nx - 0.5) / scale + 0.5
          const gy = (ny - 0.5) / scale + 0.5
          if (gx >= 0 && gx <= 1 && gy >= 0 && gy <= 1 && inGlass(gx, gy)) hits++
        }
      }
      const alpha = hits / (SAMPLES * SAMPLES)
      const offset = (y * size + x) * 3
      for (let c = 0; c < 3; c++) {
        rgb[offset + c] = Math.round(BG[c]! * (1 - alpha) + FG[c]! * alpha)
      }
    }
  }
  return rgb
}

// --- 실행 ---

mkdirSync(OUT_DIR, { recursive: true })

const targets = [
  { file: 'pwa-192.png', size: 192, scale: 0.86 },
  { file: 'pwa-512.png', size: 512, scale: 0.86 },
  // maskable: 원/둥근 사각형으로 잘려도 살아남도록 안전 영역(가운데 80%) 안에 그린다
  { file: 'pwa-maskable-512.png', size: 512, scale: 0.62 },
  // iOS 홈 화면 아이콘. 모서리를 둥글게 깎으므로 여유를 둔다
  { file: 'apple-touch-icon.png', size: 180, scale: 0.74 },
]

for (const target of targets) {
  const png = encodePng(target.size, renderIcon(target.size, target.scale))
  writeFileSync(new URL(target.file, `file://${OUT_DIR.replace(/\\/g, '/')}`), png)
  console.log(`${target.file}  ${target.size}x${target.size}  ${(png.length / 1024).toFixed(1)}KB`)
}

console.log('\n아이콘 생성 완료. public/ 에 저장했습니다.')
