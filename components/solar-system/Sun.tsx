"use client";

import { useCallback, useMemo, useRef, useState } from "react";
import { useFrame } from "@react-three/fiber";
import { Html, useCursor } from "@react-three/drei";
import {
  AdditiveBlending,
  BackSide,
  Color,
  DoubleSide,
  MathUtils,
  type Group,
  type Mesh,
  type MeshBasicMaterial,
  type PointLight,
  type ShaderMaterial,
  type Sprite,
  type SpriteMaterial,
} from "three";
import { energySummary } from "@/lib/selectors";
import { useActiveSystem, useTaskStore } from "@/store/useTaskStore";
import { useGlowTexture } from "./textures";

const vertexShader = /* glsl */ `
  varying vec3 vPosition;
  void main() {
    vPosition = position;
    gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
  }
`;

const fragmentShader = /* glsl */ `
  uniform float uTime;
  uniform vec3 uAccent;
  varying vec3 vPosition;

  float hash(vec3 p) {
    return fract(sin(dot(p, vec3(127.1, 311.7, 74.7))) * 43758.5453);
  }

  float noise(vec3 p) {
    vec3 i = floor(p);
    vec3 f = fract(p);
    f = f * f * (3.0 - 2.0 * f);
    return mix(
      mix(
        mix(hash(i + vec3(0.0, 0.0, 0.0)), hash(i + vec3(1.0, 0.0, 0.0)), f.x),
        mix(hash(i + vec3(0.0, 1.0, 0.0)), hash(i + vec3(1.0, 1.0, 0.0)), f.x),
        f.y
      ),
      mix(
        mix(hash(i + vec3(0.0, 0.0, 1.0)), hash(i + vec3(1.0, 0.0, 1.0)), f.x),
        mix(hash(i + vec3(0.0, 1.0, 1.0)), hash(i + vec3(1.0, 1.0, 1.0)), f.x),
        f.y
      ),
      f.z
    );
  }

  void main() {
    vec3 p = normalize(vPosition) * 3.4;
    float n1 = noise(p + vec3(0.0, uTime * 0.08, 0.0));
    float n2 = noise(p * 2.3 - vec3(uTime * 0.05, 0.0, uTime * 0.03));
    float cells = smoothstep(0.2, 0.9, n1 * 0.72 + n2 * 0.4);

    vec3 deep = uAccent * 0.5;
    vec3 mid = mix(uAccent, vec3(1.0, 0.92, 0.78), 0.3);
    vec3 hot = mix(uAccent, vec3(1.0, 0.98, 0.94), 0.84);
    vec3 color = mix(deep, mid, cells);
    color = mix(color, hot, pow(cells, 2.4) * 0.85);
    color += uAccent * 0.22 * pow(cells, 3.0);

    gl_FragColor = vec4(color, 1.0);
  }
`;

const PROMINENCE_ANGLES = [0.2, 1.5, 2.7, 4.1, 5.4];

/** Thin plasma arcs that breathe around the star's limb. */
function Prominences({ color }: { color: string }) {
  const groupRef = useRef<Group>(null);
  const materials = useRef<MeshBasicMaterial[]>([]);

  useFrame((state, delta) => {
    if (groupRef.current) groupRef.current.rotation.z += delta * 0.018;
    materials.current.forEach((material, index) => {
      if (material) {
        material.opacity =
          0.2 + Math.sin(state.clock.elapsedTime * 1.2 + index * 1.6) * 0.11;
      }
    });
  });

  return (
    <group ref={groupRef}>
      {PROMINENCE_ANGLES.map((angle, index) => (
        <mesh key={angle} rotation={[index * 0.21, angle, angle * 0.4]}>
          <torusGeometry
            args={[
              1.63 + index * 0.035,
              0.02 + (index % 2) * 0.012,
              6,
              44,
              Math.PI * (0.42 + (index % 3) * 0.13),
            ]}
          />
          <meshBasicMaterial
            ref={(material) => {
              if (material) materials.current[index] = material;
            }}
            color={color}
            transparent
            opacity={0.22}
            blending={AdditiveBlending}
            side={DoubleSide}
            depthWrite={false}
            toneMapped={false}
          />
        </mesh>
      ))}
    </group>
  );
}

type SunProps = {
  onSunReady?: (mesh: Mesh | null) => void;
};

