"use client";

import { useMemo, useRef, useState } from "react";
import { useFrame } from "@react-three/fiber";
import { Html, useCursor } from "@react-three/drei";
import {
  AdditiveBlending,
  DoubleSide,
  type Group,
  type Mesh,
  type Sprite,
} from "three";
import { formatMinutes } from "@/lib/format";
import { energySummary } from "@/lib/selectors";
import { useTaskStore } from "@/store/useTaskStore";
import type { Point3, System } from "@/lib/types";
import { useGlowTexture } from "../solar-system/textures";

type SystemStarProps = {
  system: System;
  position: Point3;
  index: number;
  active: boolean;
};

export default function SystemStar({
  system,
  position,
  index,
  active,
}: SystemStarProps) {
  const enterSystem = useTaskStore((state) => state.enterSystem);
  const openSystem = useTaskStore((state) => state.openSystem);

  const groupRef = useRef<Group>(null);
  const orbitRef = useRef<Group>(null);
  const haloRef = useRef<Sprite>(null);
  const activeRingRef = useRef<Mesh>(null);
  const [hovered, setHovered] = useState(false);
  useCursor(hovered && !system.archived);

  const glow = useGlowTexture(0.12);
  const tasks = system.tasks;
  const done = tasks.filter((task) => task.completed).length;
  const progress = tasks.length === 0 ? 0 : done / tasks.length;
  const energy = energySummary(tasks, system.energyMinutes);

  const moons = useMemo(
    () =>
      tasks.slice(0, 9).map((task, taskIndex, visible) => {
        const angle = (taskIndex / Math.max(1, visible.length)) * Math.PI * 2;
        const radius = 0.86 + (taskIndex % 3) * 0.17;
        return {
          id: task.id,
          color: task.color,
          x: Math.cos(angle) * radius,
          y: taskIndex % 2 === 0 ? 0.08 : -0.08,
          z: Math.sin(angle) * radius,
        };
      }),
    [tasks],
  );

  useFrame((state, delta) => {
    const elapsed = state.clock.elapsedTime;
    if (groupRef.current) {
      groupRef.current.position.y =
        position[1] + Math.sin(elapsed * 0.55 + index * 1.3) * 0.12;
    }
    if (orbitRef.current) {
      orbitRef.current.rotation.y += delta * 0.14;
    }
    if (haloRef.current) {
      const base = active ? 3.5 : 2.7;
      haloRef.current.scale.setScalar(
        base + Math.sin(elapsed * 1.1 + index) * (active ? 0.18 : 0.1),
      );
    }
    if (activeRingRef.current) {
      const pulse = 1 + Math.sin(elapsed * 1.8) * 0.035;
      activeRingRef.current.scale.setScalar(pulse);
    }
  });

  const handleEnter = () => {
    if (system.archived) openSystem();
    else enterSystem(system.id);
  };

  return (
    <group ref={groupRef} position={position}>
      <sprite ref={haloRef} scale={active ? 3.5 : 2.7}>
        <spriteMaterial
          map={glow ?? undefined}
          color={system.accent}
          transparent
          opacity={system.archived ? 0.13 : active ? 0.5 : 0.3}
          blending={AdditiveBlending}
          depthWrite={false}
          toneMapped={false}
        />
      </sprite>

      {active && (
        <mesh ref={activeRingRef} rotation={[-Math.PI / 2, 0, 0]}>
          <ringGeometry args={[1.02, 1.07, 96]} />
          <meshBasicMaterial
            color={system.accent}
            transparent
            opacity={0.45}
            side={DoubleSide}
            blending={AdditiveBlending}
            depthWrite={false}
            toneMapped={false}
          />
        </mesh>
      )}

      <mesh rotation={[-Math.PI / 2, 0, 0]}>
        <ringGeometry args={[0.63, 0.69, 72]} />
        <meshBasicMaterial
          color="#93a4c9"
          transparent
          opacity={0.2}
          side={DoubleSide}
          depthWrite={false}
        />
      </mesh>

      {progress > 0 && (
        <mesh rotation={[-Math.PI / 2, 0, 0]}>
          <ringGeometry
            args={[0.61, 0.71, 72, 1, Math.PI / 2, progress * Math.PI * 2]}
          />
          <meshBasicMaterial
            color={system.archived ? "#7b86a6" : "#5eead4"}
            transparent
            opacity={0.9}
            side={DoubleSide}
            blending={AdditiveBlending}
            depthWrite={false}
            toneMapped={false}
          />
        </mesh>
      )}

      <group ref={orbitRef}>
        {moons.map((moon) => (
          <mesh key={moon.id} position={[moon.x, moon.y, moon.z]}>
            <sphereGeometry args={[0.075, 10, 10]} />
            <meshBasicMaterial
              color={moon.color}
              transparent
              opacity={system.archived ? 0.45 : 1}
              toneMapped={false}
            />
          </mesh>
        ))}
      </group>

      <mesh>
        <icosahedronGeometry args={[0.34, 2]} />
        <meshBasicMaterial
          color={system.archived ? "#646d8a" : system.accent}
          transparent
          opacity={system.archived ? 0.65 : 1}
          toneMapped={false}
        />
      </mesh>

      <mesh
        onClick={(event) => {
          event.stopPropagation();
          handleEnter();
        }}
        onPointerOver={(event) => {
          event.stopPropagation();
          setHovered(true);
        }}
        onPointerOut={() => setHovered(false)}
      >
        <sphereGeometry args={[1.18, 16, 16]} />
        <meshBasicMaterial transparent opacity={0} depthWrite={false} />
      </mesh>

      {hovered && (
        <Html
          position={[0, 1.45, 0]}
          center
          distanceFactor={13}
          zIndexRange={[30, 0]}
          style={{ pointerEvents: "none" }}
        >
          <div className="flex flex-col items-center">
            <div
              className="planet-label"
              style={{ borderColor: `${system.accent}73` }}
            >
              <span
                className="h-1.5 w-1.5 rounded-full"
                style={{ background: system.accent }}
              />
              <span className="max-w-[176px] truncate">{system.name}</span>
              <span className="opacity-60">
                · {system.archived ? "arsip" : active ? "aktif" : "masuk"}
              </span>
            </div>
            <p className="mt-1.5 whitespace-nowrap rounded-full bg-[#060a14]/85 px-2.5 py-1 font-mono text-[9.5px] text-white/60 backdrop-blur">
              {done}/{tasks.length} tugas · {formatMinutes(energy.used)} /{" "}
              {formatMinutes(energy.budget)}
            </p>
          </div>
        </Html>
      )}
    </group>
  );
}
