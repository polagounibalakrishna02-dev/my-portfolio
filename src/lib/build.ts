import { agents as agentDefs } from '../data'
import { gsap, SplitText, isTouch, prefersReducedMotion } from './gsap'

/**
 * The build engine.
 * Every element with [data-build="Name"] starts hidden. When it scrolls into view, a free agent
 * flies to it, drags out a measured wireframe box, then types / places / renders the content in.
 * The measured wireframes exist only while a section is being built, then they disappear.
 *
 * Optional: data-build-kind="text|block|media" (inferred otherwise).
 */

type Kind = 'text' | 'block' | 'media'

type Agent = {
  name: string
  color: string
  node: HTMLDivElement
  sub: HTMLSpanElement
  x: number
  y: number
  busy: boolean
  parked: boolean
  idleSince: number
  attach: Box | null
}

type Box = {
  el: HTMLElement
  node: HTMLDivElement
  tag: HTMLElement
  name: string
  p: number
  alive: boolean
}

const ACTIONS: Record<Kind, string[]> = {
  text: ['typing…', 'typesetting', 'writing copy'],
  block: ['placing', 'aligning', 'laying out'],
  media: ['rendering', 'retrieving asset', 'grounding'],
}

const pick = <T,>(a: T[]) => a[Math.floor(Math.random() * a.length)]
const rand = (a: number, b: number) => a + Math.random() * (b - a)
const wait = (ms: number) => new Promise<void>((r) => window.setTimeout(r, ms))

function inferKind(el: HTMLElement): Kind {
  const k = el.dataset.buildKind as Kind | undefined
  if (k) return k
  if (el.matches('img, canvas, picture, video, figure')) return 'media'
  const blockChild = Array.from(el.children).some((c) => !c.matches('span, em, strong, b, i, br, a'))
  return blockChild ? 'block' : 'text'
}

class Builder {
  private layer: HTMLDivElement | null = null
  private agents: Agent[] = []
  private queue: HTMLElement[] = []
  private boxes: Box[] = []
  private started = false
  private withAgents = true
  private instant = false
  private io: IntersectionObserver | null = null
  private lastStart = 0

  mount(layer: HTMLDivElement) {
    if (this.layer) return
    this.layer = layer
    this.instant = prefersReducedMotion()
    this.withAgents = !this.instant && !isTouch() && window.innerWidth >= 900

    if (this.withAgents) {
      this.agents = agentDefs.map((a) => {
        const node = document.createElement('div')
        node.className = 'agent'
        node.style.setProperty('--c', a.color)
        node.innerHTML = `
          <svg width="18" height="20" viewBox="0 0 18 20" aria-hidden="true"><path d="M1.5 1.5 L16 9.2 L9.4 10.6 L6.4 17.6 Z" fill="${a.color}" stroke="#08080a" stroke-width="1.4" stroke-linejoin="round"/></svg>
          <span class="agent__chip"><svg width="11" height="11" viewBox="0 0 10 10" aria-hidden="true"><rect x="1" y="2.6" width="8" height="6" rx="1.8" fill="currentColor"/><circle cx="3.6" cy="5.6" r=".9" fill="${a.color}"/><circle cx="6.4" cy="5.6" r=".9" fill="${a.color}"/><rect x="4.5" y=".6" width="1" height="2" fill="currentColor"/></svg>${a.name}</span>
          <span class="agent__sub"></span>`
        layer.appendChild(node)
        return {
          name: a.name,
          color: a.color,
          node,
          sub: node.querySelector('.agent__sub') as HTMLSpanElement,
          x: window.innerWidth / 2,
          y: window.innerHeight / 2,
          busy: false,
          parked: false,
          idleSince: 0,
          attach: null,
        }
      })
    }

    this.io = new IntersectionObserver(this.onIntersect, { rootMargin: '0px 0px -2% 0px', threshold: 0.01 })
    this.observeAll()
    gsap.ticker.add(this.tick)
  }

  observeAll() {
    document.querySelectorAll<HTMLElement>('[data-build]:not(.is-built)').forEach((el) => this.io?.observe(el))
  }

