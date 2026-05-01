/// <reference types="@react-three/fiber" />
import React, { useRef, useMemo, useCallback, Suspense } from 'react';
import { Canvas, useFrame, useThree } from '@react-three/fiber';
import { Float, Text } from '@react-three/drei';
import { EffectComposer, Bloom } from '@react-three/postprocessing';
import * as THREE from 'three';

// ─── Shared mouse ref type ────────────────────────────────────
interface MouseRef { current: { x: number; y: number } }

// ═══ Cosmic Particles ════════════════════════════════════════
function CosmicParticles({ count = 1600 }: { count?: number }) {
  const ref = useRef<THREE.Points>(null);

  const { positions, colors } = useMemo(() => {
    const pos = new Float32Array(count * 3);
    const col = new Float32Array(count * 3);
    const palette = [
      new THREE.Color('#A5B4FC'),
      new THREE.Color('#B347EA'),
      new THREE.Color('#00F5FF'),
      new THREE.Color('#FF4D6D'),
    ];
    for (let i = 0; i < count; i++) {
      pos[i * 3]     = (Math.random() - 0.5) * 55;
      pos[i * 3 + 1] = (Math.random() - 0.5) * 32;
      pos[i * 3 + 2] = (Math.random() - 0.5) * 28 - 4;
      const c = palette[Math.floor(Math.random() * palette.length)];
      col[i * 3]     = c.r;
      col[i * 3 + 1] = c.g;
      col[i * 3 + 2] = c.b;
    }
    return { positions: pos, colors: col };
  }, [count]);

  useFrame((state) => {
    if (!ref.current) return;
    ref.current.rotation.y = state.clock.elapsedTime * 0.016;
    ref.current.rotation.x = Math.sin(state.clock.elapsedTime * 0.007) * 0.05;
  });

  return (
    <points ref={ref}>
      <bufferGeometry>
        <bufferAttribute attach="attributes-position" args={[positions, 3]} />
        <bufferAttribute attach="attributes-color"    args={[colors, 3]} />
      </bufferGeometry>
      <pointsMaterial
        size={0.065}
        vertexColors
        sizeAttenuation
        transparent
        opacity={0.88}
        depthWrite={false}
      />
    </points>
  );
}

