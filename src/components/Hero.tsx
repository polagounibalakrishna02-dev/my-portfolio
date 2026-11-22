import { lazy, useEffect, useRef } from 'react'
import { profile, stats } from '../data'
import { gsap, useGSAP } from '../lib/gsap'
import { asset } from '../lib/hd'
import { scrollToTarget } from '../lib/smoothScroll'
import { useInView } from '../lib/useInView'
import { portrait } from '../three/state'
import Magnetic from './Magnetic'
import SafeScene from './SafeScene'

const Portrait = lazy(() => import('../three/Portrait'))

export default function Hero() {
  const root = useRef<HTMLElement>(null)
  const inView = useInView(root, '0px')

  // once the loader hands over: static noise pulls together into the portrait, the back light warms up
  useEffect(() => {
    const onBoot = () => {
      gsap.to(portrait, { assemble: 1, duration: 2.8, ease: 'power2.inOut' })
      gsap.to(root.current!.querySelectorAll('.hero__spot, .hero__glow'), { opacity: 1, duration: 2.4, delay: 0.6 })
    }
    window.addEventListener('builder:boot', onBoot)
    return () => window.removeEventListener('builder:boot', onBoot)
  }, [])

  // the giant word keeps living after it lands: a slow parallax against the cursor
  useEffect(() => {
    const word = root.current?.querySelector<HTMLElement>('.hero__back')
    if (!word || window.matchMedia('(pointer: coarse)').matches) return
    const xTo = gsap.quickTo(word, 'x', { duration: 1.4, ease: 'power3' })
    const yTo = gsap.quickTo(word, 'y', { duration: 1.4, ease: 'power3' })
    const move = (e: PointerEvent) => {
      xTo((e.clientX / window.innerWidth - 0.5) * -26)
      yTo((e.clientY / window.innerHeight - 0.5) * -12)
    }
    window.addEventListener('pointermove', move, { passive: true })
    return () => window.removeEventListener('pointermove', move)
  }, [])

  // stat counters run when their box is built
  useEffect(() => {
    const nodes = root.current?.querySelectorAll<HTMLElement>('.hero__stat') ?? []
    const offs: (() => void)[] = []
    nodes.forEach((node) => {
      const num = node.querySelector<HTMLElement>('.hero__num')!
      const target = Number(node.dataset.value)
      const pad = Number(node.dataset.pad)
      const on = () => {
        const o = { v: 0 }
        gsap.to(o, {
          v: target,
          duration: 1.4,
          ease: 'power3.out',
          onUpdate: () => (num.textContent = String(Math.round(o.v)).padStart(pad, '0')),
        })
      }
      node.addEventListener('built', on, { once: true })
      offs.push(() => node.removeEventListener('built', on))
    })
    return () => offs.forEach((f) => f())
  }, [])

  // scroll out: the portrait disperses back into particles, layers separate
  useGSAP(
    () => {
      gsap
        .timeline({
          scrollTrigger: {
            trigger: root.current,
            start: 'top top',
            end: 'bottom top',
            scrub: true,
            onUpdate: (self) => {
              portrait.scatter = gsap.utils.clamp(0, 1, (self.progress - 0.03) * 1.5)
            },
          },
        })
        .to('.hero__back', { yPercent: 40, opacity: 0.2, ease: 'none' }, 0)
        .to('.hero__content', { yPercent: -18, opacity: 0, ease: 'none' }, 0)
        .to('.hero__spot, .hero__glow', { opacity: 0, ease: 'none' }, 0.2)
    },
    { scope: root },
  )

  return (
    <section id="home" className="hero" ref={root}>
      <div className="hero__spot" aria-hidden="true" />
      <div className="hero__glow" aria-hidden="true" />
      <div className="hero__back" aria-hidden="true">
        <span className="hero__back-word display">AI ENGINEER</span>
      </div>
      <div className="hero__stage" aria-hidden="true">
        <SafeScene>
          <Portrait
            url={asset('/portrait/bala-v3.png')}
            colorUrl={asset('/portrait/bala-v3-color.webp')}
            active={inView}
          />
        </SafeScene>
      </div>

      <div className="hero__content wrap">
        <div className="hero__left">
          <p className="hero__hello label" data-build="Label">
            <span className="live" /> Hello, I'm
          </p>
          <h1 className="hero__name display">
            <span className="hero__line" data-build="Heading">
              {profile.first}
            </span>
            <span className="hero__line" data-build="Heading">
              {profile.last}
              <em>.</em>
            </span>
          </h1>
          <p className="hero__role display" data-build="Subheading">
            Full-stack developer
            <br />& agent builder
          </p>
          <p className="hero__intro" data-build="Paragraph">
            {profile.intro}
          </p>
          <div className="hero__ctas" data-build="Actions" data-build-kind="block">
            <Magnetic>
              <a
                href="#work"
                className="btn btn--solid"
                onClick={(e) => {
                  e.preventDefault()
                  scrollToTarget('#work')
                }}
              >
                View work <span aria-hidden="true">↗</span>
              </a>
            </Magnetic>
            <Magnetic>
              <a
                href="#contact"
                className="btn btn--ghost"
                onClick={(e) => {
                  e.preventDefault()
                  scrollToTarget('#contact')
                }}
              >
                Get in touch
              </a>
            </Magnetic>
          </div>
        </div>

        <ul className="hero__stats">
          {stats.map((s) => (
            <li className="hero__stat" key={s.label} data-build="Stat" data-build-kind="block" data-value={s.value} data-pad={s.pad}>
              <span className="hero__stat-v display">
                <span className="hero__num">{'0'.repeat(s.pad)}</span>
                <span className="accent">{s.suffix || '.'}</span>
              </span>
              <span className="hero__stat-l">{s.label}</span>
            </li>
          ))}
        </ul>
      </div>

      <div className="hero__foot wrap">
        <span data-build="Meta">Based in {profile.location}</span>
        <span className="hero__scroll" data-build="Scroll" data-build-kind="block">
          <span className="hero__scroll-line" /> Scroll to explore
        </span>
        <span data-build="Meta">{profile.coords}</span>
      </div>
    </section>
  )
}
