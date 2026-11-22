import { useEffect, useRef, useState } from 'react'
import { gsap } from '../lib/gsap'
import { hdSrc, hdSrcSet } from '../lib/hd'
import { lockScroll } from '../lib/smoothScroll'

type Shot = { base: string; title: string; sub: string }

/**
 * Full-screen HD viewer for the project screens. Fit-to-screen by default; click the image for
 * 1:1 "actual size" (the 3200px capture at 2×), then drag/scroll to pan. Esc or the backdrop closes it.
 */
export default function Viewer() {
  const [shot, setShot] = useState<Shot | null>(null)
  const [zoom, setZoom] = useState(false)
  const root = useRef<HTMLDivElement>(null)
  const pane = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const open = (e: Event) => {
      setZoom(false)
      setShot((e as CustomEvent<Shot>).detail)
    }
    window.addEventListener('viewer:open', open)
    return () => window.removeEventListener('viewer:open', open)
  }, [])

  useEffect(() => {
    if (!shot) return
    lockScroll(true)
    gsap.fromTo(root.current, { opacity: 0 }, { opacity: 1, duration: 0.3, ease: 'power2.out' })
    gsap.fromTo(root.current!.querySelector('.viewer__frame'), { y: 30, scale: 0.97 }, { y: 0, scale: 1, duration: 0.6, ease: 'expo.out' })
    const key = (e: KeyboardEvent) => e.key === 'Escape' && close()
    window.addEventListener('keydown', key)
    return () => {
      window.removeEventListener('keydown', key)
      lockScroll(false)
    }
  }, [shot])

  // drag to pan when zoomed
  useEffect(() => {
    const el = pane.current
    if (!el || !zoom) return
    let down = false
    let x = 0
    let y = 0
    const d = (e: PointerEvent) => {
      down = true
      x = e.clientX
      y = e.clientY
    }
    const m = (e: PointerEvent) => {
      if (!down) return
      el.scrollLeft -= e.clientX - x
      el.scrollTop -= e.clientY - y
      x = e.clientX
      y = e.clientY
    }
    const u = () => (down = false)
    el.addEventListener('pointerdown', d)
    window.addEventListener('pointermove', m)
    window.addEventListener('pointerup', u)
    return () => {
      el.removeEventListener('pointerdown', d)
      window.removeEventListener('pointermove', m)
      window.removeEventListener('pointerup', u)
    }
  }, [zoom])

  const close = () => {
    gsap.to(root.current, { opacity: 0, duration: 0.25, onComplete: () => setShot(null) })
  }

  if (!shot) return null

  return (
    <div className="viewer" ref={root} role="dialog" aria-modal="true" aria-label={`${shot.title} — full screen`} data-lenis-prevent>
      <div className="viewer__backdrop" onClick={close} />
      <header className="viewer__bar">
        <div>
          <p className="viewer__title">{shot.title}</p>
          <p className="viewer__sub">{shot.sub}</p>
        </div>
        <div className="viewer__actions">
          <button className="viewer__btn" onClick={() => setZoom((z) => !z)}>
            {zoom ? 'Fit to screen' : 'Actual size'}
          </button>
          <button className="viewer__btn viewer__btn--close" onClick={close} aria-label="Close">
            Close · Esc
          </button>
        </div>
      </header>
      <div className={`viewer__pane ${zoom ? 'is-zoom' : ''}`} ref={pane}>
        <figure className="viewer__frame" onClick={() => !zoom && setZoom(true)} data-cursor={zoom ? 'Drag' : 'Zoom'}>
          <img
            src={hdSrc(shot.base, zoom ? 3200 : 2600)}
            srcSet={zoom ? undefined : hdSrcSet(shot.base)}
            sizes="92vw"
            alt={`${shot.title} — product screen`}
            draggable={false}
          />
        </figure>
      </div>
    </div>
  )
}
