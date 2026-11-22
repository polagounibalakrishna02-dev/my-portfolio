import { useRef } from 'react'
import { builder } from '../lib/build'
import { gsap, prefersReducedMotion, useGSAP } from '../lib/gsap'

const NAME = 'BALAKRISHNA'
const NEXT = 'AI ENGINEER' // same length — every letter has a partner
const I_INDEX = NAME.indexOf('I')

/**
 * Loader: a dot drops and bounces under a spotlight, the "I" falls on it to make a "!",
 * then stretches into the I of BALAKRISHNA while the dot rolls to the end as the full stop.
 * The letters tumble in, the name scrambles into AI ENGINEER and flies into the hero.
 */
export default function Boot({ onDone }: { onDone: () => void }) {
  const root = useRef<HTMLDivElement>(null)

  useGSAP(
    () => {
      const el = root.current!
      const heroWord = document.querySelector<HTMLElement>('.hero__back-word')
      const finish = () => {
        if (heroWord) gsap.set(heroWord, { clipPath: 'none' })
        gsap.set(el, { display: 'none' })
        onDone()
        builder.boot(window.innerWidth / 2, window.innerHeight * 0.7)
      }

      const start = () => {
        if (prefersReducedMotion()) return finish()

        const stage = el.querySelector<HTMLElement>('.boot__stage')!
        const letters = gsap.utils.toArray<HTMLElement>('.bl', el)
        const I = letters[I_INDEX]
        const dot = el.querySelector<HTMLElement>('.boot__dot')!
        const light = el.querySelector<HTMLElement>('.boot__light')!
        const probe = el.querySelector<HTMLElement>('.boot__probe')!
        const word = el.querySelector<HTMLElement>('.boot__word')!

        // geometry (relative to the stage)
        const sr = stage.getBoundingClientRect()
        const ir = I.getBoundingClientRect()
        const F = parseFloat(getComputedStyle(word).fontSize)
        const baseline = probe.getBoundingClientRect().top - sr.top
        const capTop = baseline - F * 0.72
        const ix = ir.left - sr.left + ir.width / 2
        const dotD = F * 0.17
        const last = letters[letters.length - 1].getBoundingClientRect()
        const endX = last.right - sr.left + F * 0.1 + dotD / 2
        const dotY = baseline - dotD / 2

        gsap.set(dot, { width: dotD, height: dotD, x: ix - dotD / 2, y: -window.innerHeight * 0.6, opacity: 1 })
        gsap.set(light, { x: ix, y: dotY })
        gsap.set(letters, { opacity: 0 })
        gsap.set(I, { opacity: 1, scaleY: 0.66, transformOrigin: `50% ${((capTop - (ir.top - sr.top)) / ir.height) * 100}%`, y: -window.innerHeight * 0.55 })

        const tl = gsap.timeline()
        // 1 · the dot drops and bounces, the light follows it
        tl.to(dot, { y: dotY - dotD / 2, duration: 0.85, ease: 'bounce.out' }, 0.15)
          .to(light, { opacity: 0.55, duration: 0.6 }, 0.2)
          .to(dot, { scaleX: 1.3, scaleY: 0.72, duration: 0.07, yoyo: true, repeat: 1, transformOrigin: '50% 100%' }, 0.42)
          .to(light, { opacity: 1, scale: 1.25, duration: 0.5 }, 0.95)
          // 2 · the I falls onto it: "!"
          .to(I, { y: 0, duration: 0.5, ease: 'back.out(1.5)' }, 1.15)
          .to({}, { duration: 0.35 })
          // 3 · the I stretches to full height, the dot rolls to the end and turns into the full stop
          .to(I, { scaleY: 1, duration: 0.42, ease: 'power3.inOut' }, 2.0)
          .to(dot, { x: endX - dotD / 2, duration: 0.7, ease: 'power3.inOut' }, 2.0)
          .to(dot, { keyframes: [{ y: dotY - dotD / 2 - F * 0.35, duration: 0.35, ease: 'power2.out' }, { y: dotY - dotD / 2, duration: 0.35, ease: 'bounce.out' }] }, 2.0)
          .to(dot, { backgroundColor: '#ff4d1a', boxShadow: '0 0 26px rgba(255,77,26,0.9)', duration: 0.4 }, 2.3)
          .to(light, { x: (sr.width / 2), duration: 0.8, ease: 'power2.inOut' }, 2.0)

        // 4 · the rest of the name tumbles in, outward from the I
        const left = letters.slice(0, I_INDEX).reverse()
        const right = letters.slice(I_INDEX + 1)
        tl.fromTo(left, { opacity: 0, rotateY: -110, x: -F * 0.4, z: -F }, { opacity: 1, rotateY: 0, x: 0, z: 0, duration: 0.62, stagger: 0.07, ease: 'back.out(1.4)' }, 2.1)
          .fromTo(right, { opacity: 0, rotateX: 110, y: -F * 0.6, z: -F }, { opacity: 1, rotateX: 0, y: 0, z: 0, duration: 0.62, stagger: 0.08, ease: 'back.out(1.4)' }, 2.2)
          .to({}, { duration: 0.55 })

        // 5 · scramble, letter by letter, into AI ENGINEER — each letter changes into the hero typeface
        //     as it flips; its neighbours glide to their new places (FLIP) instead of jumping
        const t0 = 3.55
        letters.forEach((l, i) => {
          const at = t0 + i * 0.07
          tl.to(l, { rotateX: 90, duration: 0.1, ease: 'power1.in' }, at)
            .call(() => {
              const before = letters.map((n) => n.getBoundingClientRect().left)
              l.textContent = NEXT[i] === ' ' ? ' ' : NEXT[i]
              l.classList.add('is-next')
              letters.forEach((n, j) => {
                if (n === l) return
                const dx = before[j] - n.getBoundingClientRect().left
                if (Math.abs(dx) > 0.5) gsap.fromTo(n, { x: `+=${dx}` }, { x: 0, duration: 0.45, ease: 'power3.out', overwrite: 'auto' })
              })
            }, [], at + 0.1)
            .fromTo(l, { rotateX: -90 }, { rotateX: 0, duration: 0.16, ease: 'power1.out', immediateRender: false }, at + 0.1)
        })
        tl.to(dot, { scale: 0, opacity: 0, duration: 0.3 }, t0)

        // 6 · the same word flies to its place in the hero and becomes the giant word
        const t1 = t0 + letters.length * 0.07 + 0.6
        tl.add(() => {
          if (!heroWord) return
          const a = word.getBoundingClientRect()
          const b = heroWord.getBoundingClientRect()
          gsap.to(word, {
            x: b.left + b.width / 2 - (a.left + a.width / 2),
            y: b.top + b.height / 2 - (a.top + a.height / 2),
            scale: b.width / a.width,
            transformOrigin: '50% 50%',
            duration: 1.1,
            ease: 'expo.inOut',
          })
        }, t1)
          .to(light, { opacity: 0, duration: 0.6 }, t1)
          .to(el, { backgroundColor: 'rgba(5,6,10,0)', duration: 0.9, ease: 'power2.inOut' }, t1 + 0.15)
          .call(finish, [], t1 + 1.12)
      }

      if (document.fonts) document.fonts.ready.then(start)
      else start()
    },
    { scope: root },
  )

  return (
    <div className="boot" ref={root} aria-hidden="true">
      <div className="boot__stage">
        <span className="boot__light" />
        <div className="boot__word">
          {NAME.split('').map((c, i) => (
            <span className="bl" key={i}>
              {c}
            </span>
          ))}
          <span className="boot__probe" />
        </div>
        <span className="boot__dot" />
      </div>
    </div>
  )
}
