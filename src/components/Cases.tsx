import { useRef, useState } from 'react'
import { projects } from '../data'
import { gsap, stepSnap, useGSAP } from '../lib/gsap'
import { hdSrc, hdSrcSet, openViewer } from '../lib/hd'
import Label from './Label'

const N = projects.length
const STOPS = N * 2 // each project: "read" (copy + screen), then "see" (screen fills the viewport)

/** Where the screenshot sits when it fills the stage: centred, clear of the progress bar. */
const FULL = { side: 20, top: 20, bottom: 48, bar: 30 }

/**
 * Case studies on one pinned stage. Each project has two snap stops: first the agents build its copy
 * next to the screen; one short scroll later the screen itself grows to fill the viewport. That is a
 * real layout resize (left/top/width), not a CSS scale, so the image stays pixel-sharp and complete.
 * The next scroll slides the next project up over it.
 */
export default function Cases() {
  const root = useRef<HTMLElement>(null)
  const stage = useRef<HTMLDivElement>(null)
  const [active, setActive] = useState(0)

  useGSAP(
    () => {
      const mm = gsap.matchMedia()
      mm.add('(min-width: 900px)', () => {
        const stageEl = stage.current!
        const deck = stageEl.querySelector<HTMLElement>('.cases__deck')!
        const cards = gsap.utils.toArray<HTMLElement>('.case')

        // geometry of the screenshot, in the coordinate space of its card (layout values, so the
        // cards' slide transforms never skew the measurement)
        const geo = (card: HTMLElement) => {
          const inner = card.querySelector<HTMLElement>('.case__inner')!
          const slot = card.querySelector<HTMLElement>('.case__slot')!
          let ax = 0
          let ay = 0
          for (let n: HTMLElement | null = slot; n && n !== inner; n = n.offsetParent as HTMLElement | null) {
            ax += n.offsetLeft
            ay += n.offsetTop
          }
          // exact (sub-pixel) origin of the card's inner box inside the stage; x and y are never
          // transformed by the slide, so the deck's rect and the card's computed left/top are safe
          const cs = getComputedStyle(card)
          const ox = deck.getBoundingClientRect().left - stageEl.getBoundingClientRect().left + parseFloat(cs.left) + inner.clientLeft
          const oy = deck.offsetTop + parseFloat(cs.top) + inner.clientTop
          const sw = stageEl.clientWidth
          const sh = window.innerHeight
          const availH = sh - FULL.top - FULL.bottom
          // whole pixels at rest, so the image is never resampled at a sub-pixel offset
          const bw = Math.round(Math.min(sw - FULL.side * 2, (availH - FULL.bar) * 1.6))
          const bh = bw * 0.625 + FULL.bar
          return {
            ax,
            ay,
            aw: slot.offsetWidth,
            bx: Math.round((sw - bw) / 2) - ox,
            by: Math.round(FULL.top + (availH - bh) / 2) - oy,
            bw,
          }
        }

        gsap.set(cards, { transformOrigin: '50% 0%' })
        gsap.set(cards.slice(1), { yPercent: 108 })

        const tl = gsap.timeline({
          defaults: { ease: 'none' },
          scrollTrigger: {
            trigger: stageEl,
            start: 'top top',
            end: () => `+=${window.innerHeight * 0.55 * (STOPS - 1)}`,
            pin: true,
            scrub: 0.5,
            invalidateOnRefresh: true,
            snap: {
              snapTo: stepSnap(STOPS),
              inertia: false,
              duration: { min: 0.35, max: 0.75 },
              delay: 0.04,
              ease: 'power2.inOut',
            },
            onUpdate: (self) => setActive(Math.floor(Math.round(self.progress * (STOPS - 1)) / 2)),
          },
        })

        cards.forEach((card, i) => {
          const shot = card.querySelector('.case__shot')
          if (i > 0) {
            // next project slides up over the previous one, which recedes
            tl.to(card, { yPercent: 0, duration: 1, ease: 'power2.inOut' })
              .to(cards[i - 1], { scale: 0.92, filter: 'brightness(0.3)', duration: 0.7, ease: 'power1.in' }, '<0.3')
              // its enlarged screen reaches past the card edges, so let it go rather than peek out
              .to(cards[i - 1].querySelector('.case__shot'), { opacity: 0, duration: 0.5 }, '<')
          }
          // the screen grows from its column to fill the stage
          tl.fromTo(
            shot,
            { left: () => geo(card).ax, top: () => geo(card).ay, width: () => geo(card).aw, autoRound: false },
            {
              left: () => geo(card).bx,
              top: () => geo(card).by,
              width: () => geo(card).bw,
              autoRound: false,
              duration: 1,
              ease: 'power2.inOut',
            },
          )
            .to(card.querySelector('.case__veil'), { opacity: 1, duration: 0.6 }, '<')
            .to(card.querySelector('.case__hint'), { opacity: 0, duration: 0.25 }, '<')
        })
      })
    },
    { scope: root },
  )

  return (
    <section className="cases" ref={root} aria-label="Case studies">
      <div className="cases__head wrap">
        <div>
          <Label index="04">Case studies</Label>
          <h2 className="cases__title display">
            <span data-build="Heading">Work that</span>
            <span className="accent" data-build="Heading">
              ships.
            </span>
          </h2>
        </div>
        <div className="cases__aside">
          <p className="cases__sub" data-build="Paragraph">
            Four production platforms I built at Genpact — what each one does, how it works and what it changed.
          </p>
          <dl className="cases__nums">
            {[
              ['04', 'Platforms in production'],
              ['03', 'Clouds deployed to'],
              ['65%', 'Fewer tokens per run'],
            ].map(([v, k]) => (
              <div key={k} data-build="Metric" data-build-kind="block">
                <dd className="display">{v}</dd>
                <dt>{k}</dt>
              </div>
            ))}
          </dl>
        </div>
      </div>

      <div className="cases__stage" ref={stage}>
        <div className="cases__deck wrap">
          {projects.map((p, i) => (
            <article id={`case-${p.id}`} className="case" key={p.id} style={{ ['--tint' as string]: p.tint }}>
              <div className="case__inner">
                <div className="case__text">
                  <p className="case__idx">
                    <i style={{ background: p.tint }} /> 0{i + 1} / 0{N}
                  </p>
                  <h3 className="case__name display" data-build="Title">
                    {p.name}
                    <em>.</em>
                  </h3>
                  <p className="case__tagline" data-build="Tagline">
                    {p.tagline}
                  </p>
                  <ol className="case__points">
                    {p.points.map((pt, j) => (
                      <li key={j}>
                        <span>0{j + 1}</span>
                        <p data-build="Point">{pt}</p>
                      </li>
                    ))}
                  </ol>
                  <div className="case__metric" data-build="Result" data-build-kind="block">
                    <span className="display">{p.metric.value}</span>
                    <span>{p.metric.label}</span>
                  </div>
                </div>
                <div className="case__visual">
                  <div className="case__frame">
                    <div className="case__slot" aria-hidden="true" />
                    <ul className="case__stack" data-build="Stack" data-build-kind="block">
                      {p.stack.map((s) => (
                        <li key={s}>{s}</li>
                      ))}
                    </ul>
                  </div>
                </div>
                <div className="case__veil" aria-hidden="true" />
                <figure
                  className="case__shot"
                  onClick={() => openViewer({ base: p.image, title: p.short, sub: p.tagline })}
                  data-cursor="Expand"
                  data-build="Screen"
                  data-build-kind="media"
                >
                  <div className="case__bar" aria-hidden="true">
                    <i />
                    <i />
                    <i />
                    <span>{p.short.toLowerCase().replace(/[^a-z]+/g, '-')}.genpact.app</span>
                    <b className="case__hint">Scroll ↓ full size</b>
                  </div>
                  <img
                    src={hdSrc(p.image, 2000)}
                    srcSet={hdSrcSet(p.image)}
                    sizes="(min-width: 900px) min(calc(100vw - 40px), calc((100vh - 98px) * 1.6)), 92vw"
                    alt={`${p.short} — product screen`}
                    decoding="async"
                  />
                </figure>
              </div>
            </article>
          ))}
        </div>
        <ol className="cases__progress" aria-hidden="true">
          {projects.map((p, i) => (
            <li key={p.id} className={i === active ? 'is-active' : i < active ? 'is-done' : ''}>
              <span>0{i + 1}</span>
              {p.short}
            </li>
          ))}
        </ol>
      </div>
    </section>
  )
}
