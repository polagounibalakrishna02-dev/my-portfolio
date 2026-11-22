import { useEffect, useRef } from 'react'
import { builder } from '../lib/build'

/** Fixed overlay that hosts the agent cursors, wireframe boxes and the hover inspector. */
export default function BuildLayer() {
  const ref = useRef<HTMLDivElement>(null)
  useEffect(() => {
    if (ref.current) builder.mount(ref.current)
  }, [])
  return <div className="build-layer" ref={ref} aria-hidden="true" />
}
