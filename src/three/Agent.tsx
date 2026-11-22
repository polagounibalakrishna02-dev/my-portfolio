import { Canvas, useFrame, useThree } from '@react-three/fiber'
import { useEffect, useMemo, useRef } from 'react'
import * as THREE from 'three'
import { RoomEnvironment } from 'three/examples/jsm/environments/RoomEnvironment.js'
import { agent } from './state'

/**
 * "The agent" — a procedural android that lives inside the How-I-build loop ring.
 * - First view: it scan-builds from a blueprint wireframe.
 * - Scrolling: its head tracks the pulse travelling round the ring, its torso turns with it.
 * - Each step: eyes + chest light change colour and it nods.
 * - Hover the ring: it watches the cursor. Click: a happy hop.
 */

const STEP_COLORS = ['#ff7a35', '#5b8cff', '#2bd9a0', '#f5b70a'].map((c) => new THREE.Color(c))

const U = {
  uScan: { value: -3.4 },
  uWire: { value: 1 },
  uRootInv: { value: new THREE.Matrix4() },
  uScanColor: { value: new THREE.Color('#4d8dff') },
}

function patch<T extends THREE.Material>(mat: T, emissive: boolean): T {
  mat.onBeforeCompile = (shader) => {
    Object.assign(shader.uniforms, U)
    shader.vertexShader = shader.vertexShader
      .replace('#include <common>', '#include <common>\nuniform mat4 uRootInv;\nvarying vec3 vRootPos;')
      .replace('#include <project_vertex>', '#include <project_vertex>\nvRootPos = (uRootInv * modelMatrix * vec4(transformed, 1.0)).xyz;')
    shader.fragmentShader = shader.fragmentShader
      .replace('#include <common>', '#include <common>\nuniform float uScan; uniform vec3 uScanColor; varying vec3 vRootPos;')
      .replace('#include <clipping_planes_fragment>', '#include <clipping_planes_fragment>\nif (vRootPos.y > uScan) discard;')
    if (emissive) {
      shader.fragmentShader = shader.fragmentShader.replace(
        '#include <emissivemap_fragment>',
        '#include <emissivemap_fragment>\ntotalEmissiveRadiance += uScanColor * smoothstep(0.16, 0.0, uScan - vRootPos.y) * 3.0;',
      )
    }
  }
  return mat
}

function wireMaterial() {
  const mat = new THREE.MeshBasicMaterial({ color: '#4d8dff', wireframe: true, transparent: true, opacity: 0.5, depthWrite: false })
  mat.onBeforeCompile = (shader) => {
    Object.assign(shader.uniforms, U)
    shader.vertexShader = shader.vertexShader
      .replace('#include <common>', '#include <common>\nuniform mat4 uRootInv;\nvarying vec3 vRootPos;')
      .replace('#include <project_vertex>', '#include <project_vertex>\nvRootPos = (uRootInv * modelMatrix * vec4(transformed, 1.0)).xyz;')
    shader.fragmentShader = shader.fragmentShader
      .replace('#include <common>', '#include <common>\nuniform float uScan; uniform float uWire; varying vec3 vRootPos;')
      .replace('#include <clipping_planes_fragment>', '#include <clipping_planes_fragment>\nif (vRootPos.y < uScan - 0.02) discard;')
      .replace('vec4 diffuseColor = vec4( diffuse, opacity );', 'vec4 diffuseColor = vec4( diffuse, opacity * uWire );')
  }
  return mat
}

function glowTexture() {
  const c = document.createElement('canvas')
  c.width = c.height = 128
  const g = c.getContext('2d')!
  const grd = g.createRadialGradient(64, 64, 0, 64, 64, 64)
  grd.addColorStop(0, 'rgba(255,255,255,1)')
  grd.addColorStop(0.25, 'rgba(255,255,255,0.45)')
  grd.addColorStop(1, 'rgba(255,255,255,0)')
  g.fillStyle = grd
  g.fillRect(0, 0, 128, 128)
  return new THREE.CanvasTexture(c)
}