// ═══ Crystal Core ═════════════════════════════════════════════
function CrystalCore({ mouseRef }: { mouseRef: MouseRef }) {
  const outerRef  = useRef<THREE.Mesh>(null);
  const innerRef  = useRef<THREE.Mesh>(null);
  const ring1Ref  = useRef<THREE.Mesh>(null);
  const ring2Ref  = useRef<THREE.Mesh>(null);
  const coreRef   = useRef<THREE.Mesh>(null);

  useFrame((state, delta) => {
    const t = state.clock.elapsedTime;
    const mx = mouseRef.current.x;
    const my = mouseRef.current.y;

    if (outerRef.current) {
      outerRef.current.rotation.x = THREE.MathUtils.lerp(
        outerRef.current.rotation.x, my * 0.55 + t * 0.065, 0.028
      );
      outerRef.current.rotation.y = THREE.MathUtils.lerp(
        outerRef.current.rotation.y, mx * 0.75 + t * 0.10, 0.028
      );
      (outerRef.current.material as THREE.MeshStandardMaterial).emissiveIntensity =
        0.45 + Math.sin(t * 1.7) * 0.18;
    }

    if (innerRef.current) {
      innerRef.current.rotation.x = -t * 0.09;
      innerRef.current.rotation.z =  t * 0.07;
      (innerRef.current.material as THREE.MeshStandardMaterial).emissiveIntensity =
        0.65 + Math.sin(t * 2.1 + 1.2) * 0.22;
    }

    if (ring1Ref.current) {
      ring1Ref.current.rotation.z = t * 0.14;
      ring1Ref.current.rotation.x = Math.sin(t * 0.35) * 0.28;
    }
    if (ring2Ref.current) {
      ring2Ref.current.rotation.z = -t * 0.09;
      ring2Ref.current.rotation.y = Math.cos(t * 0.42) * 0.22;
    }
    if (coreRef.current) {
      const s = 1 + Math.sin(t * 2.4) * 0.08;
      coreRef.current.scale.setScalar(s);
    }
  });

  return (
    <Float speed={0.7} rotationIntensity={0.12} floatIntensity={0.55}>
      <group>
        {/* Outer atmosphere sphere */}
        <mesh>
          <sphereGeometry args={[2.8, 32, 32]} />
          <meshStandardMaterial color="#B347EA" emissive="#B347EA" emissiveIntensity={0.08}
            transparent opacity={0.035} side={THREE.BackSide} depthWrite={false} />
        </mesh>

        {/* Outer wireframe crystal */}
        <mesh ref={outerRef}>
          <icosahedronGeometry args={[1.35, 1]} />
          <meshStandardMaterial color="#FF4D6D" emissive="#FF4D6D" emissiveIntensity={0.45}
            metalness={0.75} roughness={0.18} transparent opacity={0.32} wireframe />
        </mesh>

        {/* Inner solid crystal */}
        <mesh ref={innerRef}>
          <octahedronGeometry args={[0.88, 1]} />
          <meshStandardMaterial color="#FFB347" emissive="#FFB347" emissiveIntensity={0.65}
            metalness={0.92} roughness={0.06} transparent opacity={0.78} />
        </mesh>

        {/* Glowing ring 1 */}
        <mesh ref={ring1Ref} rotation={[Math.PI / 3.8, 0, 0]}>
          <torusGeometry args={[1.78, 0.038, 8, 128]} />
          <meshStandardMaterial color="#00F5FF" emissive="#00F5FF" emissiveIntensity={1.3}
            transparent opacity={0.85} depthWrite={false} />
        </mesh>

        {/* Glowing ring 2 */}
        <mesh ref={ring2Ref} rotation={[Math.PI / 2.2, Math.PI / 5, 0]}>
          <torusGeometry args={[1.55, 0.024, 8, 128]} />
          <meshStandardMaterial color="#FF4D6D" emissive="#FF4D6D" emissiveIntensity={1.0}
            transparent opacity={0.65} depthWrite={false} />
        </mesh>

        {/* White hot core */}
        <mesh ref={coreRef}>
          <sphereGeometry args={[0.38, 16, 16]} />
          <meshStandardMaterial color="#ffffff" emissive="#ffffff" emissiveIntensity={2.2}
            transparent opacity={0.9} />
        </mesh>
      </group>
    </Float>
  );
}

// ═══ Orbiting Language Glyphs ═════════════════════════════════
const GLYPHS = ['あ', 'ب', '中', 'ह', 'α', 'Ω', 'ψ', '∞', 'λ', 'Σ', 'ك', 'ต'];

function OrbitingGlyphs() {
  const groupRef = useRef<THREE.Group>(null);

  useFrame((state) => {
    if (!groupRef.current) return;
    groupRef.current.rotation.y = state.clock.elapsedTime * 0.088;
    groupRef.current.rotation.x = Math.sin(state.clock.elapsedTime * 0.11) * 0.10;
  });

  return (
    <group ref={groupRef}>
      {GLYPHS.map((glyph, i) => {
        const angle  = (i / GLYPHS.length) * Math.PI * 2;
        const radius = 2.45;
        const x = Math.cos(angle) * radius;
        const z = Math.sin(angle) * radius;
        const y = Math.sin(angle * 2.1) * 0.42;
        const opacity = 0.40 + (i % 3) * 0.14;
        return (
          <Text
            key={i}
            position={[x, y, z]}
            fontSize={0.21}
            color="#00F5FF"
            fillOpacity={opacity}
            anchorX="center"
            anchorY="middle"
          >
            {glyph}
          </Text>
        );
      })}
    </group>
  );
}

