/**
 * DineIQ 3D Restaurant Digital Twin
 * ----------------------------------
 * A purposeful spatial model: each zone maps to an analytical domain —
 *
 *   DINING    → orders · revenue · customer activity      (Steps 8, 15, 44)
 *   MENU WALL → product intelligence · classification     (Steps 9–11, 43)
 *   KITCHEN   → demand · preparation · forecast           (Steps 20, 46)
 *   STORAGE   → inventory · wastage risk                  (Steps 23–24, 45)
 *   SERVICE   → channels · promotions · anomalies         (Steps 28, 31, 35)
 *
 * The camera travels through these zones as the user scrolls the journey.
 */

import { Component, ReactNode, Suspense, useMemo, useRef } from 'react';
import { Canvas, useFrame, useThree } from '@react-three/fiber';
import { ContactShadows, Grid, Html } from '@react-three/drei';
import * as THREE from 'three';

export const SECTION_COUNT = 10;

/** Camera keyframes per journey section (pos → look-at). */
const CAMERAS: { pos: THREE.Vector3; look: THREE.Vector3 }[] = [
  { pos: v(0, 17, 31), look: v(0, 1, 0) },       // 01 command center — wide
  { pos: v(11, 12, 19), look: v(1, 1, 3) },      // 02 performance — dining
  { pos: v(3, 7, 8), look: v(4, 2.6, -11) },     // 03 menu intelligence — menu wall
  { pos: v(-9, 9, 13), look: v(1, 1, 3) },       // 04 customers — tables
  { pos: v(1, 17, 7), look: v(1, 0, 3) },        // 05 basket — overhead pairings
  { pos: v(-13, 8, -1), look: v(-10, 1.5, -8) }, // 06 forecast — kitchen
  { pos: v(15, 8, 3), look: v(13, 1.5, -1) },    // 07 inventory/wastage — storage
  { pos: v(1, 6, 14), look: v(4, 2.6, -11) },    // 08 pricing — menu board close
  { pos: v(0, 24, 10), look: v(0, 0, 2) },       // 09 anomalies — overhead scan
  { pos: v(17, 15, 25), look: v(0, 2, 0) },      // 10 recommendations — command view
];

function v(x: number, y: number, z: number) { return new THREE.Vector3(x, y, z); }

function smooth(t: number) { return t * t * (3 - 2 * t); }

type ZoneKey = 'dining' | 'menu' | 'kitchen' | 'storage' | 'service';

const SECTION_ZONE: ZoneKey[] = [
  'dining', 'dining', 'menu', 'dining', 'dining',
  'kitchen', 'storage', 'menu', 'service', 'dining',
];

const ZONE_LABELS: { key: ZoneKey; pos: [number, number, number]; title: string; sub: string }[] = [
  { key: 'dining', pos: [1, 4.6, 4], title: 'DINING', sub: 'Orders · Revenue · Customers' },
  { key: 'menu', pos: [4, 5.4, -11], title: 'MENU', sub: 'Product Intelligence' },
  { key: 'kitchen', pos: [-10, 4.8, -8], title: 'KITCHEN', sub: 'Demand · Forecast · Prep' },
  { key: 'storage', pos: [13, 4.6, -1], title: 'STORAGE', sub: 'Inventory · Wastage Risk' },
  { key: 'service', pos: [9, 4.4, 8], title: 'SERVICE', sub: 'Channels · Promos · Anomalies' },
];

/* ------------------------------ geometry ------------------------------ */

function Table({ x, z, r }: { x: number; z: number; r: number }) {
  return (
    <group position={[x, 0, z]}>
      <mesh position={[0, 0.72, 0]} castShadow>
        <cylinderGeometry args={[0.9, 0.9, 0.08, 24]} />
        <meshStandardMaterial color="#2a2118" roughness={0.55} metalness={0.15} />
      </mesh>
      <mesh position={[0, 0.36, 0]}>
        <cylinderGeometry args={[0.09, 0.14, 0.72, 12]} />
        <meshStandardMaterial color="#181410" roughness={0.7} />
      </mesh>
      {[0, 1, 2, 3].map((i) => {
        const a = (i / 4) * Math.PI * 2 + r;
        return (
          <mesh key={i} position={[Math.cos(a) * 1.35, 0.42, Math.sin(a) * 1.35]} rotation={[0, -a, 0]}>
            <boxGeometry args={[0.5, 0.8, 0.5]} />
            <meshStandardMaterial color="#231c15" roughness={0.8} />
          </mesh>
        );
      })}
    </group>
  );
}

