import gsap from 'gsap'
import { ScrollTrigger } from 'gsap/ScrollTrigger'
import { SplitText } from 'gsap/SplitText'
import { useGSAP } from '@gsap/react'

gsap.registerPlugin(ScrollTrigger, SplitText, useGSAP)

export { gsap, ScrollTrigger, SplitText, useGSAP }

export const prefersReducedMotion = () =>
  typeof window !== 'undefined' && window.matchMedia('(prefers-reduced-motion: reduce)').matches

/**
 * Snap a pinned section to one of `count` evenly spaced stops. It snaps in the scroll direction, but
 * only once you have moved past a small dead zone, so a nudge on arrival never skips a stop.
 */
export const stepSnap =
  (count: number, deadZone = 0.14) =>
  (value: number, self?: ScrollTrigger) => {
    const steps = count - 1
    const i = gsap.utils.clamp(0, steps, value * steps)
    const base = Math.floor(i)
    const frac = i - base
    const dir = self?.direction ?? 1
    const to = dir >= 0 ? (frac > deadZone ? base + 1 : base) : frac < 1 - deadZone ? base : base + 1
    return Math.min(steps, to) / steps
  }

export const isTouch = () => typeof window !== 'undefined' && window.matchMedia('(pointer: coarse)').matches
