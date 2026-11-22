// Project screens are stored as a lossless WebP size ladder: /work/hd/<name>-<width>.webp
// (captured at 2× from mockups/*.html, so UI text stays pixel-exact at every size).

const WIDTHS = [1200, 1600, 2000, 2600, 3200]

export const hdSrc = (base: string, w = 1600) => `${base}-${w}.webp`
export const hdSrcSet = (base: string) => WIDTHS.map((w) => `${base}-${w}.webp ${w}w`).join(', ')

/** Open the full-screen HD viewer from anywhere. */
export function openViewer(detail: { base: string; title: string; sub: string }) {
  window.dispatchEvent(new CustomEvent('viewer:open', { detail }))
}