function Kitchen() {
  return (
    <group position={[-10, 0, -8]}>
      {/* counters */}
      <mesh position={[0, 0.5, -1]} castShadow>
        <boxGeometry args={[7, 1, 1.4]} />
        <meshStandardMaterial color="#3c4152" roughness={0.4} metalness={0.5} />
      </mesh>
      <mesh position={[0, 1.06, -1]}>
        <boxGeometry args={[7.1, 0.12, 1.5]} />
        <meshStandardMaterial color="#9aa3b8" roughness={0.25} metalness={0.75} />
      </mesh>
      {/* island */}
      <mesh position={[0.5, 0.5, 1.6]} castShadow>
        <boxGeometry args={[4.2, 1, 1.3]} />
        <meshStandardMaterial color="#343a4c" roughness={0.45} metalness={0.45} />
      </mesh>
      {/* hood */}
      <mesh position={[0, 3.1, -1]}>
        <boxGeometry args={[4.4, 0.5, 1.6]} />
        <meshStandardMaterial color="#262b3a" roughness={0.5} metalness={0.5} emissive="#d9a441" emissiveIntensity={0.06} />
      </mesh>
      <mesh position={[-2.9, 2.2, -1]}>
        <cylinderGeometry args={[0.24, 0.3, 2.4, 12]} />
        <meshStandardMaterial color="#2c3140" metalness={0.6} roughness={0.4} />
      </mesh>
      {/* pans */}
      {[0, 1, 2].map((i) => (
        <mesh key={i} position={[-1.4 + i * 1.4, 1.16, -1]} rotation={[0, 0, 0]}>
          <cylinderGeometry args={[0.34, 0.3, 0.1, 18]} />
          <meshStandardMaterial color="#101420" metalness={0.7} roughness={0.35} />
        </mesh>
      ))}
    </group>
  );
}

function MenuWall() {
  return (
    <group position={[4, 0, -11]}>
      <mesh position={[0, 2.4, 0]} castShadow>
        <boxGeometry args={[10, 3.4, 0.3]} />
        <meshStandardMaterial color="#161b29" roughness={0.6} />
      </mesh>
      {[0, 1, 2].map((i) => (
        <mesh key={i} position={[-3 + i * 3, 2.6, 0.2]}>
          <boxGeometry args={[2.4, 2.2, 0.06]} />
          <meshStandardMaterial color="#0d1018" emissive={i === 1 ? '#d9a441' : '#5b8cff'} emissiveIntensity={0.35} roughness={0.4} />
        </mesh>
      ))}
      {/* price tag accents */}
      {[0, 1, 2, 3, 4].map((i) => (
        <mesh key={`t${i}`} position={[-4 + i * 2, 0.9, 0.25]}>
          <boxGeometry args={[0.5, 0.3, 0.05]} />
          <meshStandardMaterial color="#d9a441" emissive="#d9a441" emissiveIntensity={0.5} />
        </mesh>
      ))}
    </group>
  );
}

function Storage() {
  const crates = useMemo(() => {
    const out: { p: [number, number, number]; c: string }[] = [];
    for (let i = 0; i < 9; i++) {
      const row = Math.floor(i / 3);
      out.push({ p: [-1.6 + (i % 3) * 1.3, 0.45 + row * 0.9, (i % 2) * 0.7 - 0.4], c: i % 3 === 0 ? '#4a3a22' : i % 3 === 1 ? '#31404a' : '#3c2f33' });
    }
    return out;
  }, []);
  return (
    <group position={[13, 0, -1]}>
      {[0, 1, 2].map((r) => (
        <mesh key={r} position={[0, 0.4 + r * 0.9, 0]}>
          <boxGeometry args={[4.4, 0.1, 2.2]} />
          <meshStandardMaterial color="#2a2f3d" metalness={0.5} roughness={0.5} />
        </mesh>
      ))}
      {crates.map((c, i) => (
        <mesh key={i} position={c.p}>
          <boxGeometry args={[1, 0.8, 0.9]} />
          <meshStandardMaterial color={c.c} roughness={0.85} />
        </mesh>
      ))}
      <mesh position={[0, 3.2, 0]}>
        <boxGeometry args={[4.6, 0.16, 2.4]} />
        <meshStandardMaterial color="#20242f" />
      </mesh>
    </group>
  );
}

