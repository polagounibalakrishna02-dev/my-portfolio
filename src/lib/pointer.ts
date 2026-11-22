// Shared pointer + scroll velocity, read by the WebGL scenes every frame.
export const pointer = { x: 0, y: 0, cx: 0, cy: 0 } // x/y: normalized -1..1, cx/cy: client px
export const scroll = { velocity: 0 }

if (typeof window !== 'undefined') {
  pointer.cx = window.innerWidth / 2
  pointer.cy = window.innerHeight / 2
  window.addEventListener(
    'pointermove',
    (e) => {
      pointer.cx = e.clientX
      pointer.cy = e.clientY
      pointer.x = (e.clientX / window.innerWidth) * 2 - 1
      pointer.y = -(e.clientY / window.innerHeight) * 2 + 1
    },
    { passive: true },
  )
  let last = window.scrollY
  const tick = () => {
    const y = window.scrollY
    scroll.velocity += (y - last - scroll.velocity) * 0.2
    last = y
    requestAnimationFrame(tick)
  }
  requestAnimationFrame(tick)
}