// V-taper bust profile (bottom → top so LatheGeometry normals face outwards)
const TORSO = [
  [0.0, 0.76], [0.3, 0.76], [0.46, 0.7], [0.72, 0.58], [1.05, 0.42], [1.36, 0.22], [1.58, -0.04],
  [1.68, -0.32], [1.66, -0.7], [1.56, -1.2], [1.48, -1.8], [1.44, -2.4], [1.42, -3.1],
]
function profile(pts: number[][], scale = 1, samples = 40) {
  const curve = new THREE.CatmullRomCurve3(pts.map(([x, y]) => new THREE.Vector3(x * scale, y, 0)), false, 'centripetal')
  return curve.getPoints(samples).map((p) => new THREE.Vector2(Math.max(0, p.x), p.y)).reverse()
}

const HEAD_SCALE = new THREE.Vector3(0.86, 1, 0.92)
function onHead(theta: number, phi: number, r: number) {
  const p = new THREE.Vector3(-Math.cos(phi) * Math.sin(theta), Math.cos(theta), Math.sin(phi) * Math.sin(theta)).multiplyScalar(r)
  p.multiply(HEAD_SCALE)
  const n = p.clone().divide(HEAD_SCALE).divide(HEAD_SCALE).normalize()
  return { p, q: new THREE.Quaternion().setFromUnitVectors(new THREE.Vector3(0, 0, 1), n) }
}

