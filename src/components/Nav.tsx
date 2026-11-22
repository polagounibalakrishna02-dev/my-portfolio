import { useEffect, useRef, useState } from 'react'
import { profile } from '../data'
import { scrollToTarget } from '../lib/smoothScroll'

const links = [
  { href: '#about', label: 'About' },
  { href: '#experience', label: 'Experience' },
  { href: '#work', label: 'Work' },
  { href: '#method', label: 'Method' },
  { href: '#contact', label: 'Contact' },
]

function useClock() {
  const [time, setTime] = useState('')
  useEffect(() => {
    const fmt = () =>
      setTime(new Intl.DateTimeFormat('en-GB', { hour: '2-digit', minute: '2-digit', timeZone: 'Asia/Kolkata' }).format(new Date()))
    fmt()
    const id = window.setInterval(fmt, 15000)
    return () => clearInterval(id)
  }, [])
  return time
}

export default function Nav() {
  const ref = useRef<HTMLElement>(null)
  const [hidden, setHidden] = useState(false)
  const [open, setOpen] = useState(false)
  const [light, setLight] = useState(false)
  const time = useClock()

  useEffect(() => {
    let last = window.scrollY
    const onScroll = () => {
      const y = window.scrollY
      if (y > 200 && y > last + 4) setHidden(true)
      else if (y < last - 4) setHidden(false)
      last = y
      const max = document.documentElement.scrollHeight - window.innerHeight
      ref.current?.style.setProperty('--p', String(max > 0 ? y / max : 0))
      // switch to dark ink over light sections
      const probe = document.elementsFromPoint(window.innerWidth / 2, 40).find((n) => (n as HTMLElement).dataset?.tone)
      setLight((probe as HTMLElement | undefined)?.dataset.tone === 'light')
    }
    onScroll()
    window.addEventListener('scroll', onScroll, { passive: true })
    return () => window.removeEventListener('scroll', onScroll)
  }, [])

  const go = (e: React.MouseEvent, href: string) => {
    e.preventDefault()
    setOpen(false)
    scrollToTarget(href)
  }

  return (
    <header ref={ref} className={`nav ${hidden && !open ? 'is-hidden' : ''} ${open ? 'is-open' : ''} ${light ? 'is-light' : ''}`}>
      <div className="nav__inner wrap">
        <a href="#home" className="nav__logo" onClick={(e) => go(e, '#home')} aria-label="Back to top" data-build="Logo">
          BK<span className="nav__dot" />
        </a>
        <nav className="nav__links" aria-label="Primary" data-build="Navigation" data-build-kind="block">
          {links.map((l, i) => (
            <a key={l.href} href={l.href} onClick={(e) => go(e, l.href)}>
              <span className="nav__idx">0{i + 1}</span>
              {l.label}
            </a>
          ))}
        </nav>
        <div className="nav__right">
          <span className="nav__time" data-build="Clock">
            <span className="live" /> HYD {time}
          </span>
          <a className="nav__cta" href={`mailto:${profile.email}`} data-build="Button" data-build-kind="block">
            Let's talk <span aria-hidden="true">↗</span>
          </a>
          <button className="nav__burger" aria-label="Menu" aria-expanded={open} onClick={() => setOpen((o) => !o)}>
            <span />
            <span />
          </button>
        </div>
      </div>
      <div className="nav__progress" aria-hidden="true" />
    </header>
  )
}
