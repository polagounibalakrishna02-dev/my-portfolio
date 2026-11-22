import { lazy, useEffect, useRef, useState } from 'react'
import { marqueeTech, method, skills } from '../data'
import { gsap, ScrollTrigger, useGSAP } from '../lib/gsap'
import { useInView } from '../lib/useInView'
import { agent } from '../three/state'
import Label from './Label'
import SafeScene from './SafeScene'

const Agent = lazy(() => import('../three/Agent'))

function useNarrow() {
  const [narrow, setNarrow] = useState(() => window.matchMedia('(max-width: 899px)').matches)
  useEffect(() => {
    const mq = window.matchMedia('(max-width: 899px)')
    const on = () => setNarrow(mq.matches)
    mq.addEventListener('change', on)
    return () => mq.removeEventListener('change', on)
  }, [])
  return narrow
}

const R = 230 // ring radius (svg units, viewBox 640)
const C = 2 * Math.PI * R
const TICKS = Array.from({ length: 72 }, (_, i) => i)

/**
 * How I build — a pinned "agent loop". Scrolling runs the loop: the progress arc and its pulse travel
 * around the ring, each step's node lights up as it is reached, and the step copy on the left swaps
 * with a masked transition. Everything is driven by scroll; nothing moves on its own.
 */
export default function Method() {
  const root = useRef<HTMLElement>(null)
  const frame = useRef<HTMLDivElement>(null)
  const big = useRef<HTMLSpanElement>(null)
  const bigWrap = useRef<HTMLDivElement>(null)
  const [step, setStep] = useState(0)
  const prevStep = useRef(0)
  const narrow = useNarrow()
  const agentBox = useRef<HTMLDivElement>(null)
  const agentInView = useInView(agentBox, '120px')

  // the agent scan-builds itself the first time it comes into view
  useEffect(() => {
    if (agentInView) agent.scan = 3.6
  }, [agentInView])

  // hover = the agent watches the cursor; click = a happy hop
  const onRingMove = (e: React.PointerEvent<HTMLElement>) => {
    const r = e.currentTarget.getBoundingClientRect()
    agent.hover = true
    agent.px = gsap.utils.clamp(-1, 1, (e.clientX - (r.left + r.width / 2)) / (r.width / 2))
    agent.py = gsap.utils.clamp(-1, 1, -(e.clientY - (r.top + r.height / 2)) / (r.height / 2))
  }
  const onRingLeave = () => (agent.hover = false)
  const onRingClick = () => (agent.poke = 1)

  // 65% counter when the stat is built
  useEffect(() => {
    const el = bigWrap.current
    if (!el) return
    const on = () => {
      const o = { v: 0 }
      gsap.to(o, { v: 65, duration: 1.8, ease: 'power3.out', onUpdate: () => big.current && (big.current.textContent = String(Math.round(o.v))) })
    }
    el.addEventListener('built', on, { once: true })
    return () => el.removeEventListener('built', on)
  }, [])

  // the loop itself
  useGSAP(
    () => {
      const mm = gsap.matchMedia()
      mm.add('(min-width: 900px)', () => {
        const arc = frame.current!.querySelector<SVGCircleElement>('.mring__arc')!
        const head = frame.current!.querySelector<SVGGElement>('.mring__head')!
        const inner = frame.current!.querySelector<SVGGElement>('.mring__inner')!
        const proxy = { p: 0 }
        const render = () => {
          const p = proxy.p
          arc.style.strokeDashoffset = String(C * (1 - p))
          const a = -Math.PI / 2 + p * Math.PI * 2
          head.setAttribute('transform', `translate(${320 + Math.cos(a) * R} ${320 + Math.sin(a) * R})`)
          inner.setAttribute('transform', `rotate(${p * 180} 320 320)`)
          frame.current!.style.setProperty('--loop', p.toFixed(4))
          const s = Math.min(method.length - 1, Math.floor(p * method.length + 0.0001))
          agent.progress = p
          agent.step = s
          if (s !== prevStep.current) {
            prevStep.current = s
            setStep(s)
          }
        }
        render()
        gsap.to(proxy, {
          p: 1,
          ease: 'none',
          onUpdate: render,
          scrollTrigger: {
            trigger: frame.current,
            start: 'top top',
            end: () => `+=${window.innerHeight * 3.2}`,
            pin: true,
            scrub: 0.6,
            invalidateOnRefresh: true,
          },
        })
      })
      // phones: the list's scroll progress drives the agent instead
      mm.add('(max-width: 899px)', () => {
        ScrollTrigger.create({
          trigger: '.mlist',
          start: 'top 70%',
          end: 'bottom 40%',
          onUpdate: (self) => {
            agent.progress = self.progress
            agent.step = Math.min(method.length - 1, Math.floor(self.progress * method.length))
          },
        })
      })
    },
    { scope: root },
  )

  // masked swap of the step copy whenever the active step changes
  useEffect(() => {
    const el = frame.current
    if (!el) return
    const blocks = el.querySelectorAll<HTMLElement>('.mloop__step')
    blocks.forEach((b, i) => {
      const word = b.querySelector('.mloop__word')
      const rest = b.querySelectorAll('.mloop__text, .mloop__tools')
      if (i === step) {
        gsap.set(b, { autoAlpha: 1 })
        gsap.fromTo(word, { yPercent: 105 }, { yPercent: 0, duration: 0.7, ease: 'expo.out', overwrite: true })
        gsap.fromTo(rest, { y: 24, opacity: 0 }, { y: 0, opacity: 1, duration: 0.6, stagger: 0.06, delay: 0.12, ease: 'power3.out', overwrite: true })
      } else if (b.style.visibility !== 'hidden') {
        gsap.to(word, { yPercent: -105, duration: 0.5, ease: 'power3.in', overwrite: true })
        gsap.to(rest, { opacity: 0, duration: 0.3, overwrite: true, onComplete: () => gsap.set(b, { autoAlpha: 0 }) })
      }
    })
  }, [step])

  const strip = [...marqueeTech, ...marqueeTech]

  return (
    <section id="method" className="method" ref={root}>
      <div className="mloop" ref={frame}>
        <div className="mloop__inner wrap">
          <header className="method__top">
            <div className="method__top-l">
              <Label index="05">How I build</Label>
              <h2 className="method__title display">
                <span data-build="Heading">Four steps,</span>
                <span className="accent" data-build="Heading">
                  every agent.
                </span>
              </h2>
            </div>
            <p className="method__intro" data-build="Paragraph">
              Every agent I ship runs through the same loop — from grounding the answer in real data to switching on cost
              limits in production.
            </p>
          </header>

          <div className="mloop__main">
            <div className="mloop__copy">
              <p className="mloop__count">
                <span className="accent">0{step + 1}</span> / 0{method.length}
              </p>
              <div className="mloop__steps">
                {method.map((m, i) => (
                  <div className="mloop__step" key={m.word} style={i === 0 ? undefined : { visibility: 'hidden' }}>
                    <div className="mloop__mask">
                      <h3 className="mloop__word display">{m.word}</h3>
                    </div>
                    <p className="mloop__text">{m.body}</p>
                    <p className="mloop__tools">{m.tools}</p>
                  </div>
                ))}
              </div>
            </div>

            <div className="mring" onPointerMove={onRingMove} onPointerLeave={onRingLeave} onClick={onRingClick} data-cursor="Poke">
              <svg viewBox="0 0 640 640" aria-hidden="true">
                <defs>
                  <radialGradient id="mringGlow">
                    <stop offset="0%" stopColor="#ff4d1a" stopOpacity="0.35" />
                    <stop offset="100%" stopColor="#ff4d1a" stopOpacity="0" />
                  </radialGradient>
                </defs>
                <circle cx="320" cy="320" r="300" fill="url(#mringGlow)" className="mring__glow" />
                {TICKS.map((t) => {
                  const a = (t / TICKS.length) * Math.PI * 2 - Math.PI / 2
                  const major = t % 18 === 0
                  const r1 = R + 22
                  const r2 = R + (major ? 40 : 30)
                  return (
                    <line
                      key={t}
                      x1={320 + Math.cos(a) * r1}
                      y1={320 + Math.sin(a) * r1}
                      x2={320 + Math.cos(a) * r2}
                      y2={320 + Math.sin(a) * r2}
                      className={major ? 'mring__tick is-major' : 'mring__tick'}
                    />
                  )
                })}
                <g className="mring__inner">
                  <circle cx="320" cy="320" r="168" className="mring__dash" />
                  <circle cx="320" cy="320" r="120" className="mring__thin" />
                </g>
                <circle cx="320" cy="320" r={R} className="mring__track" />
                <circle
                  cx="320"
                  cy="320"
                  r={R}
                  className="mring__arc"
                  strokeDasharray={C}
                  strokeDashoffset={C}
                  transform="rotate(-90 320 320)"
                />
                {method.map((m, i) => {
                  const a = (i / method.length) * Math.PI * 2 - Math.PI / 2
                  const x = 320 + Math.cos(a) * R
                  const y = 320 + Math.sin(a) * R
                  const lx = 320 + Math.cos(a) * (R + 72)
                  const ly = 320 + Math.sin(a) * (R + 72)
                  const state = i === step ? 'is-active' : i < step ? 'is-done' : ''
                  return (
                    <g key={m.word} className={`mring__node ${state}`}>
                      <circle cx={x} cy={y} r="30" className="mring__halo" />
                      <circle cx={x} cy={y} r="11" className="mring__dot" />
                      <text x={lx} y={ly} className="mring__label" textAnchor="middle" dominantBaseline="middle">
                        {m.word}
                      </text>
                    </g>
                  )
                })}
                <g className="mring__head" transform={`translate(320 ${320 - R})`}>
                  <circle r="16" className="mring__head-glow" />
                  <circle r="5" className="mring__head-dot" />
                </g>
              </svg>
              {!narrow && (
                <div className="mring__agent" ref={agentBox}>
                  <SafeScene>
                    <Agent active={agentInView} />
                  </SafeScene>
                </div>
              )}
            </div>
          </div>

          <p className="mloop__hint">Scroll to run the loop</p>
        </div>

        {/* phones: the agent above the same four steps as a simple list */}
        {narrow && (
          <div className="mlist__agent" ref={agentBox} onClick={onRingClick}>
            <SafeScene>
              <Agent active={agentInView} />
            </SafeScene>
          </div>
        )}
        <ol className="mlist wrap">
          {method.map((m, i) => (
            <li key={m.word}>
              <span className="mlist__n">0{i + 1}</span>
              <h3 className="display">{m.word}</h3>
              <p>{m.body}</p>
              <p className="mlist__tools">{m.tools}</p>
            </li>
          ))}
        </ol>
      </div>

      <div className="wrap">
        <div className="method__stack">
          <div className="method__stack-l">
            <h3 className="method__stack-title display">
              <span data-build="Heading">The stack</span>
              <span className="accent" data-build="Heading">
                behind it.
              </span>
            </h3>
            <div className="method__big" ref={bigWrap} data-build="Metric" data-build-kind="block">
              <span className="display">
                <span ref={big}>0</span>
                <span className="accent">%</span>
              </span>
              <p>
                fewer tokens per run, from context
                <br />
                slicing and async multi-track reasoning
              </p>
            </div>
          </div>
          <dl className="method__skills">
            {skills.map((s) => (
              <div className="skill" key={s.group} data-build="Row" data-build-kind="block">
                <dt>{s.group}</dt>
                <dd>{s.items}</dd>
              </div>
            ))}
          </dl>
        </div>
      </div>

      <div className="strip" aria-hidden="true">
        <div className="strip__track">
          {strip.map((t, i) => (
            <span key={i}>
              {t}
              <b>●</b>
            </span>
          ))}
        </div>
      </div>
    </section>
  )
}
