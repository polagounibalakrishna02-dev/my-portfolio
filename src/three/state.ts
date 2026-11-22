// Tiny shared state so the DOM can drive the (lazy-loaded) WebGL scenes without importing three.js.

/** Hero portrait: assemble (0 static → 1 portrait), scatter (0..1, driven by scroll). */
export const portrait = { assemble: 0, scatter: 0 }

/** Work carousel: offset in card steps, driven by scroll + drag. */
export const ribbon = { offset: 0, target: 0 }

/**
 * "The agent" in the How-I-build ring.
 * progress 0..1 round the loop, step 0..3, scan = build-in height, hover/px/py = cursor over the ring, poke = clicked.
 */
export const agent = { progress: 0, step: 0, scan: -3.4, hover: false, px: 0, py: 0, poke: 0 }
