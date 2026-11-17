import { memo, useId } from 'react'

import type { SceneId } from '../data'

/*
  The illustrated background: granite cliffs and blue ridges in haze, a sunset
  glow in the gap, three depths of pine forest, a meadow and a shallow river
  with rocks and reflections. Pure SVG, generated once with a seeded random so
  it looks the same on every load. Four scenes share the geometry and swap
  palettes (plus stars and a moon at night, snowfall in winter). Swap it for a
  photo via BACKGROUND_PHOTO in `src/data.ts`.
*/

const W = 1600
const H = 1000

function rng(seed: number) {
  let s = seed >>> 0
  return () => {
    s = (s + 0x6d2b79f5) >>> 0
    let t = s
    t = Math.imul(t ^ (t >>> 15), t | 1)
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61)
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296
  }
}

/** A jagged conifer silhouette with its tip at (x, base - h). */
function pine(x: number, base: number, h: number, w: number, r: () => number): string {
  const top = base - h
  const tiers = 7 + Math.floor(r() * 5)
  const left: string[] = []
  const right: string[] = []
  for (let i = 1; i <= tiers; i++) {
    const t = i / tiers
    const y = top + h * t * 0.93
    const half = (w / 2) * Math.pow(t, 0.85) * (0.8 + r() * 0.35)
    const inner = half * (0.45 + r() * 0.15)
    const lift = (h / tiers) * 0.35
    left.push(`L${(x - half).toFixed(1)},${y.toFixed(1)} L${(x - inner).toFixed(1)},${(y - lift).toFixed(1)}`)
    right.unshift(`L${(x + inner).toFixed(1)},${(y - lift).toFixed(1)} L${(x + half).toFixed(1)},${y.toFixed(1)}`)
  }
  const trunk = Math.max(1.5, w * 0.05)
  return `M${x},${top} ${left.join(' ')} L${x - trunk},${base} L${x + trunk},${base} ${right.join(' ')} Z`
}

type Band = {
  seed: number
  count: number
  base: [number, number]
  height: [number, number]
  width: number
  fill: string
  /** Optional density boost near x ranges: [from, to, extra count, extra height]. */
  clusters?: [number, number, number, number][]
}

function forest({ seed, count, base, height, width, clusters = [] }: Band): string {
  const r = rng(seed)
  const paths: string[] = []
  const add = (x: number, hBoost = 0) => {
    const b = base[0] + r() * (base[1] - base[0])
    const h = height[0] + r() * (height[1] - height[0]) + hBoost * (0.6 + r() * 0.4)
    paths.push(pine(x, b, h, h * width * (0.75 + r() * 0.5), r))
  }
  for (let i = 0; i < count; i++) add((i / count) * (W + 80) - 40 + r() * 30)
  for (const [from, to, n, boost] of clusters) {
    for (let i = 0; i < n; i++) add(from + r() * (to - from), boost)
  }
  return paths.join(' ')
}

function blobs(seed: number, n: number, y: [number, number], rx: [number, number], xs: [number, number]) {
  const r = rng(seed)
  return Array.from({ length: n }, () => ({
    cx: xs[0] + r() * (xs[1] - xs[0]),
    cy: y[0] + r() * (y[1] - y[0]),
    rx: rx[0] + r() * (rx[1] - rx[0]),
    k: 0.45 + r() * 0.25,
    o: 0.75 + r() * 0.25,
  }))
}

const FAR = forest({
  seed: 7, count: 130, base: [640, 690], height: [40, 95], width: 0.34, fill: '',
  clusters: [[0, 260, 30, 50], [1250, 1600, 30, 60]],
})
const MID = forest({
  seed: 21, count: 70, base: [700, 760], height: [90, 190], width: 0.36, fill: '',
  clusters: [[0, 300, 16, 120], [1300, 1600, 18, 160], [620, 860, 10, 60]],
})
const NEAR = forest({
  seed: 42, count: 26, base: [790, 830], height: [140, 260], width: 0.4, fill: '',
  clusters: [[1380, 1600, 9, 300], [0, 180, 6, 220], [900, 1100, 5, 90]],
})
const ROCKS = blobs(5, 30, [868, 990], [4, 16], [120, 1600])
const RIPPLES = blobs(11, 110, [850, 995], [20, 120], [0, 1600])
const BUSHES = blobs(19, 40, [790, 830], [26, 70], [-40, 1640])

