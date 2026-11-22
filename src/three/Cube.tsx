import { Canvas, useFrame, useThree } from '@react-three/fiber'
import { useEffect, useMemo, useRef } from 'react'
import * as THREE from 'three'
import { RoomEnvironment } from 'three/examples/jsm/environments/RoomEnvironment.js'
import { RoundedBoxGeometry } from 'three/examples/jsm/geometries/RoundedBoxGeometry.js'

/** A small glowing cube character whose eyes follow the cursor (it lives in the contact section). */
function Bot({ host }: { host: React.RefObject<HTMLElement | null> }) {
  const { gl, scene } = useThree()
  const body = useRef<THREE.Group>(null)
  const eyes = useRef<THREE.Group>(null)
  const pool = useRef<THREE.Mesh>(null)
  const st = useRef({ x: 0, y: 0, blink: 0, next: 2, t: 0, hop: 0 })

  const geo = useMemo(
    () => ({
      shell: new RoundedBoxGeometry(1.7, 1.45, 1.45, 8, 0.32),
      core: new RoundedBoxGeometry(1.35, 1.1, 1.1, 6, 0.26),
      eye: new THREE.CapsuleGeometry(0.1, 0.16, 8, 16),
      leg: new THREE.CylinderGeometry(0.06, 0.06, 0.55, 16),
      foot: new THREE.CylinderGeometry(0.16, 0.18, 0.08, 32),
      plinth: new THREE.CylinderGeometry(1.25, 1.35, 0.32, 96),
      pool: new THREE.CircleGeometry(2.4, 64),
    }),
    [],
  )

  const mat = useMemo(
    () => ({
      shell: new THREE.MeshPhysicalMaterial({
        color: '#ff6a2a',
        emissive: '#ff4a10',
        emissiveIntensity: 0.55,
        roughness: 0.12,
        metalness: 0,
        clearcoat: 1,
        clearcoatRoughness: 0.06,
        transmission: 0.35,
        thickness: 1.2,
        ior: 1.4,
      }),
      core: new THREE.MeshBasicMaterial({ color: new THREE.Color('#ff7b35').multiplyScalar(1.6), toneMapped: false }),
      eye: new THREE.MeshBasicMaterial({ color: new THREE.Color('#fff6ee').multiplyScalar(1.4), toneMapped: false }),
      metal: new THREE.MeshPhysicalMaterial({ color: '#d9d6d0', roughness: 0.3, metalness: 0.4, clearcoat: 0.6 }),
      plinth: new THREE.MeshPhysicalMaterial({ color: '#141417', roughness: 0.4, metalness: 0.6, clearcoat: 0.5 }),
      pool: new THREE.MeshBasicMaterial({
        transparent: true,
        depthWrite: false,
        blending: THREE.AdditiveBlending,
        map: (() => {
          const c = document.createElement('canvas')
          c.width = c.height = 256
          const g = c.getContext('2d')!
          const grd = g.createRadialGradient(128, 128, 0, 128, 128, 128)
          grd.addColorStop(0, 'rgba(255,110,40,0.9)')
          grd.addColorStop(0.4, 'rgba(255,80,20,0.35)')
          grd.addColorStop(1, 'rgba(255,60,10,0)')
          g.fillStyle = grd
          g.fillRect(0, 0, 256, 256)
          const t = new THREE.CanvasTexture(c)
          t.colorSpace = THREE.SRGBColorSpace
          return t
        })(),
      }),
    }),
    [],
  )

  useEffect(() => {
    const pmrem = new THREE.PMREMGenerator(gl)
    const env = pmrem.fromScene(new RoomEnvironment(), 0.04).texture
    scene.environment = env
    scene.environmentIntensity = 0.6
    return () => {
      env.dispose()
      pmrem.dispose()
    }
  }, [gl, scene])

  useEffect(() => {
    const onMove = (e: PointerEvent) => {
      const r = host.current?.getBoundingClientRect()
      if (!r) return
      st.current.x = THREE.MathUtils.clamp((e.clientX - (r.left + r.width / 2)) / (window.innerWidth * 0.35), -1, 1)
      st.current.y = THREE.MathUtils.clamp(-(e.clientY - (r.top + r.height * 0.45)) / (window.innerHeight * 0.4), -1, 1)
    }
    const onClick = () => (st.current.hop = 1)
    window.addEventListener('pointermove', onMove, { passive: true })
    host.current?.addEventListener('click', onClick)
    const h = host.current
    return () => {
      window.removeEventListener('pointermove', onMove)
      h?.removeEventListener('click', onClick)
    }
  }, [host])

  const look = useRef({ x: 0, y: 0 })
  useFrame((_, delta) => {
    const dt = Math.min(delta, 1 / 30)
    const s = st.current
    s.t += dt
    look.current.x += (s.x - look.current.x) * 0.08
    look.current.y += (s.y - look.current.y) * 0.08
    s.hop = Math.max(0, s.hop - dt * 1.8)
    const hop = Math.sin(s.hop * Math.PI) * 0.45

    if (body.current) {
      body.current.position.y = 0.95 + Math.sin(s.t * 1.6) * 0.05 + hop
      body.current.rotation.y = look.current.x * 0.45
      body.current.rotation.x = -look.current.y * 0.22
      body.current.rotation.z = -look.current.x * 0.05
    }
    s.next -= dt
    if (s.next <= 0) {
      s.blink = 1
      s.next = 2 + Math.random() * 3
    }
    s.blink = Math.max(0, s.blink - dt * 7)
    const open = 1 - Math.sin(s.blink * Math.PI) * 0.92
    if (eyes.current) {
      eyes.current.position.x = look.current.x * 0.16
      eyes.current.position.y = 0.05 + look.current.y * 0.12
      eyes.current.children.forEach((c) => c.scale.set(1, open, 1))
    }
    if (pool.current) (pool.current.material as THREE.MeshBasicMaterial).opacity = 0.75 + Math.sin(s.t * 2) * 0.1 - hop * 0.5
  })

  return (
    <group position={[0, -1.1, 0]}>
      <mesh geometry={geo.plinth} material={mat.plinth} position={[0, -0.16, 0]} />
      <mesh ref={pool} geometry={geo.pool} material={mat.pool} rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.01, 0]} />
      {[-0.32, 0.32].map((x) => (
        <group key={x}>
          <mesh geometry={geo.leg} material={mat.metal} position={[x, 0.3, 0]} />
          <mesh geometry={geo.foot} material={mat.metal} position={[x, 0.04, 0]} />
        </group>
      ))}
      <group ref={body} position={[0, 0.95, 0]}>
        <mesh geometry={geo.core} material={mat.core} />
        <mesh geometry={geo.shell} material={mat.shell} />
        <group ref={eyes} position={[0, 0.05, 0.74]}>
          {[-0.3, 0.3].map((x) => (
            <mesh key={x} geometry={geo.eye} material={mat.eye} position={[x, 0, 0]} scale={[1, 1, 0.35]} />
          ))}
        </group>
        <pointLight color="#ff6a2a" intensity={8} distance={5} position={[0, -0.6, 0.4]} />
      </group>
    </group>
  )
}

export default function Cube({ active, host }: { active: boolean; host: React.RefObject<HTMLElement | null> }) {
  return (
    <Canvas
      className="cube"
      frameloop={active ? 'always' : 'never'}
      camera={{ position: [0, 1.2, 7.2], fov: 30 }}
      dpr={[1, 1.75]}
      gl={{ antialias: true, alpha: true }}
    >
      <ambientLight intensity={0.25} />
      <directionalLight position={[3, 5, 4]} intensity={1.4} />
      <directionalLight position={[-4, 2, -3]} intensity={2} color="#4d7cff" />
      <Bot host={host} />
    </Canvas>
  )
}