  /** Agents appear at (x, y) and burst outwards, then building starts. */
  async boot(x = window.innerWidth / 2, y = window.innerHeight / 2) {
    if (this.started) return
    if (this.withAgents) {
      this.agents.forEach((a) => {
        a.x = x + rand(-20, 20)
        a.y = y + rand(-10, 10)
      })
      gsap.to(
        this.agents.map((a) => a.node),
        { autoAlpha: 1, duration: 0.3, stagger: 0.05 },
      )
      await Promise.all(
        this.agents.map((a, i) => {
          const ang = (i / this.agents.length) * Math.PI * 2 + rand(-0.3, 0.3)
          const r = rand(160, Math.min(window.innerWidth, window.innerHeight) * 0.42)
          return gsap
            .to(a, {
              x: x + Math.cos(ang) * r * 1.4,
              y: y + Math.sin(ang) * r,
              duration: 0.75,
              delay: i * 0.04,
              ease: 'expo.out',
            })
            .then()
        }),
      )
      this.agents.forEach((a) => (a.idleSince = performance.now()))
    }
    this.started = true
    window.dispatchEvent(new CustomEvent('builder:boot'))
    this.pump()
  }

  /** Reveal an element right now (no agent), e.g. when it was scrolled past. */
  revealNow(el: HTMLElement) {
    if (el.classList.contains('is-built')) return
    this.io?.unobserve(el)
    el.classList.add('is-built')
    el.dispatchEvent(new CustomEvent('built'))
  }

  private onIntersect = (entries: IntersectionObserverEntry[]) => {
    const els = entries.filter((e) => e.isIntersecting).map((e) => e.target as HTMLElement)
    els.sort((a, b) => (a.compareDocumentPosition(b) & Node.DOCUMENT_POSITION_FOLLOWING ? -1 : 1))
    els.forEach((el) => {
      this.io?.unobserve(el)
      if (this.instant) this.revealNow(el)
      else this.queue.push(el)
    })
    this.pump()
  }

  private pump() {
    if (!this.started) return
    while (this.queue.length) {
      const el = this.queue[0]
      if (!this.withAgents) {
        this.queue.shift()
        const now = performance.now()
        const delay = Math.max(0, this.lastStart + 70 - now)
        this.lastStart = now + delay
        window.setTimeout(() => this.reveal(el, inferKind(el)), delay)
        continue
      }
      const free = this.agents.filter((a) => !a.busy)
      if (!free.length) return
      const r = el.getBoundingClientRect()
      free.sort((a, b) => Math.hypot(a.x - r.left, a.y - r.top) - Math.hypot(b.x - r.left, b.y - r.top))
      const agent = free[0]
      this.queue.shift()
      agent.busy = true
      const now = performance.now()
      const delay = Math.max(0, this.lastStart + 110 - now)
      this.lastStart = now + delay
      window.setTimeout(() => this.run(agent, el), delay)
    }
  }

  private async run(agent: Agent, el: HTMLElement) {
    const kind = inferKind(el)
    let r = el.getBoundingClientRect()
    const offscreen = r.bottom < -40 || r.top > window.innerHeight + 40
    if (offscreen || el.classList.contains('is-built')) {
      this.revealNow(el)
      this.release(agent)
      return
    }
    if (agent.parked) {
      // come back on screen near the job, from the closest edge
      const fromRight = r.left > window.innerWidth / 2
      agent.x = fromRight ? window.innerWidth + 30 : -30
      agent.y = r.top + rand(-60, 60)
      gsap.killTweensOf(agent.node)
      gsap.to(agent.node, { autoAlpha: 1, duration: 0.25 })
    }
    agent.parked = false
    agent.node.classList.remove('is-parked')

    // 1 · fly to the element's top-left corner (tracks the element while scrolling)
    const sx = agent.x
    const sy = agent.y
    const fly = { t: 0 }
    await gsap
      .to(fly, {
        t: 1,
        duration: rand(0.42, 0.62),
        ease: 'power3.inOut',
        onUpdate: () => {
          r = el.getBoundingClientRect()
          agent.x = sx + (r.left - 4 - sx) * fly.t
          agent.y = sy + (r.top - 4 - sy) * fly.t
        },
      })
      .then()

    // 2 · drag out the wireframe
    const box = this.createBox(el)
    agent.attach = box
    await gsap.to(box, { p: 1, duration: 0.42, ease: 'power2.out' }).then()

    // 3 · build the content
    agent.sub.textContent = `${pick(ACTIONS[kind])}`
    gsap.to(agent.sub, { autoAlpha: 1, duration: 0.15 })
    await this.reveal(el, kind)

    // 4 · let go
    gsap.to(agent.sub, { autoAlpha: 0, duration: 0.2 })
    agent.attach = null
    await wait(140)
    this.killBox(box)
    this.release(agent)
  }