/** Rounded broadleaf crowns: a few overlapping circles on a short trunk. */
const BROADLEAF = (() => {
  const r = rng(91)
  const out: { cx: number; cy: number; rr: number }[] = []
  const spots = [560, 640, 720, 860, 960, 1040, 1180, 1260, 300, 420]
  for (const x0 of spots) {
    const base = 800 + r() * 20
    const size = 40 + r() * 50
    for (let i = 0; i < 7; i++) {
      out.push({
        cx: x0 + (r() - 0.5) * size * 1.4,
        cy: base - size * 0.6 - r() * size * 0.9,
        rr: size * (0.32 + r() * 0.25),
      })
    }
  }
  return out
})()

const GRASS = (() => {
  const r = rng(77)
  const out: string[] = []
  for (let i = 0; i < 90; i++) {
    const x = r() * 520 - 40
    const base = 1004
    const h = 60 + r() * 150 * (1 - x / 640)
    const lean = (r() - 0.35) * 70
    out.push(`M${x - 3},${base} Q${x + lean * 0.3},${base - h * 0.6} ${x + lean},${base - h} Q${x + lean * 0.2 + 2},${base - h * 0.5} ${x + 4},${base} Z`)
  }
  return out.join(' ')
})()

type Palette = {
  sky: [string, string, string, string, string]
  glow: [string, number]
  glowAt: [number, number]
  cliff: [string, string, string]
  streak: string
  ridge: [string, string]
  ridge2: [string, string]
  haze: string
  farBand: string
  far: [string, string]
  midBand: string
  mid: [string, string]
  meadow: [string, string]
  bush: string
  broad: string
  broadHi: string
  near: [string, string]
  nearBand: string
  river: [string, string, string]
  reflect: [string, number]
  ripple: string
  rocks: [string, string, string]
  grass: [string, string]
  veil: [string, number]
}

