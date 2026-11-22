import { useEffect, useRef } from 'react'
import { gsap, isTouch } from '../lib/gsap'

// Dot + lagging ring. Elements with data-cursor="Label" grow the ring and show the label.
export default function Cursor() {
  const dot = useRef<HTMLDivElement>(null)
  const ring = useRef<HTMLDivElement>(null)
  const label = useRef<HTMLSpanElement>(null)

  useEffect(() => {
    if (isTouch()) return
    document.documentElement.classList.add('has-cursor')
    const xDot = gsap.quickTo(dot.current, 'x', { duration: 0.08, ease: 'power3' })
    const yDot = gsap.quickTo(dot.current, 'y', { duration: 0.08, ease: 'power3' })
    const xRing = gsap.quickTo(ring.current, 'x', { duration: 0.45, ease: 'power3' })
    const yRing = gsap.quickTo(ring.current, 'y', { duration: 0.45, ease: 'power3' })

    // stay invisible until the pointer actually moves (otherwise it parks at 0,0)
    gsap.set([dot.current, ring.current], { opacity: 0 })
    let seen = false
    const move = (e: PointerEvent) => {
      if (!seen) {
        seen = true
        gsap.set([dot.current, ring.current], { x: e.clientX, y: e.clientY })
        gsap.to([dot.current, ring.current], { opacity: 1, duration: 0.3 })
      }
      xDot(e.clientX)
      yDot(e.clientY)
      xRing(e.clientX)
      yRing(e.clientY)
    }
    const over = (e: PointerEvent) => {
      const el = (e.target as HTMLElement).closest<HTMLElement>('[data-cursor], a, button')
      const r = ring.current!
      if (!el) {
        r.classList.remove('is-hover', 'is-label')
        return
      }
      const text = el.dataset.cursor
      if (text) {
        label.current!.textContent = text
        r.classList.add('is-label')
        r.classList.remove('is-hover')
      } else {
        r.classList.add('is-hover')
        r.classList.remove('is-label')
      }
    }
    const down = () => ring.current?.classList.add('is-down')
    const up = () => ring.current?.classList.remove('is-down')
    const leave = () => gsap.to([dot.current, ring.current], { opacity: 0, duration: 0.2 })
    const enter = () => gsap.to([dot.current, ring.current], { opacity: 1, duration: 0.2 })

    window.addEventListener('pointermove', move, { passive: true })
    window.addEventListener('pointerover', over, { passive: true })
    window.addEventListener('pointerdown', down)
    window.addEventListener('pointerup', up)
    document.addEventListener('pointerleave', leave)
    document.addEventListener('pointerenter', enter)
    return () => {
      document.documentElement.classList.remove('has-cursor')
      window.removeEventListener('pointermove', move)
      window.removeEventListener('pointerover', over)
      window.removeEventListener('pointerdown', down)
      window.removeEventListener('pointerup', up)
      document.removeEventListener('pointerleave', leave)
      document.removeEventListener('pointerenter', enter)
    }
  }, [])

  return (
    <>
      <div className="cursor-dot" ref={dot} aria-hidden="true" />
      <div className="cursor-ring" ref={ring} aria-hidden="true">
        <span ref={label} className="cursor-label mono" />
      </div>
    </>
  )
}
