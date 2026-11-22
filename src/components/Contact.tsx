import { lazy, useRef, useState } from 'react'
import { profile } from '../data'
import { useInView } from '../lib/useInView'
import Label from './Label'
import SafeScene from './SafeScene'
import Magnetic from './Magnetic'

const Cube = lazy(() => import('../three/Cube'))

export default function Contact() {
  const root = useRef<HTMLElement>(null)
  const bot = useRef<HTMLDivElement>(null)
  const inView = useInView(bot)
  const [copied, setCopied] = useState(false)

  const copy = async () => {
    try {
      await navigator.clipboard.writeText(profile.email)
      setCopied(true)
      window.setTimeout(() => setCopied(false), 1800)
    } catch {
      window.location.href = `mailto:${profile.email}`
    }
  }

  return (
    <section id="contact" className="contact" ref={root}>
      <div className="contact__grid wrap">
        <div className="contact__main">
          <Label index="06">Contact</Label>
          <h2 className="contact__title display">
            <span data-build="Heading">Let's build</span>
            <span className="amber" data-build="Heading">
              something
            </span>
            <span className="amber" data-build="Heading">
              intelligent.
            </span>
          </h2>
          <p className="contact__lead" data-build="Paragraph">
            Open to AI engineering roles, agentic-platform work and interesting problems. Tell me what you're building.
          </p>
          <div className="contact__mail" data-build="Email" data-build-kind="block">
            <span className="contact__k">Say hello</span>
            <a href={`mailto:${profile.email}`} className="contact__email" data-cursor="Write">
              {profile.email}
              <span aria-hidden="true">→</span>
            </a>
            <button className="contact__copy" onClick={copy}>
              {copied ? 'Copied ✓' : 'Copy address'}
            </button>
          </div>
          <div className="contact__pills" data-build="Links" data-build-kind="block">
            <Magnetic>
              <a className="pill" href={profile.linkedin} target="_blank" rel="noreferrer">
                LinkedIn ↗
              </a>
            </Magnetic>
            <Magnetic>
              <a className="pill" href={profile.github} target="_blank" rel="noreferrer">
                GitHub ↗
              </a>
            </Magnetic>
            <Magnetic>
              <a className="pill pill--solid" href={`mailto:${profile.email}?subject=Let's%20build%20something`}>
                Start a project
              </a>
            </Magnetic>
          </div>
        </div>

        <div className="contact__bot" ref={bot} data-cursor="Boop">
          <p className="contact__bot-label">
            <span className="accent">●</span> Still curious — always looking for the next thing
          </p>
          <div className="contact__bot-canvas">
            <SafeScene>
              <Cube active={inView} host={bot} />
            </SafeScene>
          </div>
        </div>
      </div>
    </section>
  )
}
