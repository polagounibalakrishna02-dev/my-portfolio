import { Canvas, useFrame, useThree } from '@react-three/fiber'
import { useEffect, useMemo, useRef, useState } from 'react'
import * as THREE from 'three'
import { pointer } from '../lib/pointer'
import { portrait } from './state'

/**
 * The hero portrait, drawn with particles sampled from the photo's luminance.
 * portrait.assemble: 0 = twinkling static across the screen → 1 = the portrait.
 * portrait.scatter:  0 = portrait → 1 = blown apart (driven by scroll).
 * Nothing moves on its own once assembled; the cursor gently pushes particles aside.
 */

const PORTRAIT_H = 4.7 // world units

type Sample = {
  image: HTMLImageElement
  target: Float32Array
  start: Float32Array
  lum: Float32Array
  rim: Float32Array
  rand: Float32Array
  count: number
  aspect: number
}

async function sample(url: string, cols: number): Promise<Sample> {
  const img = new Image()
  img.src = url
  await img.decode()
  const aspect = img.width / img.height
  const rows = Math.round(cols / aspect)
  const c = document.createElement('canvas')
  c.width = cols
  c.height = rows
  const g = c.getContext('2d', { willReadFrequently: true })!
  g.drawImage(img, 0, 0, cols, rows)
  const d = g.getImageData(0, 0, cols, rows).data
  const A = (x: number, y: number) => (x < 0 || y < 0 || x >= cols || y >= rows ? 0 : d[(y * cols + x) * 4 + 3] / 255)

  const target: number[] = []
  const lum: number[] = []
  const rim: number[] = []
  const W = PORTRAIT_H * aspect
  for (let y = 0; y < rows; y++) {
    for (let x = 0; x < cols; x++) {
      const i = (y * cols + x) * 4
      const a = d[i + 3] / 255
      if (a < 0.35) continue
      const l = d[i] / 255
      if (l < 0.07 && Math.random() > 0.12) continue // keep the shadows sparse: stipple look
      // light comes from the right: pixels on the right-hand silhouette get an orange rim
      const edgeR = A(x + 3, y) < 0.3 || A(x + 7, y) < 0.3 ? 1 : 0
      const jx = (Math.random() - 0.5) * 0.6
      const jy = (Math.random() - 0.5) * 0.6
      target.push(((x + jx) / cols - 0.5) * W, (0.5 - (y + jy) / rows) * PORTRAIT_H, (Math.random() - 0.5) * 0.04)
      lum.push(l)
      rim.push(edgeR)
    }
  }
  const count = lum.length
  const start = new Float32Array(count * 3)
  const rand = new Float32Array(count * 3)
  for (let i = 0; i < count; i++) {
    start[i * 3] = (Math.random() - 0.5) * 16
    start[i * 3 + 1] = (Math.random() - 0.5) * 9
    start[i * 3 + 2] = (Math.random() - 0.5) * 3
    rand[i * 3] = Math.random()
    rand[i * 3 + 1] = Math.random()
    rand[i * 3 + 2] = Math.random()
  }
  return { image: img, target: new Float32Array(target), start, lum: new Float32Array(lum), rim: new Float32Array(rim), rand, count, aspect }
}

const vertex = /* glsl */ `
uniform float uAssemble;
uniform float uScatter;
uniform float uTime;
uniform float uSize;
uniform float uPixelRatio;
uniform vec2 uMouse;
uniform float uReveal;
uniform float uRadius;
attribute vec3 aStart;
attribute vec3 aRand;
attribute float aLum;
attribute float aRim;
varying float vAlpha;
varying vec3 vColor;

float ease(float t){ return 1.0 - pow(1.0 - t, 3.0); }

void main(){
  // assemble with a per-particle delay: the face (top) resolves first
  float delay = aRand.x * 0.45 + (1.0 - (position.y / ${PORTRAIT_H.toFixed(2)} + 0.5)) * 0.25;
  float t = ease(clamp((uAssemble * 1.7 - delay) / 1.0, 0.0, 1.0));

  vec3 noisePos = aStart + vec3(sin(uTime * 0.6 + aRand.y * 6.28), cos(uTime * 0.5 + aRand.z * 6.28), 0.0) * 0.03;
  vec3 p = mix(noisePos, position, t);

  // scroll: peel away to the upper left, top-right first
  float s = clamp(uScatter * 1.6 - aRand.y * 0.6, 0.0, 1.0);
  s = s * s;
  p += (vec3(-2.6, 1.3, 1.6) + (aRand - 0.5) * vec3(3.0, 2.4, 2.0)) * s * 2.2;

  // hovering the portrait opens a colour "lens": dots inside it fade so the photo shows through;
  // outside the portrait the cursor just parts the dots a little
  vec4 world = modelMatrix * vec4(p, 1.0);
  vec2 dm = world.xy - uMouse;
  float lens = (1.0 - smoothstep(uRadius * 0.55, uRadius, length(dm))) * uReveal * t;
  float f = smoothstep(0.55, 0.0, length(dm)) * t * (1.0 - s) * (1.0 - uReveal);
  world.xy += normalize(dm + 0.0001) * f * 0.18;
  world.z += f * 0.25;

  vec4 mv = viewMatrix * world;
  gl_Position = projectionMatrix * mv;

  float twinkle = 0.35 + 0.65 * step(0.5, fract(aRand.z * 13.0 + uTime * (0.6 + aRand.x)));
  float sz = mix(0.9 + aRand.x * 0.8, 0.5 + aLum * 1.15 + aRim * 0.35, t);
  gl_PointSize = uSize * sz * uPixelRatio / -mv.z;

  vec3 bw = vec3(mix(0.1, 1.0, pow(aLum, 0.78))) * vec3(1.0, 0.985, 0.96);
  vec3 ember = vec3(1.0, 0.42, 0.14);
  vec3 col = mix(bw, ember * (0.7 + aLum * 0.6), aRim * 0.85 * t);
  vColor = mix(vec3(0.85), col, t);
  vAlpha = mix(0.55 * twinkle, 0.25 + aLum * 0.85 + aRim * 0.4, t) * (1.0 - s * 0.85) * (1.0 - lens);
}`