function ServiceBar() {
  return (
    <group position={[9.5, 0, 8]}>
      <mesh position={[0, 0.6, 0]} castShadow>
        <boxGeometry args={[5.6, 1.2, 1.2]} />
        <meshStandardMaterial color="#241c14" roughness={0.5} />
      </mesh>
      <mesh position={[0, 1.26, 0]}>
        <boxGeometry args={[5.8, 0.12, 1.35]} />
        <meshStandardMaterial color="#d9a441" metalness={0.6} roughness={0.3} emissive="#d9a441" emissiveIntensity={0.12} />
      </mesh>
      {/* POS terminal */}
      <mesh position={[2, 1.7, 0]} rotation={[-0.3, 0, 0]}>
        <boxGeometry args={[0.7, 0.5, 0.06]} />
        <meshStandardMaterial color="#0e1220" emissive="#4cc9f0" emissiveIntensity={0.55} />
      </mesh>
      <mesh position={[-1.6, 1.55, 0]}>
        <cylinderGeometry args={[0.3, 0.3, 0.5, 16]} />
        <meshStandardMaterial color="#1c2230" metalness={0.4} roughness={0.5} />
      </mesh>
    </group>
  );
}

/* ------------------------------ interplay ------------------------------ */

function CameraRig({ progressRef }: { progressRef: React.MutableRefObject<number> }) {
  const { camera } = useThree();
  const targetPos = useRef(new THREE.Vector3().copy(CAMERAS[0].pos));
  const targetLook = useRef(new THREE.Vector3().copy(CAMERAS[0].look));
  const curLook = useRef(new THREE.Vector3().copy(CAMERAS[0].look));

  useFrame((_, dt) => {
    const n = CAMERAS.length - 1;
    const p = Math.min(0.9999, Math.max(0, progressRef.current)) * n;
    const i = Math.floor(p);
    const t = smooth(p - i);
    const a = CAMERAS[i];
    const b = CAMERAS[Math.min(i + 1, n)];
    targetPos.current.lerpVectors(a.pos, b.pos, t);
    targetLook.current.lerpVectors(a.look, b.look, t);

    const damp = 1 - Math.pow(0.0015, Math.min(dt, 0.05));
    camera.position.lerp(targetPos.current, damp);
    curLook.current.lerp(targetLook.current, damp);
    camera.lookAt(curLook.current);
  });
  return null;
}

function ZoneGlow({ zone, active }: { zone: ZoneKey; active: boolean }) {
  const lightRef = useRef<THREE.PointLight>(null);
  const centers: Record<ZoneKey, [number, number, number]> = {
    dining: [1, 3, 4], menu: [4, 3.4, -10.5], kitchen: [-10, 3, -8], storage: [13, 3, -1], service: [9.5, 3, 8],
  };
  useFrame((_, dt) => {
    if (!lightRef.current) return;
    const goal = active ? 42 : 8;
    lightRef.current.intensity += (goal - lightRef.current.intensity) * Math.min(1, dt * 4);
  });
  return <pointLight ref={lightRef} position={centers[zone]} color="#d9a441" intensity={active ? 40 : 8} distance={18} decay={2} />;
}

function Labels({ activeZone }: { activeZone: ZoneKey }) {
  return (
    <>
      {ZONE_LABELS.map((l) => (
        <Html key={l.key} position={l.pos} center distanceFactor={26} zIndexRange={[10, 0]}>
          <div
            style={{
              fontFamily: "'Sora', sans-serif",
              fontSize: 13,
              letterSpacing: '0.14em',
              fontWeight: 700,
              color: l.key === activeZone ? '#f4d9a0' : 'rgba(190,198,216,0.55)',
              textShadow: l.key === activeZone ? '0 0 14px rgba(217,164,65,0.75)' : 'none',
              transition: 'color 400ms, text-shadow 400ms',
              textAlign: 'center',
              pointerEvents: 'none',
              whiteSpace: 'nowrap',
            }}
          >
            {l.title}
            <div style={{ fontSize: 8.5, letterSpacing: '0.2em', fontWeight: 500, opacity: 0.8, marginTop: 2 }}>
              {l.sub}
            </div>
          </div>
        </Html>
      ))}
    </>
  );
}

