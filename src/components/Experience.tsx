import { useRef, useState } from 'react'
import { experience } from '../data'
import { gsap, useGSAP } from '../lib/gsap'
import Label from './Label'

/**
 * Pinned timeline. Stages replace each other with a horizontal chromatic smear while
 * two rows of ghost type drift behind them.
 */
export default function Experience() {
  const root = useRef<HTMLDivElement>(null)
  const [active, setActive] = useState(0)

  useGSAP(
    () => {
      const mm = gsap.matchMedia()
      mm.add('(min-width: 900px)', () => {
        const stages = gsap.utils.toArray<HTMLElement>('.stage')
        gsap.set(stages.slice(1), { autoAlpha: 0, xPercent: 12 })
        const tl = gsap.timeline({
          defaults: { ease: 'power2.inOut' },
          scrollTrigger: {
            trigger: root.current,
            start: 'top top',
            end: () => `+=${window.innerHeight * 2.4}`,
            pin: true,
            scrub: 1,
            invalidateOnRefresh: true,
            onUpdate: (self) => {
              root.current!.style.setProperty('--exp-p', self.progress.toFixed(4))
              setActive(Math.min(stages.length - 1, Math.floor(self.progress * stages.length * 0.999)))
            },
          },
        })
        tl.to({}, { duration: 0.6 })
        stages.forEach((st, i) => {
          if (i === 0) return
          const prev = stages[i - 1]
          tl.to(prev, { xPercent: -14, autoAlpha: 0, filter: 'blur(10px)', '--smear': 1, duration: 0.5 })
            .fromTo(
              st,
              { xPercent: 14, autoAlpha: 0, filter: 'blur(10px)', '--smear': 1 },
              { xPercent: 0, autoAlpha: 1, filter: 'blur(0px)', '--smear': 0, duration: 0.5 },
              '<0.12',
            )
            .to({}, { duration: 0.6 })
        })
        gsap.to('.exp__ghost-row--a', { xPercent: -30, ease: 'none', scrollTrigger: { trigger: root.current, start: 'top bottom', end: () => `+=${window.innerHeight * 3.4}`, scrub: true } })
        gsap.fromTo('.exp__ghost-row--b', { xPercent: -30 }, { xPercent: 0, ease: 'none', scrollTrigger: { trigger: root.current, start: 'top bottom', end: () => `+=${window.innerHeight * 3.4}`, scrub: true } })
      })
    },
    { scope: root },
  )

  const ghostA = 'AI ENGINEER — FULL-STACK — AGENT BUILDER — '.repeat(3)
  const ghostB = '2019 → 2022 → NOW → CERTIFIED → '.repeat(3)

  return (
    <section id="experience" className="exp">
      <div className="exp__pin" ref={root}>
        <div className="exp__ghost" aria-hidden="true">
          <div className="exp__ghost-row exp__ghost-row--a wide">{ghostA}</div>
          <div className="exp__ghost-row exp__ghost-row--b wide">{ghostB}</div>
        </div>

        <div className="exp__frame wrap">
          <header className="exp__top">
            <Label index="02">Experience</Label>
            <div className="exp__progress" aria-hidden="true">
              {experience.map((e, i) => (
                <span key={e.key} className={i <= active ? 'is-on' : ''} />
              ))}
            </div>
          </header>

          <div className="exp__grid">
            <div className="exp__intro">
              <h2 className="exp__heading wide glow" data-build="Heading">
                Where
                <br />
                I've been
              </h2>
              <p className="exp__sub" data-build="Paragraph">
                From a computer-applications degree in Hyderabad to shipping enterprise AI platforms at Genpact.
              </p>
            </div>

            <div className="exp__stages">
              {experience.map((e) => (
                <article className="stage" key={e.key}>
                  <p className="stage__period">
                    <span className="accent">{e.period}</span> <span className="stage__sep">/</span> {e.kicker}
                  </p>
                  <h3 className="stage__title wide glow">
                    {e.title.map((t) => (
                      <span key={t}>{t}</span>
                    ))}
                  </h3>
                  <p className="stage__body">{e.body}</p>
                  <dl className="stage__ms">
                    {e.milestones.map((m, j) => (
                      <div key={m.k} className="stage__m">
                        <dt>
                          <span className="accent">0{j + 1}</span> {m.k}
                        </dt>
                        <dd>{m.v}</dd>
                      </div>
                    ))}
                  </dl>
                </article>
              ))}
            </div>
          </div>

          <nav className="exp__tabs" aria-hidden="true">
            {experience.map((e, i) => (
              <span key={e.key} className={i === active ? 'is-active' : ''}>
                {e.key}
              </span>
            ))}
          </nav>
        </div>
      </div>
    </section>
  )
}