function Bot() {
  const { gl, scene } = useThree()
  const root = useRef<THREE.Group>(null)
  const torso = useRef<THREE.Group>(null)
  const neck = useRef<THREE.Group>(null)
  const eyes = useRef<THREE.Group>(null)
  const glows = useRef<THREE.Sprite[]>([])

  const mats = useMemo(() => {
    const light = new THREE.MeshBasicMaterial({ color: STEP_COLORS[0].clone().multiplyScalar(2.2), toneMapped: false })
    return {
      ceramic: patch(new THREE.MeshPhysicalMaterial({ color: '#d6d1ca', roughness: 0.26, metalness: 0.12, clearcoat: 1, clearcoatRoughness: 0.12 }), true),
      graphite: patch(new THREE.MeshPhysicalMaterial({ color: '#232327', roughness: 0.3, metalness: 0.85, clearcoat: 0.4 }), true),
      visor: patch(new THREE.MeshPhysicalMaterial({ color: '#060608', roughness: 0.06, metalness: 0.55, clearcoat: 1, clearcoatRoughness: 0.04 }), true),
      light: patch(light, false),
      wire: wireMaterial(),
    }
  }, [])

  const geos = useMemo(
    () => ({
      head: new THREE.SphereGeometry(1, 64, 48),
      headWire: new THREE.SphereGeometry(1.004, 22, 14),
      visor: new THREE.SphereGeometry(1.014, 64, 24, Math.PI / 2 - 1.02, 2.04, Math.PI * 0.3, Math.PI * 0.27),
      torso: new THREE.LatheGeometry(profile(TORSO), 72),
      plate: new THREE.LatheGeometry(profile(TORSO.slice(0, 10), 1.018, 34), 72),
      torsoWire: new THREE.LatheGeometry(profile(TORSO).filter((_, i) => i % 3 === 0), 24),
      plateEdge: new THREE.TorusGeometry(1.588, 0.014, 8, 160),
      neck: new THREE.CylinderGeometry(0.24, 0.3, 0.62, 48),
      ring: new THREE.TorusGeometry(0.27, 0.02, 12, 64),
      collar: new THREE.TorusGeometry(0.46, 0.075, 20, 80),
      ear: new THREE.CylinderGeometry(0.2, 0.2, 0.16, 48),
      earRing: new THREE.TorusGeometry(0.12, 0.016, 12, 48),
      eye: new THREE.CapsuleGeometry(0.048, 0.17, 6, 16),
      emblemRing: new THREE.TorusGeometry(0.17, 0.034, 16, 64),
      emblemCore: new THREE.CircleGeometry(0.13, 48),
    }),
    [],
  )
  const glowMap = useMemo(() => glowTexture(), [])
  const eyeSpots = useMemo(() => [onHead(Math.PI * 0.455, Math.PI / 2 - 0.36, 1.02), onHead(Math.PI * 0.455, Math.PI / 2 + 0.36, 1.02)], [])

  useEffect(() => {
    const pmrem = new THREE.PMREMGenerator(gl)
    const env = pmrem.fromScene(new RoomEnvironment(), 0.04).texture
    scene.environment = env
    scene.environmentIntensity = 0.5
    return () => {
      env.dispose()
      pmrem.dispose()
    }
  }, [gl, scene])

  const s = useRef({ yaw: 0, pitch: 0, body: 0, blink: 0, nextBlink: 2.5, t: 0, step: -1, nod: 0, hop: 0, squint: 0, color: STEP_COLORS[0].clone() })

  useFrame((_, delta) => {
    const dt = Math.min(delta, 1 / 30)
    const st = s.current
    st.t += dt

    // build-in scan + wireframe fade
    U.uScan.value += (agent.scan - U.uScan.value) * (1 - Math.exp(-dt * 2.2))
    const built = THREE.MathUtils.clamp((U.uScan.value - 2.6) / 0.8, 0, 1)
    U.uWire.value += (1 - built - U.uWire.value) * 0.08

    // where to look: the cursor when hovering, otherwise the pulse on the ring
    const a = agent.progress * Math.PI * 2 // 0 = top, clockwise
    const tx = agent.hover ? agent.px : Math.sin(a)
    const ty = agent.hover ? agent.py : Math.cos(a)
    st.yaw += (tx * 0.62 - st.yaw) * 0.07
    st.pitch += (-ty * 0.34 - st.pitch) * 0.07
    st.body += (tx * 0.22 - st.body) * 0.04

    // step reactions: colour shift + nod
    if (agent.step !== st.step) {
      if (st.step !== -1) st.nod = 1
      st.step = agent.step
    }
    st.nod = Math.max(0, st.nod - dt * 2.4)
    const nod = Math.sin((1 - st.nod) * Math.PI) * st.nod * 0.28
    st.color.lerp(STEP_COLORS[agent.step] ?? STEP_COLORS[0], 0.08)
    mats.light.color.copy(st.color).multiplyScalar(2.2)

    // click: a hop and a happy squint
    if (agent.poke > 0) {
      st.hop = 1
      st.squint = 1
      agent.poke = 0
    }
    st.hop = Math.max(0, st.hop - dt * 2)
    st.squint = Math.max(0, st.squint - dt * 0.9)

    if (root.current) {
      const r = root.current
      r.position.y = -1.55 + Math.sin(st.t * 1.1) * 0.03 + Math.sin(st.hop * Math.PI) * 0.35
      r.updateMatrixWorld()
      U.uRootInv.value.copy(r.matrixWorld).invert()
    }
    if (neck.current) {
      neck.current.rotation.set(st.pitch + nod, st.yaw, -st.yaw * 0.08)
    }
    if (torso.current) torso.current.rotation.y = st.body

    // blink (and squint after a poke)
    st.nextBlink -= dt
    if (st.nextBlink <= 0) {
      st.blink = 1
      st.nextBlink = 2.4 + Math.random() * 3.4
    }
    st.blink = Math.max(0, st.blink - dt * 7)
    const open = (1 - Math.sin(st.blink * Math.PI) * 0.9) * (1 - Math.min(st.squint * 2, 1) * 0.6)
    eyes.current?.children.forEach((c) => c.scale.set(1, open, 1))

    const headBuilt = THREE.MathUtils.clamp((U.uScan.value - 1.9) / 0.4, 0, 1)
    const pulse = 0.85 + Math.sin(st.t * 3) * 0.15 + st.nod * 0.6
    glows.current.forEach((g, i) => {
      const m = g.material as THREE.SpriteMaterial
      m.color.copy(st.color)
      m.opacity = headBuilt * (i < 2 ? 0.85 * open : 0.6 * pulse)
    })
  })

  return (
    <group ref={root} scale={1.02}>
      <group ref={torso}>
        <mesh geometry={geos.torso} material={mats.graphite} scale={[0.985, 1, 0.57]} />
        <mesh geometry={geos.plate} material={mats.ceramic} scale={[1, 1, 0.58]} />
        <mesh geometry={geos.torsoWire} material={mats.wire} scale={[1.004, 1, 0.584]} />
        <group position={[0, -1.205, 0]} scale={[1, 1, 0.58]}>
          <mesh geometry={geos.plateEdge} material={mats.light} rotation={[Math.PI / 2, 0, 0]} />
        </group>
        <mesh geometry={geos.collar} material={mats.graphite} position={[0, 0.74, 0]} rotation={[Math.PI / 2, 0, 0]} scale={[1, 0.8, 1]} />
        <group position={[0, -0.28, 1.0]} rotation={[-0.16, 0, 0]}>
          <mesh geometry={geos.emblemRing} material={mats.graphite} />
          <mesh geometry={geos.emblemCore} material={mats.light} position={[0, 0, 0.01]} />
          <sprite ref={(el) => el && (glows.current[2] = el)} scale={[1.1, 1.1, 1]} position={[0, 0, 0.05]}>
            <spriteMaterial map={glowMap} transparent depthWrite={false} blending={THREE.AdditiveBlending} opacity={0} />
          </sprite>
        </group>
      </group>

      <mesh geometry={geos.neck} material={mats.graphite} position={[0, 0.98, 0]} />
      {[0.78, 0.96, 1.14].map((y) => (
        <mesh key={y} geometry={geos.ring} material={mats.graphite} position={[0, y, 0]} rotation={[Math.PI / 2, 0, 0]} />
      ))}

      <group ref={neck} position={[0, 1.18, 0]}>
        <group position={[0, 0.94, 0]}>
          <mesh geometry={geos.head} material={mats.ceramic} scale={HEAD_SCALE} />
          <mesh geometry={geos.headWire} material={mats.wire} scale={HEAD_SCALE} />
          <mesh geometry={geos.visor} material={mats.visor} scale={HEAD_SCALE} />
          {[-1, 1].map((sd) => (
            <group key={sd} position={[sd * 0.86, -0.02, 0]}>
              <mesh geometry={geos.ear} material={mats.graphite} rotation={[0, 0, Math.PI / 2]} />
              <mesh geometry={geos.earRing} material={mats.light} position={[sd * 0.085, 0, 0]} rotation={[0, Math.PI / 2, 0]} />
            </group>
          ))}
          <group ref={eyes}>
            {eyeSpots.map((e, i) => (
              <group key={i} position={e.p} quaternion={e.q}>
                <mesh geometry={geos.eye} material={mats.light} rotation={[0, 0, Math.PI / 2]} scale={[1, 1, 0.45]} />
              </group>
            ))}
          </group>
          {eyeSpots.map((e, i) => (
            <sprite key={i} ref={(el) => el && (glows.current[i] = el)} position={[e.p.x, e.p.y, e.p.z + 0.06]} scale={[0.85, 0.55, 1]}>
              <spriteMaterial map={glowMap} transparent depthWrite={false} blending={THREE.AdditiveBlending} opacity={0} />
            </sprite>
          ))}
        </group>
      </group>
    </group>
  )
}

export default function Agent({ active }: { active: boolean }) {
  return (
    <Canvas
      frameloop={active ? 'always' : 'never'}
      camera={{ position: [0, 0.2, 12.5], fov: 24, near: 0.1, far: 60 }}
      dpr={[1, 2]}
      gl={{ antialias: true, alpha: true, powerPreference: 'high-performance' }}
      style={{ pointerEvents: 'none' }}
    >
      <ambientLight intensity={0.15} />
      <directionalLight position={[-3, 4, 6]} intensity={1.5} color="#fff1e6" />
      <directionalLight position={[5, 2.5, -4]} intensity={7} color="#ff4a1c" />
      <directionalLight position={[-6, 1, -3]} intensity={2.6} color="#4d7cff" />
      <pointLight position={[0, -1.8, 2.2]} intensity={6} distance={6} color="#ff5a1f" />
      <Bot />
    </Canvas>
  )
}