function Scene({ section }: { section: number }) {
  const zone = SECTION_ZONE[section] ?? 'dining';
  const all = zone === 'dining' && (section === 0 || section === 9);

  const tables = useMemo(
    () => [
      { x: -3.5, z: 0 }, { x: 1, z: 0 }, { x: 5.5, z: 0 },
      { x: -3.5, z: 5 }, { x: 1, z: 5 }, { x: 5.5, z: 5 },
      { x: -3.5, z: 10 }, { x: 1, z: 10 }, { x: 5.5, z: 10 },
    ],
    [],
  );

  return (
    <>
      <color attach="background" args={['#0a0d16']} />
      <fog attach="fog" args={['#0b0f1a', 36, 96]} />
      <ambientLight intensity={0.85} />
      <directionalLight position={[14, 24, 12]} intensity={1.7} color="#ffe9c9" />
      <directionalLight position={[-18, 14, -10]} intensity={0.5} color="#8fb2ff" />
      <pointLight position={[0, 10, 18]} intensity={30} distance={52} color="#5b8cff" />
      <pointLight position={[-16, 8, -6]} intensity={18} distance={36} color="#b48efc" />
      <pointLight position={[6, 9, 8]} intensity={16} distance={34} color="#ffd9a0" />

      {/* floor */}
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0, 0]} receiveShadow>
        <planeGeometry args={[40, 28]} />
        <meshStandardMaterial color="#161d2e" roughness={0.88} />
      </mesh>
      <Grid
        position={[0, 0.01, 0]} args={[40, 28]}
        cellSize={1.4} cellThickness={0.5} cellColor="#1b2233"
        sectionSize={7} sectionThickness={1} sectionColor="#2a3450"
        fadeDistance={52} fadeStrength={1.6} infiniteGrid={false}
      />

      {/* rug / dining zone plate */}
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[1, 0.02, 5]}>
        <planeGeometry args={[13.5, 14.5]} />
        <meshStandardMaterial color="#151a26" roughness={0.95} />
      </mesh>

      {tables.map((t, i) => <Table key={i} x={t.x} z={t.z} r={i * 0.7} />)}
      <Kitchen />
      <MenuWall />
      <Storage />
      <ServiceBar />

      {/* zone glows */}
      <ZoneGlow zone="dining" active={all || zone === 'dining'} />
      <ZoneGlow zone="menu" active={zone === 'menu'} />
      <ZoneGlow zone="kitchen" active={zone === 'kitchen'} />
      <ZoneGlow zone="storage" active={zone === 'storage'} />
      <ZoneGlow zone="service" active={zone === 'service'} />

      <Labels activeZone={zone} />

      <ContactShadows position={[0, 0.03, 0]} opacity={0.55} scale={46} blur={2.4} far={9} color="#000000" />
    </>
  );
}

/* ------------------------------ boundary ------------------------------ */

class GLBoundary extends Component<{ children: ReactNode; fallback: ReactNode }, { failed: boolean }> {
  state = { failed: false };
  static getDerivedStateFromError() { return { failed: true }; }
  render() {
    return this.state.failed ? this.props.fallback : this.props.children;
  }
}

export interface TwinProps {
  progressRef: React.MutableRefObject<number>;
  section: number;
}

export function RestaurantTwin({ progressRef, section }: TwinProps) {
  const fallback = <TwinBackdrop />;
  return (
    <GLBoundary fallback={fallback}>
      <Canvas
        dpr={[1, 1.6]}
        shadows={false}
        camera={{ position: [0, 17, 31], fov: 46, near: 0.5, far: 120 }}
        gl={{ antialias: true, powerPreference: 'high-performance' }}
        style={{ width: '100%', height: '100%' }}
      >
        <Suspense fallback={null}>
          <CameraRig progressRef={progressRef} />
          <Scene section={section} />
        </Suspense>
      </Canvas>
    </GLBoundary>
  );
}

/** CSS fallback when 3D is disabled or WebGL is unavailable. */
export function TwinBackdrop() {
  return (
    <div
      aria-hidden
      style={{
        position: 'absolute', inset: 0,
        background:
          'radial-gradient(700px 420px at 30% 30%, rgba(217,164,65,0.12), transparent 65%),' +
          'radial-gradient(700px 420px at 75% 65%, rgba(91,140,255,0.14), transparent 65%),' +
          'linear-gradient(160deg, #0b0f1a, #07090f)',
      }}
    >
      <svg viewBox="0 0 800 460" style={{ position: 'absolute', inset: '10% 8%', opacity: 0.4 }}>
        <g fill="none" stroke="#2a3450" strokeWidth="1.4">
          <rect x="40" y="40" width="720" height="380" rx="18" />
          <rect x="70" y="70" width="230" height="160" rx="10" />
          <rect x="330" y="70" width="260" height="120" rx="10" />
          <rect x="620" y="70" width="110" height="300" rx="10" />
          <rect x="70" y="270" width="520" height="120" rx="10" />
          <text x="80" y="95" fill="#7f8db0" fontSize="13" fontFamily="Sora" stroke="none">KITCHEN</text>
          <text x="340" y="95" fill="#7f8db0" fontSize="13" fontFamily="Sora" stroke="none">MENU WALL</text>
          <text x="632" y="95" fill="#7f8db0" fontSize="13" fontFamily="Sora" stroke="none">STORAGE</text>
          <text x="80" y="295" fill="#7f8db0" fontSize="13" fontFamily="Sora" stroke="none">DINING · SERVICE</text>
        </g>
      </svg>
    </div>
  );
}
