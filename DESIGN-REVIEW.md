# Design review — v1 vs the four references

## What the references actually do

| Ref | Signature move | Type & colour | Lesson |
| --- | --- | --- | --- |
| **1 · ECHO** | Glowing line traces a wobbly ring around the wordmark → blur-in hero → card with oversized "ABOUT ME" expands to full screen while the words split apart → timeline stages smear between states → project cards on a **bent WebGL ribbon** → hexagon "WORKS '26" drum | Wide heavy grotesk, monochrome, one light section | Every transition *transforms* the previous element into the next one |
| **2 · Jai Manjhi** | "BOOTING AGENTS 10/10" → agents burst out from centre → they **drag blue wireframe boxes with pixel sizes**, **type** the text in, then colour floods the layout. Every scrolled section is **built in front of you** | Anton-style condensed, near-black, red-orange, mono HUD labels | The cursors have a job; they are never decorative |
| **3 · Iron Man** | Hero image **disintegrates into gold shards** on interaction, then re-forms; smoky cinematic lighting | Clean geometric sans, white + gold, `J.A.R.V.I.S. // DIAGNOSTIC` labels | Particles are an *event*, never ambient |
| **4 · Gireesh** | Lit portrait hero, **3D robot that follows the cursor**, glowing **cube mascot with eyes**, `LEARN → BUILD → BREAK → IMPROVE`, "LET'S BUILD SOMETHING GOOD." | Condensed caps, orange-red light, amber | Character and personality, not just layout |

## What was wrong with v1 (honest audit)

1. **Ambient particle dust everywhere.** It moved on its own, meant nothing and made every section look dirty. None of the references do this.
2. **Agent cursors wandered randomly**, overlapping text. In ref 2 they *build* the page; in v1 they read as bugs.
3. **No grid.** Hero stats floated, the experience panels overflowed with dead space, the work caption collided with the index, section padding was inconsistent.
4. **Project visuals were toy UIs** with 8px text. The references show real product screens.
5. **The work drum was flat CSS cards**, cramped and flickering. Ref 1 uses a bent, chromatic WebGL ribbon.
6. **Generic motion.** Mostly fade-ups; none of the signature transitions (card expand, split words, smear, shatter, build).
7. **Too many mono labels and low-contrast body text**, so the hierarchy felt noisy.

## v2 direction — "Built by agents"

One idea ties it together: **Bala builds AI agents, so his agents build his portfolio.**

- **Boot → build (ref 2):** "BOOTING AGENTS 06/06" with the ECHO-style line ring (ref 1). Agents burst out, drag measured wireframe boxes, type the copy in, then colour arrives. Every section after that is built as it scrolls in. Hovering any component shows a Figma-style inspect outline with its real size.
- **Hero (refs 2 + 4 + 3):** an orange-lit 3D android bust sits where the portrait would be, between the giant "AI ENGINEER" and the name. Its head and eyes follow the cursor. On scroll it **dissolves into orange-gold shards** (ref 3), and only on scroll.
- **About (ref 1):** a glass card with oversized "ABOUT ME" over an etched night sky above a Charminar skyline (Hyderabad). On scroll the card expands to full screen and the words split apart.
- **Experience (ref 1):** pinned stages with ghost type rows and a chromatic smear between ORIGIN → GENPACT → CERTIFIED.
- **Work (ref 1):** real product screenshots on a bent WebGL ribbon you can drag or scroll, with chromatic aberration at speed.
- **Case studies (refs 2 + 4):** large real screenshots in stacked cards, built by agents.
- **Method (ref 4):** `RETRIEVE → REASON → EVALUATE → SHIP` plus the skills table.
- **Contact (refs 4 + 1):** a glowing cube mascot whose eyes follow you, "LET'S BUILD SOMETHING INTELLIGENT.", pill links and a giant wordmark.

**System:** 12-column grid (max 1440, fluid gutters), one spacing scale, four type roles (Anton display · Archivo Expanded · Archivo text · JetBrains Mono HUD), and colour roles: ink #08080a, bone #ebe8e2, signal orange #ff4d1a, gold #e8b04a (experience), blueprint blue #3d7bff (build wireframes only).