// The colour-graded photo, visible only inside the cursor lens, with a thin orange ring at its edge.
const colorVertex = /* glsl */ `
varying vec2 vUv;
varying vec2 vWorld;
void main(){
  vUv = uv;
  vec4 w = modelMatrix * vec4(position, 1.0);
  vWorld = w.xy;
  gl_Position = projectionMatrix * viewMatrix * w;
}`
const colorFragment = /* glsl */ `
uniform sampler2D uMap;
uniform vec2 uMouse;
uniform float uRadius;
uniform float uReveal;
uniform float uOpacity;
varying vec2 vUv;
varying vec2 vWorld;
void main(){
  vec4 c = texture2D(uMap, vUv);
  float d = length(vWorld - uMouse);
  float inside = 1.0 - smoothstep(uRadius * 0.55, uRadius, d);
  float ring = smoothstep(uRadius * 1.02, uRadius * 0.93, d) * smoothstep(uRadius * 0.8, uRadius * 0.93, d);
  float a = c.a * inside * uReveal * uOpacity;
  vec3 col = c.rgb + vec3(1.0, 0.42, 0.12) * ring * 0.55 * c.a;
  gl_FragColor = vec4(col, max(a, ring * c.a * 0.5 * uReveal * uOpacity));
}`

// A dark silhouette behind the particles so the body really occludes the giant word behind it.
const maskVertex = /* glsl */ `
varying vec2 vUv;
void main(){ vUv = uv; gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0); }`
const maskFragment = /* glsl */ `
uniform sampler2D uMap;
uniform float uOpacity;
varying vec2 vUv;
void main(){
  float a = texture2D(uMap, vUv).a;
  gl_FragColor = vec4(0.035, 0.035, 0.045, smoothstep(0.2, 0.7, a) * uOpacity);
}`

const fragment = /* glsl */ `
varying float vAlpha;
varying vec3 vColor;
void main(){
  vec2 uv = gl_PointCoord - 0.5;
  float d = length(uv);
  if (d > 0.5) discard;
  float a = smoothstep(0.5, 0.18, d);
  gl_FragColor = vec4(vColor, a * vAlpha);
}`

