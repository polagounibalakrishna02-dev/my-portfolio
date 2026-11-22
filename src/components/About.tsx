import { useEffect, useRef } from 'react'
import { profile } from '../data'
import { drawEtch } from '../lib/etch'
import { gsap, isTouch, SplitText, useGSAP } from '../lib/gsap'
import Label from './Label'

/**
 * Pinned intro: a glass card with oversized "ABOUT ME" floats over an etched night sky.
 * Scrolling expands the card to full screen while the words split apart, then the About content
 * is written inside it.
 */
export default function About() {
  const root = useRef<HTMLElement>(null)
  const canvas = useRef<HTMLCanvasElement>(null)

  useEffect(() => {
    const c = canvas.current!
    let id = 0
    const draw = () => {
      cancelAnimationFrame(id)
      id = requestAnimationFrame(() => drawEtch(c))
    }
    draw()
    let w = window.innerWidth
    const onResize = () => {
      // ignore mobile URL-bar height jitter
      if (Math.abs(window.innerWidth - w) < 2 && isTouch()) return
      w = window.innerWidth
      draw()
    }
    window.addEventListener('resize', onResize)
    return () => window.removeEventListener('resize', onResize)
  }, [])

  useGSAP(
    () => {
      const card = root.current!.querySelector<HTMLElement>('.ab__card')!
      const inset = () => {
        const cw = Math.min(360, window.innerWidth * 0.62)
        const ch = Math.min(460, window.innerHeight * 0.58)
        const x = (window.innerWidth - cw) / 2
        const y = (window.innerHeight - ch) / 2
        return `inset(${y}px ${x}px ${y}px ${x}px round 18px)`
      }
      gsap.set(card, { clipPath: inset() })
      const title = SplitText.create('.ab__title-line', { type: 'lines', mask: 'lines' })

      const tl = gsap.timeline({
        defaults: { ease: 'none' },
        scrollTrigger: {
          trigger: root.current,
          start: 'top top',
          end: '+=190%',
          pin: true,
          scrub: 1,
          invalidateOnRefresh: true,
        },
      })
      tl.fromTo(card, { clipPath: () => inset() }, { clipPath: 'inset(0px 0px 0px 0px round 0px)', duration: 1, ease: 'power2.inOut' }, 0.15)
        .to('.ab__word--about', { xPercent: -70, opacity: 0, filter: 'blur(10px)', duration: 0.8, ease: 'power2.in' }, 0.2)
        .to('.ab__word--me', { xPercent: 90, opacity: 0, filter: 'blur(10px)', duration: 0.8, ease: 'power2.in' }, 0.2)
        .to('.ab__etch', { scale: 1.12, opacity: 0.35, duration: 1.1 }, 0.1)
        .fromTo('.ab__beam', { opacity: 0.55, scaleY: 0.7 }, { opacity: 1, scaleY: 1, duration: 0.9 }, 0.3)
        .from(title.lines, { yPercent: 110, stagger: 0.12, duration: 0.6, ease: 'power3.out' }, 0.95)
        .from('.ab__card .label, .ab__lede', { opacity: 0, y: 24, stagger: 0.1, duration: 0.5 }, 1.05)
        .to({}, { duration: 0.35 })

      // the card rises into place as the section arrives
      gsap.fromTo(
        '.ab__stage',
        { yPercent: 18 },
        { yPercent: 0, ease: 'none', scrollTrigger: { trigger: root.current, start: 'top bottom', end: 'top top', scrub: true } },
      )
    },
    { scope: root },
  )

  return (
    <>
      <section id="about" className="ab" ref={root}>
        <canvas className="ab__etch" ref={canvas} aria-hidden="true" />
        <div className="ab__stage">
          <div className="ab__card">
            <div className="ab__beam" aria-hidden="true" />
            <div className="ab__inner wrap">
              <Label index="01" build={false}>
                About
              </Label>
              <h2 className="ab__title display">
                <span className="ab__title-line">From first prompt</span>
                <span className="ab__title-line accent">to production.</span>
              </h2>
              <p className="ab__lede">I turn LLM ideas into enterprise platforms people use every day.</p>
            </div>
          </div>
          <div className="ab__words" aria-hidden="true">
            <span className="ab__word ab__word--about wide">About</span>
            <span className="ab__word ab__word--me wide">Me</span>
          </div>
        </div>
      </section>

      <section className="about wrap" aria-label="About details">
        <div className="about__main">
          <p className="about__bio" data-build="Paragraph">
            {profile.about}
          </p>
          <dl className="about__facts">
            {[
              ['Based in', profile.location],
              ['Currently', `AI Engineer · ${profile.company}`],
              ['Focus', 'Agentic AI, RAG, full-stack platforms'],
              ['Open to', 'AI engineering roles & hard problems'],
            ].map(([k, v]) => (
              <div className="about__fact" key={k} data-build="Fact" data-build-kind="block">
                <dt>{k}</dt>
                <dd>{v}</dd>
              </div>
            ))}
          </dl>
        </div>
        <aside className="about__aside">
          <figure className="quote" data-build="Card" data-build-kind="block">
            <blockquote className="display">No eval, no ship.</blockquote>
            <figcaption>Rule #1 — every agent I build ships with tests that prove it still works.</figcaption>
          </figure>
        </aside>
      </section>
    </>
  )
}
