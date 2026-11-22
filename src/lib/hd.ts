// Project screens are stored as a lossless WebP size ladder: public/work/hd/<name>-<width>.webp
// (designed at 1280×800 in mockups/*.html, captured at 2.5×, so UI text stays pixel-exact at every size).

const WIDTHS = [1200, 1600, 2000, 2600, 3200]

/**
 * URL of a file in public/, respecting Vite's base path. Locally that is "/", on GitHub Pages it
 * is "/my-portfolio/", so "/work/x.webp" becomes "/my-portfolio/work/x.webp".
 */
export const asset = (path: string) => import.meta.env.BASE_URL + path.replace(/^\//, '')

export const hdSrc = (base: string, w = 1600) => asset(`${base}-${w}.webp`)
export const hdSrcSet = (base: string) => WIDTHS.map((w) => `${asset(`${base}-${w}.webp`)} ${w}w`).join(', ')

/** Open the full-screen HD viewer from anywhere. */
export function openViewer(detail: { base: string; title: string; sub: string }) {
  window.dispatchEvent(new CustomEvent('viewer:open', { detail }))
}