function Particles({ url, colorUrl }: { url: string; colorUrl: string }) {
  const { size, camera } = useThree()
  const [data, setData] = useState<Sample | null>(null)
  const narrow = size.width < 760

  useEffect(() => {
    let alive = true
    sample(url, narrow ? 190 : 300).then((s) => alive && setData(s))
    return () => {
      alive = false
    }
  }, [url, narrow])

  const geometry = useMemo(() => {
    if (!data) return null
    const g = new THREE.BufferGeometry()
    g.setAttribute('position', new THREE.BufferAttribute(data.target, 3))
    g.setAttribute('aStart', new THREE.BufferAttribute(data.start, 3))
    g.setAttribute('aRand', new THREE.BufferAttribute(data.rand, 3))
    g.setAttribute('aLum', new THREE.BufferAttribute(data.lum, 1))
    g.setAttribute('aRim', new THREE.BufferAttribute(data.rim, 1))
    g.boundingSphere = new THREE.Sphere(new THREE.Vector3(), 30)
    return g
  }, [data])

  const material = useMemo(
    () =>
      new THREE.ShaderMaterial({
        vertexShader: vertex,
        fragmentShader: fragment,
        transparent: true,
        depthWrite: false,
        uniforms: {
          uAssemble: { value: 0 },
          uScatter: { value: 0 },
          uTime: { value: 0 },
          uSize: { value: 40 },
          uPixelRatio: { value: Math.min(window.devicePixelRatio || 1, 2) },
          uMouse: { value: new THREE.Vector2(99, 99) },
          uReveal: { value: 0 },
          uRadius: { value: 0.9 },
        },
      }),
    [],
  )

  const colorMat = useMemo(() => {
    // raw sRGB in → raw sRGB out: this ShaderMaterial does no colour-space conversion
    const tex = new THREE.TextureLoader().load(colorUrl)
    return new THREE.ShaderMaterial({
      vertexShader: colorVertex,
      fragmentShader: colorFragment,
      transparent: true,
      depthWrite: false,
      uniforms: {
        uMap: { value: tex },
        uMouse: material.uniforms.uMouse,
        uRadius: material.uniforms.uRadius,
        uReveal: material.uniforms.uReveal,
        uOpacity: { value: 0 },
      },
    })
  }, [colorUrl, material])
  const group = useRef<THREE.Group>(null)
  const local = useMemo(() => new THREE.Vector3(), [])

  const mask = useMemo(() => {
    if (!data) return null
    const tex = new THREE.Texture(data.image)
    tex.needsUpdate = true
    return new THREE.ShaderMaterial({
      vertexShader: maskVertex,
      fragmentShader: maskFragment,
      transparent: true,
      depthWrite: false,
      uniforms: { uMap: { value: tex }, uOpacity: { value: 0 } },
    })
  }, [data])

  const mouse = useMemo(() => new THREE.Vector2(99, 99), [])

  useFrame((_, delta) => {
    const u = material.uniforms
    u.uTime.value += Math.min(delta, 1 / 30)
    u.uAssemble.value = portrait.assemble
    u.uScatter.value += (portrait.scatter - u.uScatter.value) * 0.18
    const cam = camera as THREE.PerspectiveCamera
    const halfH = Math.tan(THREE.MathUtils.degToRad(cam.fov / 2)) * cam.position.z
    const halfW = halfH * cam.aspect
    mouse.x += (pointer.x * halfW - mouse.x) * 0.2
    mouse.y += (pointer.y * halfH - mouse.y) * 0.2
    u.uMouse.value.copy(mouse)
    // point size tracks the canvas height so density is identical at every resolution
    u.uSize.value = (size.height / (halfH * 2)) * 0.0162 * (narrow ? 1.3 : 1) * 10
    const shown = THREE.MathUtils.smoothstep(portrait.assemble, 0.45, 0.95) * (1 - Math.min(1, u.uScatter.value * 2.2))
    if (mask) mask.uniforms.uOpacity.value = shown * 0.94
    colorMat.uniforms.uOpacity.value = shown

    // colour lens: on while the cursor is over the portrait, grows in, shrinks out
    let over = 0
    if (group.current && data && portrait.assemble > 0.95 && portrait.scatter < 0.05) {
      local.set(mouse.x, mouse.y, 0)
      group.current.worldToLocal(local)
      const hw = (PORTRAIT_H * data.aspect) / 2
      over = Math.abs(local.x) < hw * 0.92 && Math.abs(local.y) < PORTRAIT_H / 2 ? 1 : 0
    }
    u.uReveal.value += (over - u.uReveal.value) * 0.09
    u.uRadius.value = 0.25 + u.uReveal.value * (narrow ? 0.7 : 0.82)
  })

  if (!geometry || !data || !mask) return null

  // layout: right of centre on desktop, centred on phones; feet fall off the bottom edge
  const cam = camera as THREE.PerspectiveCamera
  const halfH = Math.tan(THREE.MathUtils.degToRad(cam.fov / 2)) * cam.position.z
  const halfW = halfH * cam.aspect
  const h = narrow ? PORTRAIT_H * 0.82 : PORTRAIT_H
  const scale = h / PORTRAIT_H
  const x = narrow ? 0 : Math.min(halfW * 0.22, halfW - (PORTRAIT_H * data.aspect * scale) / 2 - 0.4)
  const topMargin = narrow ? halfH * 0.24 : halfH * 0.2
  const y = halfH - topMargin - h / 2

  return (
    <group ref={group} position={[x, y, 0]} scale={scale}>
      <mesh material={mask} position={[0, 0, -0.06]} renderOrder={-1}>
        <planeGeometry args={[PORTRAIT_H * data.aspect, PORTRAIT_H]} />
      </mesh>
      <points geometry={geometry} material={material} frustumCulled={false} />
      <mesh material={colorMat} position={[0, 0, 0.03]} renderOrder={2}>
        <planeGeometry args={[PORTRAIT_H * data.aspect, PORTRAIT_H]} />
      </mesh>
    </group>
  )
}

export default function Portrait({ url, colorUrl, active }: { url: string; colorUrl: string; active: boolean }) {
  return (
    <Canvas
      className="portrait"
      frameloop={active ? 'always' : 'never'}
      camera={{ position: [0, 0, 10], fov: 30, near: 0.1, far: 60 }}
      dpr={[1, 2]}
      gl={{ antialias: false, alpha: true, powerPreference: 'high-performance' }}
      style={{ pointerEvents: 'none' }}
    >
      <Particles url={url} colorUrl={colorUrl} />
    </Canvas>
  )
}
