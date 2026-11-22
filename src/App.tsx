import { useCallback, useEffect } from 'react'
import About from './components/About'
import Boot from './components/Boot'
import BuildLayer from './components/BuildLayer'
import Cases from './components/Cases'
import Contact from './components/Contact'
import Cursor from './components/Cursor'
import Experience from './components/Experience'
import Footer from './components/Footer'
import Hero from './components/Hero'
import Method from './components/Method'
import Nav from './components/Nav'
import Viewer from './components/Viewer'
import Work from './components/Work'
import { ScrollTrigger } from './lib/gsap'
import { initSmoothScroll, lockScroll } from './lib/smoothScroll'

export default function App() {
  useEffect(() => {
    const cleanup = initSmoothScroll()
    lockScroll(true)
    return cleanup
  }, [])

  const onBooted = useCallback(() => {
    lockScroll(false)
    requestAnimationFrame(() => ScrollTrigger.refresh())
  }, [])

  return (
    <>
      <div className="grain" aria-hidden="true" />
      <Boot onDone={onBooted} />
      <BuildLayer />
      <Cursor />
      <Nav />
      <main>
        <Hero />
        <About />
        <Experience />
        <Work />
        <Cases />
        <Method />
        <Contact />
      </main>
      <Footer />
      <Viewer />
    </>
  )
}
