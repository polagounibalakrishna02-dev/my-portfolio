import { Component, ReactNode, Suspense } from 'react'

/** Keeps a failed WebGL scene (no GPU, missing texture…) from taking the page down with it. */
class Boundary extends Component<{ children: ReactNode }, { failed: boolean }> {
  state = { failed: false }
  static getDerivedStateFromError() {
    return { failed: true }
  }
  componentDidCatch(err: unknown) {
    console.warn('[scene] disabled:', err)
  }
  render() {
    return this.state.failed ? null : this.props.children
  }
}

export default function SafeScene({ children }: { children: ReactNode }) {
  return (
    <Boundary>
      <Suspense fallback={null}>{children}</Suspense>
    </Boundary>
  )
}