export const PALETTES: Record<SceneId, Palette> = {
  dusk: {
    sky: ['#a6cbdc', '#c4d9e0', '#ecd2c3', '#f6b79a', '#f2a585'],
    glow: ['#ff9f7a', 0.95],
    glowAt: [790, 610],
    cliff: ['#6f9db3', '#82acbf', '#a9c4cc'],
    streak: '#dbe9ee',
    ridge: ['#6c9fb9', '#93b9c8'],
    ridge2: ['#4f88a3', '#7eabbd'],
    haze: '#d6e5ea',
    farBand: '#6aa2b1',
    far: ['#5b98aa', '#7fb0bd'],
    midBand: '#3f7f8c',
    mid: ['#2f7387', '#4a8b8f'],
    meadow: ['#3f6a52', '#5c8455'],
    bush: '#355e45',
    broad: '#2f5d4c',
    broadHi: '#4b7a5a',
    near: ['#1f5563', '#2d5b4c'],
    nearBand: '#4e7a4b',
    river: ['#8fa8b1', '#7f9aa6', '#5b7a87'],
    reflect: ['#f2a588', 0.95],
    ripple: '#ffffff',
    rocks: ['#4a5a60', '#36444a', '#7d8f95'],
    grass: ['#3f7d3e', '#69a352'],
    veil: ['#0b1d24', 0.18],
  },
  day: {
    sky: ['#4f9fd6', '#7db9e2', '#b3d8ee', '#d6ebf4', '#e6f3f3'],
    glow: ['#fff4cc', 0.7],
    glowAt: [1120, 300],
    cliff: ['#7ea6ba', '#94b8c7', '#bcd2da'],
    streak: '#f0f7fa',
    ridge: ['#76abc9', '#9cc6d9'],
    ridge2: ['#5996b6', '#86b8cd'],
    haze: '#e6f2f6',
    farBand: '#6aa7a6',
    far: ['#5a9d97', '#80b6ab'],
    midBand: '#3d8672',
    mid: ['#2c7a66', '#4a956d'],
    meadow: ['#4f8d4b', '#72a85a'],
    bush: '#3e7747',
    broad: '#356f46',
    broadHi: '#62a060',
    near: ['#1d5c4c', '#2d6c42'],
    nearBand: '#5d904c',
    river: ['#a3cfde', '#83b6c9', '#5a90a8'],
    reflect: ['#ffffff', 0.55],
    ripple: '#ffffff',
    rocks: ['#56656c', '#3e4c52', '#9aabb0'],
    grass: ['#4c903e', '#82c15c'],
    veil: ['#0b1d24', 0.12],
  },
  night: {
    sky: ['#0b1430', '#15244a', '#1f3260', '#293e6a', '#31456e'],
    glow: ['#b9c8ff', 0.35],
    glowAt: [1380, 170],
    cliff: ['#273855', '#2d4061', '#384b6c'],
    streak: '#6f86b0',
    ridge: ['#24365a', '#30446b'],
    ridge2: ['#1c2d4e', '#283b60'],
    haze: '#3b5180',
    farBand: '#1d3150',
    far: ['#1a2e48', '#243858'],
    midBand: '#152940',
    mid: ['#12243a', '#1a2f45'],
    meadow: ['#14263a', '#1b3145'],
    bush: '#102132',
    broad: '#0f1f2e',
    broadHi: '#21374c',
    near: ['#0a1828', '#112233'],
    nearBand: '#17283a',
    river: ['#283b5e', '#203358', '#14223c'],
    reflect: ['#c9d5ff', 0.55],
    ripple: '#c9d5ff',
    rocks: ['#1b2634', '#131c27', '#3b4b61'],
    grass: ['#163225', '#23473a'],
    veil: ['#000000', 0.22],
  },
  snow: {
    sky: ['#8aa4b8', '#a6bccb', '#c9d7e0', '#e1e9ee', '#edf2f5'],
    glow: ['#ffffff', 0.55],
    glowAt: [790, 560],
    cliff: ['#9cb1c0', '#b3c5d1', '#d5e0e7'],
    streak: '#ffffff',
    ridge: ['#a7bdcd', '#c6d5df'],
    ridge2: ['#8ea8bb', '#b0c4d1'],
    haze: '#eef3f6',
    farBand: '#cbd8e0',
    far: ['#c9d7df', '#86a0ae'],
    midBand: '#e0e8ed',
    mid: ['#dde7ed', '#6c8796'],
    meadow: ['#eaf0f4', '#f5f8fa'],
    bush: '#d4e0e7',
    broad: '#c3d1da',
    broadHi: '#ffffff',
    near: ['#d2dee6', '#4a6371'],
    nearBand: '#e4ecf0',
    river: ['#a8bccb', '#93aabb', '#7490a5'],
    reflect: ['#ffffff', 0.6],
    ripple: '#ffffff',
    rocks: ['#5b6b75', '#47555e', '#ffffff'],
    grass: ['#aab99c', '#e6eceb'],
    veil: ['#0b1d24', 0.14],
  },
}

const STARS = blobs(303, 90, [10, 520], [0.6, 1.8], [0, 1600])
const FLAKES = blobs(404, 120, [-40, 1000], [1.2, 3.4], [0, 1640])