// ═══ Mouse Cursor Trail ═══════════════════════════════════════
function MouseTrail({ mouseRef }: { mouseRef: MouseRef }) {
  const ref      = useRef<THREE.Points>(null);
  const { viewport } = useThree();
  const TRAIL    = 18;
  const posData  = useRef(new Float32Array(TRAIL * 3).fill(99));

  useFrame(() => {
    const { x, y } = mouseRef.current;
    const wx = (x * viewport.width)  / 2;
    const wy = (y * viewport.height) / 2;

    // Shift existing trail back
    for (let i = (TRAIL - 1) * 3; i >= 3; i -= 3) {
      posData.current[i]     = posData.current[i - 3];
      posData.current[i + 1] = posData.current[i - 2];
      posData.current[i + 2] = posData.current[i - 1];
    }
    posData.current[0] = wx;
    posData.current[1] = wy;
    posData.current[2] = 1.2;

    const attr = ref.current?.geometry?.attributes?.position as THREE.BufferAttribute | undefined;
    if (attr) attr.needsUpdate = true;
  });

  return (
    <points ref={ref}>
      <bufferGeometry>
        <bufferAttribute attach="attributes-position" args={[posData.current, 3]} />
      </bufferGeometry>
      <pointsMaterial size={0.10} color="#FFB347" sizeAttenuation transparent opacity={0.75}
        depthWrite={false} />
    </points>
  );
}

// ═══ Full Scene ═══════════════════════════════════════════════
function CosmicScene({ mouseRef }: { mouseRef: MouseRef }) {
  return (
    <>
      <ambientLight intensity={0.18} />
      <pointLight position={[8,  8,  8]}  intensity={0.55} color="#FF4D6D" />
      <pointLight position={[-8, -5, -8]} intensity={0.35} color="#B347EA" />
      <pointLight position={[0,   2,  6]} intensity={0.22} color="#00F5FF" />

      <CosmicParticles count={1500} />
      <CrystalCore mouseRef={mouseRef} />
      <OrbitingGlyphs />
      <MouseTrail mouseRef={mouseRef} />

      <EffectComposer>
        <Bloom
          kernelSize={3}
          luminanceThreshold={0.12}
          luminanceSmoothing={0.025}
          intensity={2.2}
        />
      </EffectComposer>
    </>
  );
}

// ═══ Public Export ════════════════════════════════════════════
interface HeroCanvasProps {
  className?: string;
  style?: React.CSSProperties;
}

export default function HeroCanvas({ className, style }: HeroCanvasProps) {
  const mouseRef = useRef({ x: 0, y: 0 });

  const handleMouseMove = useCallback((e: React.MouseEvent<HTMLDivElement>) => {
    mouseRef.current = {
      x:  (e.clientX / window.innerWidth)  * 2 - 1,
      y: -(e.clientY / window.innerHeight) * 2 + 1,
    };
  }, []);

  const reduced = typeof window !== 'undefined'
    ? window.matchMedia('(prefers-reduced-motion: reduce)').matches
    : false;

  if (reduced) {
    return (
      <div className={className} style={{
        ...style,
        background: 'radial-gradient(ellipse at 50% 40%, #1a1f40 0%, #0B0E1A 70%)',
      }} />
    );
  }

  return (
    <div className={className} style={style} onMouseMove={handleMouseMove}>
      <Canvas
        camera={{ position: [0, 0, 5.5], fov: 58 }}
        dpr={[1, Math.min(typeof window !== 'undefined' ? window.devicePixelRatio : 1, 2)]}
        gl={{ antialias: true, alpha: true, powerPreference: 'high-performance' }}
        style={{ background: 'transparent', width: '100%', height: '100%' }}
      >
        <Suspense fallback={null}>
          <CosmicScene mouseRef={mouseRef} />
        </Suspense>
      </Canvas>
    </div>
  );
}
