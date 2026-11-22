import { useEffect, useRef, useState } from 'react'
import { profile } from '../data'
import { gsap, isTouch, useGSAP } from '../lib/gsap'
import { scroll } from '../lib/pointer'
import { scrollToTarget } from '../lib/smoothScroll'
import Magnetic from './Magnetic'

const WORD = 'BALAKRISHNA.'

function useSeconds() {
  const [t, setT] = useState('')
  useEffect(() => {
    const f = new Intl.DateTimeFormat('en-GB', { hour: '2-digit', minute: '2-digit', second: '2-digit', timeZone: 'Asia/Kolkata' })
    const tick = () => setT(f.format(new Date()))
    tick()
    const id = window.setInterval(tick, 1000)
    return () => clearInterval(id)
  }, [])
  return t
}

export default function Footer() {
  const root = useRef<HTMLElement>(null)
  const time = useSeconds()

  // marquee: drifts on its own, speeds up and reverses with your scroll
  useEffect(() => {
    const track = root.current?.querySelector<HTMLElement>('.fmarq__track')
    if (!track) return
    let x = 0
    let dir = -1
    const tick = (_t: number, dt: number) => {
      const v = scroll.velocity
      if (Math.abs(v) > 0.5) dir = v > 0 ? -1 : 1
      x += dir * (0.05 + Math.min(Math.abs(v) * 0.02, 1.2)) * dt
      const w = track.scrollWidth / 2
      x = ((x % w) - w) % w
      track.style.transform = `translate3d(${x}px,0,0)`
    }
    gsap.ticker.add(tick)
    return () => gsap.ticker.remove(tick)
  }, [])

  // wordmark: letters rise in, then stretch in a wave that follows the cursor
  useGSAP(
    () => {
      const letters = gsap.utils.toArray<HTMLElement>('.fword__l')
      gsap.from(letters, {
        yPercent: 105,
        stagger: 0.045,
        duration: 1.2,
        ease: 'expo.out',
        scrollTrigger: { trigger: '.fword', start: 'top 92%' },
      })
      if (isTouch()) return
      const sy = letters.map((l) => gsap.quickTo(l, 'scaleY', { duration: 0.6, ease: 'power3' }))
      const k = letters.map((l) => gsap.quickTo(l, '--k', { duration: 0.5, ease: 'power3' }))
      const word = root.current!.querySelector<HTMLElement>('.fword')!
      const move = (e: PointerEvent) => {
        letters.forEach((l, i) => {
          const r = l.getBoundingClientRect()
          const d = (r.left + r.width / 2 - e.clientX) / (window.innerWidth * 0.09)
          const inf = Math.exp(-d * d)
          sy[i](1 + inf * 0.32)
          k[i](inf)
        })
      }
      const leave = () => {
        sy.forEach((f) => f(1))
        k.forEach((f) => f(0))
      }
      word.addEventListener('pointermove', move)
      word.addEventListener('pointerleave', leave)
      return () => {
        word.removeEventListener('pointermove', move)
        word.removeEventListener('pointerleave', leave)
      }
    },
    { scope: root },
  )

  const marquee = 'Open to AI engineering roles ✦ Let’s build something intelligent ✦ '

  return (
    <footer className="footer" ref={root}>
      <div className="fmarq" aria-hidden="true">
        <div className="fmarq__track display">
          <span>{marquee.repeat(3)}</span>
          <span>{marquee.repeat(3)}</span>
        </div>
      </div>

      <div className="footer__grid wrap">
        <div className="footer__brand">
          <p className="footer__logo display">
            BK<span className="accent">.</span>
          </p>
          <p className="footer__sign">AI engineer &amp; full-stack developer, building enterprise AI from Hyderabad.</p>
        </div>
        <div className="footer__col footer__time">
          <p className="footer__k">Local time</p>
          <p className="footer__clock">
            <span className="live" /> {time} <small>IST</small>
          </p>
          <Magnetic strength={0.4}>
            <button className="footer__up" onClick={() => scrollToTarget(0)} aria-label="Back to top">
              <span aria-hidden="true">↑</span>
            </button>
          </Magnetic>
        </div>
      </div>

      <div className="fword display" aria-label="Balakrishna">
        {WORD.split('').map((c, i) => (
          <span className="fword__m" key={i} aria-hidden="true">
            <span className={`fword__l ${c === '.' ? 'is-dot' : ''}`}>{c}</span>
          </span>
        ))}
      </div>

      <div className="footer__meta wrap">
        <span>
          © 2026 {profile.first} {profile.last}
        </span>
        <span>Designed &amp; engineered in {profile.location} · built live by six agents</span>
      </div>
    </footer>
  )
}
