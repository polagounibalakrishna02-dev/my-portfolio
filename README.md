# Polagouni Balakrishna — Portfolio (v2 · "Built by agents")

A 3D, motion-driven portfolio: **React 19 + Vite + TypeScript**, **three.js / React Three Fiber**, **GSAP (ScrollTrigger + SplitText)** and **Lenis**.
The design rationale and the review of v1 are in [DESIGN-REVIEW.md](DESIGN-REVIEW.md).

## Run it

```powershell
npm install
npm run dev        # http://localhost:5173
npm run build      # production build in dist/
npm run preview    # serve the production build
```

## The idea

Bala builds AI agents, so **his agents build the page**. Six agent cursors (Planner, Layout, Typeset, Retriever,
Evaluator, Guardrail) fly to each component as it scrolls into view, drag out a measured wireframe, then type / place /
render it. The wireframes exist only while a section is being built.

Mark anything as buildable with `data-build="Name"` (optional `data-build-kind="text|block|media"`). Engine: `src/lib/build.ts`.

## Sections

| Section | Signature |
| --- | --- |
| Loader | A dot drops under a spotlight, the "I" falls on it to make "!", BALAKRISHNA. tumbles in (the dot becomes the full stop), then scrambles into AI ENGINEER and flies into the hero |
| Hero | Bala's photo as a particle portrait: static noise assembles into him, an orange rim light traces the lit edge, a warm back light glows behind; hovering opens a lens onto the colour-graded photo; on scroll he disperses again |
| About | Glass card with oversized "ABOUT ME" over an etched night sky and Charminar skyline; expands to full screen as the words split |
| Experience | Pinned stages with chromatic smear transitions and drifting ghost type |
| Work | HD product screens on a concave 3D arc with clear gaps between cards, the word PROJECTS set huge behind it. The card is sized from the viewport height so the UI reads close to 1:1; one short scroll moves one project, and the centre card is a plain, untransformed image |
| Case studies | One pinned stage, two snap stops per project: (1) agents build the copy next to the screen, (2) the screen grows to fill the viewport (a real left/top/width resize, not a CSS scale, so it stays pixel-sharp). The next scroll slides the next project up over it |
| How I build | A pinned "agent loop" with an interactive 3D robot inside the ring: scrolling draws the ring and the robot's head follows the pulse; eyes/chest change colour per step and it nods; hover = it watches the cursor, click = a hop |
| Contact | Glowing cube mascot whose eyes follow you (click it) |
| Footer | Scroll-reactive marquee, live IST clock, magnetic back-to-top, wordmark that waves under the cursor |

## Edit content

- Copy, projects, skills, agents: [`src/data.ts`](src/data.ts)
- Portrait: `public/portrait/bala-v3.png` (background-removed, black & white — brighter pixels become denser particles)
  and `public/portrait/bala-v3-color.webp` (same framing in colour, shown inside the hover lens). Give replacements a
  new file name so browsers don't show a cached copy.
- Project screenshots: `public/work/hd/<name>-v2-<width>.webp` — lossless, widths 1200 / 1600 / 2000 / 2600 / 3200, made from
  a 2.5× Chrome capture of `mockups/<name>.html` (designed at 1280×800, captured at 3200×2000). Designing at 1280 rather
  than 1600 keeps the UI large relative to the frame, so it reads without zooming. The browser picks the closest size via
  `srcset`. To re-capture one:

```powershell
& "C:\Program Files\Google\Chrome\Application\chrome.exe" --headless=new --hide-scrollbars --force-device-scale-factor=2.5 --window-size=1280,800 --screenshot="$PWD\coach.png" "file:///$($PWD -replace '\\','/')/mockups/coach.html"
```

  When you replace a screenshot, give it a new suffix (`-v3`) and update `image` in `src/data.ts`, so browsers don't show a cached copy.

Real screenshots of the products can replace these files one-for-one.

## Performance & accessibility

- Every WebGL scene is lazy-loaded, pauses when off-screen and is wrapped in an error boundary.
- `prefers-reduced-motion`: no smooth scroll, no agents, content appears immediately.
- Touch devices: native scrolling, no custom cursor, no agent cursors (wireframe reveals only).

## Deploy

Static site — `npm run build`, then upload `dist/` to Vercel, Netlify, Cloudflare Pages or GitHub Pages.