export const Landscape = memo(function Landscape({ scene = 'dusk', className = '' }: { scene?: SceneId; className?: string }) {
  const p = PALETTES[scene]
  const u = useId().replace(/:/g, '')
  const id = (n: string) => `${u}-${n}`
  const url = (n: string) => `url(#${id(n)})`
  return (
    <svg aria-hidden viewBox={`0 0 ${W} ${H}`} preserveAspectRatio="xMidYMid slice" className={className}>
      <defs>
        <linearGradient id={id('sky')} x1="0" y1="0" x2="0" y2="1">
          {[0, 0.32, 0.52, 0.66, 1].map((o, i) => (
            <stop key={o} offset={o} stopColor={p.sky[i]} />
          ))}
        </linearGradient>
        <radialGradient id={id('sun')} cx="0.5" cy="0.5" r="0.5">
          <stop offset="0" stopColor={p.glow[0]} stopOpacity={p.glow[1]} />
          <stop offset="0.45" stopColor={p.glow[0]} stopOpacity={p.glow[1] * 0.6} />
          <stop offset="1" stopColor={p.glow[0]} stopOpacity="0" />
        </radialGradient>
        <linearGradient id={id('cliff')} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor={p.cliff[0]} />
          <stop offset="0.55" stopColor={p.cliff[1]} />
          <stop offset="1" stopColor={p.cliff[2]} />
        </linearGradient>
        <linearGradient id={id('ridge')} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor={p.ridge[0]} />
          <stop offset="1" stopColor={p.ridge[1]} />
        </linearGradient>
        <linearGradient id={id('ridge2')} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor={p.ridge2[0]} />
          <stop offset="1" stopColor={p.ridge2[1]} />
        </linearGradient>
        <linearGradient id={id('haze')} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor={p.haze} stopOpacity="0" />
          <stop offset="0.5" stopColor={p.haze} stopOpacity="0.55" />
          <stop offset="1" stopColor={p.haze} stopOpacity="0" />
        </linearGradient>
        <linearGradient id={id('far')} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor={p.far[0]} />
          <stop offset="1" stopColor={p.far[1]} />
        </linearGradient>
        <linearGradient id={id('mid')} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor={p.mid[0]} />
          <stop offset="1" stopColor={p.mid[1]} />
        </linearGradient>
        <linearGradient id={id('near')} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor={p.near[0]} />
          <stop offset="1" stopColor={p.near[1]} />
        </linearGradient>
        <linearGradient id={id('meadow')} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor={p.meadow[0]} />
          <stop offset="1" stopColor={p.meadow[1]} />
        </linearGradient>
        <linearGradient id={id('river')} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor={p.river[0]} />
          <stop offset="0.35" stopColor={p.river[1]} />
          <stop offset="1" stopColor={p.river[2]} />
        </linearGradient>
        <radialGradient id={id('reflect')} cx="0.5" cy="0.3" r="0.6">
          <stop offset="0" stopColor={p.reflect[0]} stopOpacity={p.reflect[1]} />
          <stop offset="0.6" stopColor={p.reflect[0]} stopOpacity={p.reflect[1] * 0.42} />
          <stop offset="1" stopColor={p.reflect[0]} stopOpacity="0" />
        </radialGradient>
        <linearGradient id={id('veil')} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#ffffff" stopOpacity="0.1" />
          <stop offset="0.6" stopColor="#ffffff" stopOpacity="0" />
          <stop offset="1" stopColor={p.veil[0]} stopOpacity={p.veil[1]} />
        </linearGradient>
        <clipPath id={id('water')}>
          <path d="M-20,846 C300,838 700,850 1000,842 C1250,836 1450,846 1620,840 L1620,1010 L-20,1010 Z" />
        </clipPath>
        <filter id={id('soft')} x="-5%" y="-5%" width="110%" height="110%">
          <feGaussianBlur stdDeviation="1.4" />
        </filter>
        <filter id={id('blur')} x="-20%" y="-20%" width="140%" height="140%">
          <feGaussianBlur stdDeviation="18" />
        </filter>
      </defs>

      <rect width={W} height={H} fill={url('sky')} />
      {scene === 'night' && (
        <g fill="#ffffff">
          {STARS.map((s, i) => (
            <circle
              key={i}
              cx={s.cx}
              cy={s.cy}
              r={s.rx}
              opacity={s.o * 0.9}
              className={i % 4 === 0 ? 'animate-twinkle' : undefined}
              style={i % 4 === 0 ? { animationDelay: `${(i % 7) * 0.6}s` } : undefined}
            />
          ))}
        </g>
      )}
      <ellipse cx={p.glowAt[0]} cy={p.glowAt[1]} rx="420" ry="260" fill={url('sun')} className="animate-glow" />
      {scene === 'night' && (
        <g>
          <circle cx="1380" cy="170" r="30" fill="#f4f1e4" />
          <circle cx="1369" cy="162" r="6.5" fill="#e2ddc8" opacity="0.7" />
          <circle cx="1390" cy="182" r="4" fill="#e2ddc8" opacity="0.6" />
        </g>
      )}
      {/* distant right range */}
      <path
        d="M760,700 L860,600 L930,520 L990,470 L1060,430 L1120,395 L1185,330 L1240,300 L1300,318 L1350,300 L1410,320 L1470,280 L1540,250 L1600,238 L1600,720 Z"
        fill={url('ridge')}
        opacity="0.9"
      />
      <path
        d="M1000,720 L1080,560 L1140,500 L1200,470 L1270,420 L1330,445 L1400,410 L1470,380 L1530,400 L1600,370 L1600,740 Z"
        fill={url('ridge2')}
        opacity="0.75"
      />
      {scene === 'snow' && (
        <g fill="#ffffff" opacity="0.92">
          <path d="M1185,330 L1240,300 L1300,318 L1350,300 L1410,320 L1470,280 L1540,250 L1600,238 L1600,300 L1560,296 L1530,318 L1480,312 L1440,340 L1400,334 L1350,350 L1300,342 L1250,356 L1210,350 Z" />
          <path d="M1270,420 L1330,445 L1400,410 L1470,380 L1530,400 L1600,370 L1600,410 L1540,428 L1480,418 L1420,440 L1350,466 L1300,452 Z" opacity="0.8" />
        </g>
      )}
      {/* granite cliff, left */}
      <path
        d="M-20,330 L40,300 C120,262 210,248 300,252 C360,256 410,270 450,300 C480,330 500,380 520,440 C545,510 585,580 640,640 L700,720 L-20,720 Z"
        fill={url('cliff')}
      />
      {scene === 'snow' && (
        <path
          d="M-20,330 L40,300 C120,262 210,248 300,252 C360,256 410,270 450,300 C470,320 482,346 490,372 C450,350 420,362 380,344 C330,322 290,340 240,326 C190,312 150,334 100,326 C60,320 20,346 -20,350 Z"
          fill="#ffffff"
          opacity="0.9"
        />
      )}
      <g opacity="0.12" fill={p.streak} filter={url('soft')}>
        <path d="M150,260 C160,330 150,420 170,520 L182,520 C168,420 176,330 166,258 Z" />
        <path d="M260,252 C268,330 262,430 280,560 L292,560 C276,430 282,330 276,252 Z" />
        <path d="M360,262 C372,330 368,420 392,560 L402,560 C380,420 386,330 376,266 Z" />
        <path d="M70,290 C76,360 70,430 86,520 L96,520 C82,430 90,360 84,290 Z" />
      </g>

      {/* haze between ridges and forest */}
      <rect x="0" y="520" width={W} height="220" fill={url('haze')} className="animate-drift" />
      <path d="M-20,690 C300,672 600,690 900,676 C1200,664 1450,680 1620,672 L1620,800 L-20,800 Z" fill={p.farBand} />
      <path d={FAR} fill={url('far')} opacity="0.9" />
      <rect x="0" y="640" width={W} height="120" fill={url('haze')} opacity="0.7" />
      <path d="M-20,752 C300,740 700,756 1000,744 C1300,734 1500,748 1620,742 L1620,820 L-20,820 Z" fill={p.midBand} />
      <path d={MID} fill={url('mid')} opacity="0.95" />
      <rect x="0" y="720" width={W} height="80" fill={url('haze')} opacity="0.35" />

      {/* meadow and bushes */}
      <path d="M-20,790 C300,770 700,795 1000,780 C1250,770 1450,790 1620,780 L1620,870 L-20,870 Z" fill={url('meadow')} />
      <g fill={p.bush}>
        {BUSHES.map((b, i) => (
          <ellipse key={i} cx={b.cx} cy={b.cy} rx={b.rx} ry={b.rx * b.k} opacity={b.o} />
        ))}
      </g>
      <g fill={p.broad}>
        {BROADLEAF.map((b, i) => (
          <circle key={i} cx={b.cx} cy={b.cy} r={b.rr} opacity={0.85 + (i % 3) * 0.05} />
        ))}
      </g>
      <g fill={p.broadHi} opacity="0.35">
        {BROADLEAF.filter((_, i) => i % 2 === 0).map((b, i) => (
          <circle key={i} cx={b.cx - b.rr * 0.25} cy={b.cy - b.rr * 0.3} r={b.rr * 0.55} />
        ))}
      </g>
      <path d={NEAR} fill={url('near')} />
      <path d="M-20,820 C400,810 800,826 1200,812 C1400,806 1520,816 1620,812 L1620,860 L-20,860 Z" fill={p.nearBand} opacity="0.9" />

      {/* river */}
      <path d="M-20,846 C300,838 700,850 1000,842 C1250,836 1450,846 1620,840 L1620,1010 L-20,1010 Z" fill={url('river')} />
      <g clipPath={url('water')}>
        <ellipse cx={p.glowAt[0] - 30} cy="905" rx="460" ry="130" fill={url('reflect')} filter={url('blur')} />
        <ellipse cx={p.glowAt[0] - 10} cy="880" rx="240" ry="40" fill={p.reflect[0]} opacity={p.reflect[1] * 0.47} filter={url('blur')} />
      </g>
      <g fill={p.ripple} className="animate-shimmer">
        {RIPPLES.map((r, i) => (
          <ellipse key={i} cx={r.cx} cy={r.cy} rx={r.rx} ry={1.1} opacity={0.18 + (i % 4) * 0.06} />
        ))}
      </g>
      <g>
        {ROCKS.map((r, i) => (
          <g key={i}>
            <ellipse cx={r.cx} cy={r.cy + r.rx * 0.35} rx={r.rx * 1.25} ry={2} fill={p.ripple} opacity="0.25" />
            <ellipse cx={r.cx} cy={r.cy} rx={r.rx} ry={r.rx * r.k} fill={i % 3 ? p.rocks[0] : p.rocks[1]} />
            <ellipse cx={r.cx - r.rx * 0.25} cy={r.cy - r.rx * r.k * 0.4} rx={r.rx * 0.45} ry={r.rx * r.k * 0.3} fill={p.rocks[2]} opacity="0.45" />
          </g>
        ))}
      </g>
      <ellipse cx="1180" cy="992" rx="56" ry="30" fill={p.rocks[1]} />
      <ellipse cx="1166" cy="978" rx="24" ry="9" fill={p.rocks[2]} opacity="0.45" />

      {/* foreground grass */}
      <path d={GRASS} fill={p.grass[0]} />
      <path d={GRASS} fill={p.grass[1]} opacity="0.5" transform="translate(18 6)" />
      {scene === 'snow' && (
        <g fill="#ffffff">
          <g className="animate-snow">
            {FLAKES.map((f, i) => (
              <circle key={i} cx={f.cx} cy={f.cy} r={f.rx} opacity={0.55 + (i % 3) * 0.15} />
            ))}
          </g>
          <g className="animate-snow" style={{ animationDuration: '22s', animationDelay: '-9s' }}>
            {FLAKES.filter((_, i) => i % 2).map((f, i) => (
              <circle key={i} cx={f.cx + 30} cy={f.cy - 500} r={f.rx * 0.6} opacity={0.5} />
            ))}
          </g>
        </g>
      )}
      <rect width={W} height={H} fill={url('veil')} />
    </svg>
  )
})