  private release(agent: Agent) {
    agent.busy = false
    agent.idleSince = performance.now()
    this.pump()
  }

  private createBox(el: HTMLElement): Box {
    const node = document.createElement('div')
    node.className = 'wire'
    node.innerHTML = '<i></i><i></i><i></i><i></i><b class="wire__tag"></b>'
    this.layer!.appendChild(node)
    const box: Box = { el, node, tag: node.querySelector('b')!, name: el.dataset.build || 'Frame', p: 0, alive: true }
    this.boxes.push(box)
    return box
  }

  private killBox(box: Box) {
    gsap.to(box.node, {
      opacity: 0,
      duration: 0.35,
      onComplete: () => {
        box.alive = false
        box.node.remove()
        this.boxes = this.boxes.filter((b) => b !== box)
      },
    })
  }

  reveal(el: HTMLElement, kind: Kind): Promise<void> {
    return new Promise((resolve) => {
      if (el.classList.contains('is-built')) return resolve()
      el.classList.add('is-built')
      el.dispatchEvent(new CustomEvent('built'))
      const done = () => resolve()

      if (kind === 'text') {
        const split = SplitText.create(el, { type: 'words,chars' })
        const n = split.chars.length || 1
        const per = gsap.utils.clamp(0.006, 0.032, 0.85 / n)
        gsap.set(split.chars, { opacity: 0 })
        gsap.to(split.chars, {
          opacity: 1,
          duration: 0.01,
          stagger: per,
          ease: 'none',
          onComplete: () => {
            split.revert()
            done()
          },
        })
        return
      }
      if (kind === 'media') {
        gsap
          .timeline({ onComplete: done })
          .fromTo(
            el,
            { clipPath: 'inset(0% 0% 100% 0%)', filter: 'grayscale(1) brightness(0.55) sepia(1) hue-rotate(170deg) saturate(2.2)' },
            { clipPath: 'inset(0% 0% 0% 0%)', duration: 0.75, ease: 'power3.inOut' },
          )
          .to(el, { filter: 'grayscale(0) brightness(1) sepia(0) hue-rotate(0deg) saturate(1)', duration: 0.7, ease: 'power2.out' })
          .set(el, { clearProps: 'clipPath,filter' })
        return
      }
      gsap.fromTo(
        el,
        { clipPath: 'inset(0% 100% 0% 0%)' },
        { clipPath: 'inset(0% 0% 0% 0%)', duration: 0.6, ease: 'power3.inOut', clearProps: 'clipPath', onComplete: done },
      )
    })
  }

  private tick = () => {
    const now = performance.now()

    // wire boxes follow their elements while scrolling
    for (const b of this.boxes) {
      if (!b.alive) continue
      const r = b.el.getBoundingClientRect()
      const w = (r.width + 8) * b.p
      const h = (r.height + 8) * b.p
      b.node.style.transform = `translate3d(${r.left - 4}px, ${r.top - 4}px, 0)`
      b.node.style.width = `${w}px`
      b.node.style.height = `${h}px`
      b.tag.textContent = `${b.name}  ${Math.round(r.width)} × ${Math.round(r.height)}`
    }

    for (const a of this.agents) {
      if (a.attach) {
        const r = a.attach.el.getBoundingClientRect()
        const p = a.attach.p
        a.x = r.left - 4 + (r.width + 8) * p
        a.y = r.top - 4 + (r.height + 8) * p
      } else if (!a.busy && this.started && !a.parked && now - a.idleSince > 1600) {
        // job done: step aside and fade out so the copy stays readable
        a.parked = true
        a.node.classList.add('is-parked')
        gsap.to(a, { x: a.x + rand(30, 70), y: a.y + rand(20, 50), duration: 0.9, ease: 'power2.out' })
        gsap.to(a.node, { autoAlpha: 0, duration: 0.6, delay: 0.3 })
      }
      a.node.style.transform = `translate3d(${a.x}px, ${a.y}px, 0)`
    }
  }
}

export const builder = new Builder()