export default function Sun({ onSunReady }: SunProps) {
  const system = useActiveSystem();
  const openGoal = useTaskStore((state) => state.openGoal);

  const sunRef = useRef<Mesh>(null);
  const lightRef = useRef<PointLight>(null);
  const materialRef = useRef<ShaderMaterial>(null);
  const coronaRef = useRef<Sprite>(null);
  const coronaMaterialRef = useRef<SpriteMaterial>(null);
  const [hovered, setHovered] = useState(false);
  useCursor(hovered);

  const handleSunRef = useCallback(
    (mesh: Mesh | null) => {
      sunRef.current = mesh;
      onSunReady?.(mesh);
    },
    [onSunReady],
  );

  const glowTexture = useGlowTexture();
  const uniforms = useMemo(
    () => ({
      uTime: { value: 0 },
      uAccent: { value: new Color(system.accent) },
    }),
    [system.accent],
  );

  const tasks = system.tasks;
  const completed = tasks.filter((task) => task.completed).length;
  const total = tasks.length;
  const progress = total === 0 ? 0 : completed / total;
  const energy = energySummary(tasks, system.energyMinutes);
  const dim = energy.over
    ? 0.6
    : Math.max(0.7, 1 - Math.min(1, energy.ratio) * 0.3);
  const energyArc = Math.min(1, energy.ratio);

  useFrame((state, delta) => {
    const elapsed = state.clock.elapsedTime;
    if (materialRef.current) {
      materialRef.current.uniforms.uTime.value = elapsed;
    }
    if (sunRef.current) {
      sunRef.current.rotation.y += delta * 0.045;
    }
    if (lightRef.current) {
      lightRef.current.intensity = MathUtils.damp(
        lightRef.current.intensity,
        72 * dim,
        2.2,
        delta,
      );
    }
    if (coronaRef.current) {
      const size = 7.4 + Math.sin(elapsed * 0.8) * 0.16;
      coronaRef.current.scale.setScalar(size);
    }
    if (coronaMaterialRef.current) {
      const pulse = 0.42 + Math.sin(elapsed * 1.4) * 0.03;
      coronaMaterialRef.current.opacity = MathUtils.damp(
        coronaMaterialRef.current.opacity,
        pulse * dim,
        2.4,
        delta,
      );
    }
  });

  return (
    <group>
      <pointLight
        ref={lightRef}
        color={system.accent}
        intensity={72}
        distance={90}
        decay={2}
        position={[0, 0, 0]}
      />

      <mesh
        ref={handleSunRef}
        onClick={(event) => {
          event.stopPropagation();
          openGoal();
        }}
        onPointerOver={(event) => {
          event.stopPropagation();
          setHovered(true);
        }}
        onPointerOut={() => setHovered(false)}
      >
        <sphereGeometry args={[1.5, 64, 64]} />
        <shaderMaterial
          ref={materialRef}
          uniforms={uniforms}
          vertexShader={vertexShader}
          fragmentShader={fragmentShader}
        />
      </mesh>

      {/* Faint atmosphere that softens the edge of the disc. */}
      <mesh scale={1.22}>
        <sphereGeometry args={[1.5, 32, 32]} />
        <meshBasicMaterial
          color={system.accent}
          transparent
          opacity={0.09}
          blending={AdditiveBlending}
          side={BackSide}
          depthWrite={false}
          toneMapped={false}
        />
      </mesh>

      <Prominences color={system.accent} />

      <sprite ref={coronaRef} scale={7.4}>
        <spriteMaterial
          ref={coronaMaterialRef}
          map={glowTexture ?? undefined}
          color={system.accent}
          transparent
          opacity={0.42}
          blending={AdditiveBlending}
          depthWrite={false}
          toneMapped={false}
        />
      </sprite>

      {/* Progress ring: how much of today's orbit is complete. */}
      <group rotation={[-Math.PI / 2 - 0.06, 0, 0]}>
        <mesh>
          <ringGeometry args={[2.02, 2.1, 128]} />
          <meshBasicMaterial
            color="#9db4d6"
            transparent
            opacity={0.12}
            side={DoubleSide}
            depthWrite={false}
          />
        </mesh>
        {progress > 0 && (
          <mesh>
            <ringGeometry
              args={[2.0, 2.13, 128, 1, Math.PI / 2, progress * Math.PI * 2]}
            />
            <meshBasicMaterial
              color="#5eead4"
              transparent
              opacity={0.85}
              side={DoubleSide}
              blending={AdditiveBlending}
              depthWrite={false}
              toneMapped={false}
            />
          </mesh>
        )}
      </group>

      {/* Energy ring: daily effort budget, purely advisory. */}
      {energyArc > 0 && (
        <group rotation={[-Math.PI / 2 - 0.06, 0, 0]}>
          <mesh>
            <ringGeometry args={[2.24, 2.31, 128]} />
            <meshBasicMaterial
              color={energy.color}
              transparent
              opacity={0.2}
              side={DoubleSide}
              depthWrite={false}
            />
          </mesh>
          <mesh>
            <ringGeometry
              args={[2.23, 2.32, 128, 1, Math.PI / 2, energyArc * Math.PI * 2]}
            />
            <meshBasicMaterial
              color={energy.color}
              transparent
              opacity={0.7}
              side={DoubleSide}
              blending={AdditiveBlending}
              depthWrite={false}
              toneMapped={false}
            />
          </mesh>
        </group>
      )}

      {hovered && (
        <Html
          position={[0, 2.5, 0]}
          center
          distanceFactor={14}
          zIndexRange={[30, 0]}
          style={{ pointerEvents: "none" }}
        >
          <div
            className="planet-label"
            style={{ borderColor: `${system.accent}73` }}
          >
            <span
              className="h-1.5 w-1.5 rounded-full"
              style={{ background: system.accent }}
            />
            <span className="max-w-[190px] truncate">{system.mainGoal}</span>
            <span className="opacity-60">· ubah</span>
          </div>
        </Html>
      )}

      <mesh
        onClick={(event) => {
          event.stopPropagation();
          openGoal();
        }}
      >
        <sphereGeometry args={[1.68, 16, 16]} />
        <meshBasicMaterial transparent opacity={0} depthWrite={false} />
      </mesh>
    </group>
  );
}
