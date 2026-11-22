import Lenis from 'lenis'
import { gsap, ScrollTrigger, isTouch, prefersReducedMotion } from './gsap'

let lenis: Lenis | null = null

export function initSmoothScroll() {
  if (lenis || prefersReducedMotion() || isTouch()) return () => {}
  lenis = new Lenis({ lerp: 0.09, wheelMultiplier: 1, smoothWheel: true })
  lenis.on('scroll', ScrollTrigger.update)
  const raf = (time: number) => lenis?.raf(time * 1000)
  gsap.ticker.add(raf)
  gsap.ticker.lagSmoothing(0)
  return () => {
    gsap.ticker.remove(raf)
    lenis?.destroy()
    lenis = null
  }
}

export function scrollToTarget(target: string | number) {
  if (lenis) {
    lenis.scrollTo(target as never, { duration: 1.6, easing: (t: number) => 1 - Math.pow(1 - t, 4) })
    return
  }
  if (typeof target === 'number') window.scrollTo({ top: target, behavior: 'smooth' })
  else document.querySelector(target)?.scrollIntoView({ behavior: 'smooth' })
}

export function lockScroll(locked: boolean) {
  if (locked) {
    lenis?.stop()
    document.documentElement.classList.add('is-locked')
  } else {
    lenis?.start()
    document.documentElement.classList.remove('is-locked')
  }
}
