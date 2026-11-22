// Draws a static, etched night sky (swirling strokes, ringed stars, crescent moon) over a
// Hyderabad skyline with the Charminar and a lake reflection. Rendered once per resize.

type Vortex = { x: number; y: number; r: number; s: number }

function mulberry(seed: number) {
  return () => {
    seed |= 0
    seed = (seed + 0x6d2b79f5) | 0
    let t = Math.imul(seed ^ (seed >>> 15), 1 | seed)
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296
  }
}

function charminar(g: CanvasRenderingContext2D, cx: number, y0: number, u: number) {
  g.beginPath()
  // base block with the great central arch cut out (even-odd)
  g.rect(cx - 130 * u, y0 - 150 * u, 260 * u, 150 * u)
  g.moveTo(cx - 54 * u, y0)
  g.lineTo(cx - 54 * u, y0 - 78 * u)
  g.quadraticCurveTo(cx - 52 * u, y0 - 118 * u, cx, y0 - 130 * u)
  g.quadraticCurveTo(cx + 52 * u, y0 - 118 * u, cx + 54 * u, y0 - 78 * u)
  g.lineTo(cx + 54 * u, y0)
  g.closePath()
  // gallery with small arches
  g.rect(cx - 122 * u, y0 - 180 * u, 244 * u, 30 * u)
  for (let i = -2; i <= 2; i++) {
    const ax = cx + i * 42 * u
    g.moveTo(ax - 11 * u, y0 - 152 * u)
    g.lineTo(ax - 11 * u, y0 - 166 * u)
    g.quadraticCurveTo(ax, y0 - 176 * u, ax + 11 * u, y0 - 166 * u)
    g.lineTo(ax + 11 * u, y0 - 152 * u)
    g.closePath()
  }
  g.fill('evenodd')
  // parapet + merlons
  g.fillRect(cx - 128 * u, y0 - 188 * u, 256 * u, 9 * u)
  for (let x = -120; x <= 120; x += 12) {
    g.beginPath()
    g.moveTo(cx + (x - 4) * u, y0 - 188 * u)
    g.lineTo(cx + x * u, y0 - 196 * u)
    g.lineTo(cx + (x + 4) * u, y0 - 188 * u)
    g.fill()
  }
  // four minarets (two visible pairs read as one each side in silhouette)
  for (const sd of [-1, 1]) {
    const mx = cx + sd * 118 * u
    g.fillRect(mx - 15 * u, y0 - 250 * u, 30 * u, 250 * u)
    g.fillRect(mx - 22 * u, y0 - 202 * u, 44 * u, 8 * u)
    g.fillRect(mx - 21 * u, y0 - 254 * u, 42 * u, 8 * u)
    g.fillRect(mx - 12 * u, y0 - 300 * u, 24 * u, 48 * u)
    g.fillRect(mx - 18 * u, y0 - 304 * u, 36 * u, 6 * u)
    // onion dome + finial
    g.beginPath()
    g.moveTo(mx - 15 * u, y0 - 304 * u)
    g.bezierCurveTo(mx - 22 * u, y0 - 322 * u, mx - 6 * u, y0 - 330 * u, mx, y0 - 344 * u)
    g.bezierCurveTo(mx + 6 * u, y0 - 330 * u, mx + 22 * u, y0 - 322 * u, mx + 15 * u, y0 - 304 * u)
    g.fill()
    g.fillRect(mx - 1.2 * u, y0 - 360 * u, 2.4 * u, 18 * u)
  }
}

function dome(g: CanvasRenderingContext2D, x: number, y0: number, w: number, h: number) {
  g.fillRect(x - w / 2, y0 - h, w, h)
  g.beginPath()
  g.moveTo(x - w * 0.42, y0 - h)
  g.bezierCurveTo(x - w * 0.5, y0 - h - w * 0.5, x - w * 0.1, y0 - h - w * 0.55, x, y0 - h - w * 0.75)
  g.bezierCurveTo(x + w * 0.1, y0 - h - w * 0.55, x + w * 0.5, y0 - h - w * 0.5, x + w * 0.42, y0 - h)
  g.fill()
}

