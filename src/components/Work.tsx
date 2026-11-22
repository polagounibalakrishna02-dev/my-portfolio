import { useEffect, useRef, useState } from 'react'
import { projects } from '../data'
import { gsap, ScrollTrigger, SplitText, stepSnap, useGSAP } from '../lib/gsap'
import { hdSrc, hdSrcSet, openViewer } from '../lib/hd'
import { scrollToTarget } from '../lib/smoothScroll'
import { ribbon } from '../three/state'
import Label from './Label'

const N = projects.length
const CARDS = [...projects, ...projects] // two laps so the arc never runs out
const M = CARDS.length
const GAP = 1.14 // centre-to-centre distance in card widths: a clear gap between cards

/**
 * Selected work: real screenshots (plain <img>, so the browser renders them razor-sharp) on a
 * concave arc. The card is sized from the viewport height so the UI inside it reads at close to
 * 1:1, and scroll snaps to each project so the card you stop on is upright and untransformed.
 */
export default function Work() {
  const root = useRef<HTMLElement>(null)
  const [active, setActive] = useState(0)
  const drag = useRef({ on: false, x: 0, extra: 0, base: 0, moved: 0 })

  useGSAP(
    () => {
      ScrollTrigger.create({
        trigger: root.current,
        start: 'top top',
        end: () => `+=${window.innerHeight * 0.7 * (N - 1)}`,
        pin: true,
        scrub: true,
        invalidateOnRefresh: true,
        snap: { snapTo: stepSnap(N), inertia: false, duration: { min: 0.25, max: 0.55 }, delay: 0.06, ease: 'power2.inOut' },
        onUpdate: (self) => {
          drag.current.base = self.progress * (N - 1)
          ribbon.target = drag.current.base + drag.current.extra
        },
      })

      // the giant word behind the arc rises in letter by letter
      const split = SplitText.create('.work__ghost', { type: 'chars', mask: 'chars' })
      gsap.from(split.chars, {
        yPercent: 105,
        duration: 1.2,
        stagger: 0.045,
        ease: 'expo.out',
        scrollTrigger: { trigger: root.current, start: 'top 70%' },
      })
    },
    { scope: root },
  )

  // re-type the caption whenever the centred project changes
  useEffect(() => {
    const el = root.current?.querySelector<HTMLElement>('.work__caption')
    if (!el) return
    const parts = el.querySelectorAll<HTMLElement>('.work__caption-name, .work__caption-sub')
    const split = SplitText.create(parts, { type: 'lines', mask: 'lines' })
    const tw = gsap.from(split.lines, { yPercent: 110, duration: 0.7, stagger: 0.06, ease: 'expo.out' })
    return () => {
      tw.kill()
      split.revert()
    }
  }, [active])

  // lay the cards out on the arc every frame
  useEffect(() => {
    const cards = Array.from(root.current!.querySelectorAll<HTMLElement>('.wcard'))
    let last = -1
    const tick = (_t: number, dt: number) => {
      ribbon.offset += (ribbon.target - ribbon.offset) * (1 - Math.exp(-dt * 0.009))
      const w = cards[0]?.offsetWidth || 900
      const spacing = w * GAP
      cards.forEach((el, i) => {
        let d = i - ribbon.offset
        d = (((d + M / 2) % M) + M) % M - M / 2
        const ad = Math.abs(d)
        if (ad < 0.004) {
          // settled in the middle: a plain, untransformed image — pixel-exact, no 3D compositing
          el.style.transform = 'none'
        } else {
          const x = d * spacing
          const rot = -gsap.utils.clamp(-2.2, 2.2, d) * 22
          const z = -Math.min(ad, 2.2) * 60
          el.style.transform = `perspective(2400px) translate3d(${x.toFixed(2)}px, 0, ${z.toFixed(2)}px) rotateY(${rot.toFixed(3)}deg)`
        }
        el.style.opacity = String(gsap.utils.clamp(0, 1, 2.2 - ad))
        el.style.zIndex = String(100 - Math.round(ad * 10))
        el.classList.toggle('is-center', ad < 0.08)
      })
      const a = ((Math.round(ribbon.offset) % N) + N) % N
      if (a !== last) {
        last = a
        setActive(a)
      }
    }
    gsap.ticker.add(tick)
    return () => gsap.ticker.remove(tick)
  }, [])

  const onDown = (e: React.PointerEvent) => {
    drag.current.on = true
    drag.current.x = e.clientX
    drag.current.moved = 0
  }
  const onMove = (e: React.PointerEvent) => {
    const d = drag.current
    if (!d.on) return
    const dx = e.clientX - d.x
    d.x = e.clientX
    d.moved += Math.abs(dx)
    d.extra -= dx / Math.max(320, window.innerWidth * 0.45)
    ribbon.target = d.base + d.extra
  }
  const onUp = () => {
    const d = drag.current
    if (!d.on) return
    d.on = false
    const snapped = Math.round(d.base + d.extra)
    d.extra = snapped - d.base
    ribbon.target = snapped
  }
  // click the centre card → full-screen viewer; click a side card → bring it to the centre
  const open = (i: number) => {
    const d0 = drag.current
    if (d0.moved > 6) return
    let d = i - ribbon.offset
    d = (((d + M / 2) % M) + M) % M - M / 2
    if (Math.abs(d) < 0.5) {
      const x = projects[i % N]
      openViewer({ base: x.image, title: x.short, sub: x.tagline })
    } else {
      const target = Math.round(ribbon.offset + d)
      d0.extra = target - d0.base
      ribbon.target = target
    }
  }

  const p = projects[active]

  return (
    <section id="work" className="work" ref={root} data-tone="light">
      <p className="work__ghost wide" aria-hidden="true">
        Projects
      </p>

      <div
        className="wcar"
        onPointerDown={onDown}
        onPointerMove={onMove}
        onPointerUp={onUp}
        onPointerLeave={onUp}
        onPointerCancel={onUp}
      >
        <div className="wcar__stage">
          {CARDS.map((x, i) => (
            <figure className="wcard" key={i} onClick={() => open(i)} data-cursor="Expand">
              <div className="wcard__bar" aria-hidden="true">
                <i />
                <i />
                <i />
                <span>{x.short.toLowerCase().replace(/[^a-z]+/g, '-')}.genpact.app</span>
              </div>
              <img
                src={hdSrc(x.image, 2000)}
                srcSet={hdSrcSet(x.image)}
                sizes="(min-width: 900px) min(76vw, 1320px), 92vw"
                alt={`${x.short} — product screen`}
                draggable={false}
                decoding="async"
              />
            </figure>
          ))}
        </div>
      </div>

      <div className="work__bar wrap">
        <div className="work__meta">
          <Label index="03">Selected work</Label>
          <div className="work__caption" aria-live="polite" key={active}>
            <p className="work__caption-name wide">{p.short}</p>
            <p className="work__caption-sub">{p.tagline}</p>
          </div>
        </div>
        <ol className="work__index">
          {projects.map((x, i) => (
            <li key={x.id} className={i === active ? 'is-active' : ''}>
              <a
                href={`#case-${x.id}`}
                onClick={(e) => {
                  e.preventDefault()
                  scrollToTarget(`#case-${x.id}`)
                }}
              >
                <span>0{i + 1}</span>
                {x.short}
              </a>
            </li>
          ))}
        </ol>
      </div>
    </section>
  )
}