export function drawEtch(canvas: HTMLCanvasElement) {
  const dpr = Math.min(window.devicePixelRatio || 1, 1.6)
  const W = canvas.clientWidth
  const H = canvas.clientHeight
  if (!W || !H) return
  canvas.width = Math.round(W * dpr)
  canvas.height = Math.round(H * dpr)
  const g = canvas.getContext('2d')!
  g.setTransform(dpr, 0, 0, dpr, 0, 0)
  const rnd = mulberry(7)
  const horizon = H * 0.74

  g.fillStyle = '#09090b'
  g.fillRect(0, 0, W, H)

  // swirling sky
  const vortices: Vortex[] = [
    { x: W * 0.62, y: H * 0.28, r: H * 0.16, s: 1.4 },
    { x: W * 0.3, y: H * 0.22, r: H * 0.1, s: -1.1 },
    { x: W * 0.85, y: H * 0.5, r: H * 0.09, s: 1 },
    { x: W * 0.12, y: H * 0.48, r: H * 0.08, s: 1 },
    { x: W * 0.48, y: H * 0.55, r: H * 0.07, s: -0.9 },
  ]
  const field = (x: number, y: number) => {
    let vx = 1 + Math.sin(y * 0.011) * 0.35
    let vy = Math.sin(x * 0.006 + y * 0.004) * 0.45
    for (const v of vortices) {
      const dx = x - v.x
      const dy = y - v.y
      const d = Math.hypot(dx, dy) + 1e-3
      const f = Math.exp(-d / (v.r * 1.6)) * v.s * 2.4
      vx += (-dy / d) * f
      vy += (dx / d) * f
    }
    const l = Math.hypot(vx, vy) || 1
    return [vx / l, vy / l]
  }
  g.lineCap = 'round'
  const lines = Math.round((W * H) / 520)
  for (let i = 0; i < lines; i++) {
    let x = rnd() * W
    let y = rnd() * horizon * 1.02
    const steps = 18 + Math.floor(rnd() * 26)
    g.beginPath()
    g.moveTo(x, y)
    for (let s = 0; s < steps; s++) {
      const [dx, dy] = field(x, y)
      x += dx * 3.2
      y += dy * 3.2
      g.lineTo(x, y)
    }
    g.strokeStyle = `rgba(236,232,226,${(0.05 + rnd() * 0.16).toFixed(3)})`
    g.lineWidth = 0.6 + rnd() * 0.9
    g.stroke()
  }

  // ringed stars
  const stars = [
    [0.08, 0.14, 26], [0.22, 0.36, 18], [0.4, 0.12, 22], [0.53, 0.4, 14], [0.7, 0.1, 20],
    [0.78, 0.33, 16], [0.94, 0.2, 24], [0.34, 0.6, 12], [0.9, 0.62, 12], [0.16, 0.62, 10],
  ]
  for (const [sx, sy, sr] of stars) {
    const x = sx * W
    const y = sy * H
    const R = sr * (H / 900) * 2.2
    for (let r = 4; r < R; r += 3.1) {
      g.beginPath()
      g.arc(x, y, r, 0, Math.PI * 2)
      g.strokeStyle = `rgba(240,236,228,${(0.55 * (1 - r / R)).toFixed(3)})`
      g.lineWidth = 1
      g.stroke()
    }
    const grd = g.createRadialGradient(x, y, 0, x, y, R * 0.45)
    grd.addColorStop(0, 'rgba(255,250,240,0.95)')
    grd.addColorStop(1, 'rgba(255,250,240,0)')
    g.fillStyle = grd
    g.beginPath()
    g.arc(x, y, R * 0.45, 0, Math.PI * 2)
    g.fill()
  }

  // crescent moon
  {
    const x = W * 0.86
    const y = H * 0.16
    const r = H * 0.045
    for (let k = r; k < r * 3.2; k += 3.4) {
      g.beginPath()
      g.arc(x, y, k, 0, Math.PI * 2)
      g.strokeStyle = `rgba(255,214,150,${(0.35 * (1 - k / (r * 3.2))).toFixed(3)})`
      g.stroke()
    }
    g.fillStyle = '#ffe3b0'
    g.beginPath()
    g.arc(x, y, r, 0, Math.PI * 2)
    g.fill()
    g.fillStyle = '#09090b'
    g.beginPath()
    g.arc(x + r * 0.42, y - r * 0.18, r * 0.9, 0, Math.PI * 2)
    g.fill()
  }

  // lake below the horizon with broken reflections
  g.fillStyle = '#060607'
  g.fillRect(0, horizon, W, H - horizon)
  for (let i = 0; i < 900; i++) {
    const x = rnd() * W
    const y = horizon + 6 + Math.pow(rnd(), 1.6) * (H - horizon)
    const w = 6 + rnd() * 26
    g.strokeStyle = `rgba(236,232,226,${(0.03 + rnd() * 0.1).toFixed(3)})`
    g.lineWidth = 1
    g.beginPath()
    g.moveTo(x, y)
    g.lineTo(x + w, y)
    g.stroke()
  }

  // skyline
  g.fillStyle = '#040405'
  const u = (H / 900) * 0.95
  const cx = W * 0.2
  let x = -10
  while (x < W + 20) {
    const near = Math.abs(x - cx) < 170 * u
    const w = 24 + rnd() * 60
    const h = (near ? 18 : 28) + rnd() * (near ? 30 : 90)
    if (rnd() < 0.14) dome(g, x + w / 2, horizon, w * 0.8, h * 0.7)
    else g.fillRect(x, horizon - h, w, h)
    // a few warm windows
    if (!near && rnd() < 0.7) {
      g.fillStyle = 'rgba(255,168,88,0.55)'
      for (let k = 0; k < 4 + rnd() * 6; k++) g.fillRect(x + 4 + rnd() * (w - 8), horizon - h + 6 + rnd() * (h - 10), 2, 2)
      g.fillStyle = '#040405'
    }
    x += w + rnd() * 4
  }
  charminar(g, cx, horizon + 2, u)
  // tall towers on the right for rhythm
  g.fillRect(W * 0.9, horizon - 170 * u, 22 * u, 170 * u)
  g.fillRect(W * 0.935, horizon - 120 * u, 34 * u, 120 * u)
}
