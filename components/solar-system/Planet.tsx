"use client";

import { useMemo, useRef, useState, type RefObject } from "react";
import { useFrame } from "@react-three/fiber";
import { Billboard, Html, Line, Trail, useCursor } from "@react-three/drei";
import {
  AdditiveBlending,
  BackSide,
  Color,
  DoubleSide,
  MathUtils,
  type Group,
  type Mesh,
  type MeshBasicMaterial,
  type Object3D,
  type ShaderMaterial,
  type Sprite,
  type SpriteMaterial,
} from "three";
import { orbitPath, orbitPosition } from "@/lib/orbit";
import { PRIORITY_META } from "@/lib/palette";
import { effectiveOrbit, isComet, taskMoonProgress } from "@/lib/selectors";
import { useTaskStore } from "@/store/useTaskStore";
import type { Subtask, Task } from "@/lib/types";
import { planetFragmentShader, planetVertexShader } from "./planetShader";
import { useGlowTexture } from "./textures";

type MoonProps = {
  subtask: Subtask;
  index: number;
  parentSize: number;
  color: string;
};

function Moon({ subtask, index, parentSize, color }: MoonProps) {
  const moonRef = useRef<Group>(null);
  const radius = parentSize * (1.85 + index * 0.5);
  const speed = 0.85 / Math.sqrt(radius / 0.4);
  const phase = index * 2.39996;
  const size = Math.max(0.026, parentSize * 0.17);

  useFrame((state) => {
    if (!moonRef.current) return;
    const angle = phase + state.clock.elapsedTime * speed;
    moonRef.current.position.set(
      Math.cos(angle) * radius,
      Math.sin(angle * 1.3 + index) * parentSize * 0.2,
      Math.sin(angle) * radius,
    );
  });

  return (
    <group ref={moonRef}>
      <mesh>
        <sphereGeometry args={[size, 14, 12]} />
        <meshStandardMaterial
          color={subtask.completed ? "#c9fff0" : color}
          emissive={subtask.completed ? "#5eead4" : color}
          emissiveIntensity={subtask.completed ? 1.4 : 0.08}
          roughness={0.45}
          metalness={0.2}
        />
      </mesh>
    </group>
  );
}

type PlanetProps = {
  task: Task;
};

export default function Planet({ task }: PlanetProps) {
  const selectedId = useTaskStore((state) => state.selectedId);
  const selectTask = useTaskStore((state) => state.selectTask);
  const quality = useTaskStore((state) => state.settings.quality);

  const selected = selectedId === task.id;
  const [hovered, setHovered] = useState(false);
  useCursor(hovered);

  const groupRef = useRef<Group>(null);
  const bodyRef = useRef<Group>(null);
  const planetRef = useRef<Mesh>(null);
  const materialRef = useRef<ShaderMaterial>(null);
  const glowRef = useRef<Sprite>(null);
  const haloRef = useRef<Group>(null);
  const haloMaterialRef = useRef<MeshBasicMaterial>(null);
  const selectionMaterialRef = useRef<MeshBasicMaterial>(null);
  const spawn = useRef(0.001);

  const glowTexture = useGlowTexture(0.2);
  const orbit = useMemo(() => effectiveOrbit(task), [task]);
  const path = useMemo(() => orbitPath(orbit), [orbit]);
  const comet = isComet(task);
  const hasRing =
    task.priority !== "low" && Math.sin(task.orbit.phase * 1.7) > 0.05;
  const moons = taskMoonProgress(task);
  const meta = PRIORITY_META[task.priority];
  const uniforms = useMemo(
    () => ({
      uTime: { value: 0 },
      uColor: { value: new Color(task.color) },
      uCompleted: { value: task.completed ? 1 : 0 },
      uComet: { value: comet ? 1 : 0 },
    }),
    [task.color, task.completed, comet],
  );

  const trailColor = comet
    ? "#ff7a3c"
    : task.completed
      ? "#9fffe4"
      : task.color;

  const lineOpacity = selected
    ? 0.75
    : hovered
      ? 0.45
      : task.completed
        ? 0.3
        : comet
          ? 0.48
          : 0.14;

  useFrame((state, delta) => {
    const elapsed = state.clock.elapsedTime;
    const [x, y, z] = orbitPosition(orbit, elapsed);

    if (groupRef.current) {
      groupRef.current.position.set(x, y, z);
    }

    spawn.current = MathUtils.damp(spawn.current, 1, 4.5, delta);
    if (bodyRef.current) {
      const hoverScale = hovered ? 1.16 : 1;
      bodyRef.current.scale.setScalar(spawn.current * hoverScale);
    }

    if (planetRef.current) {
      planetRef.current.rotation.y += delta * 0.32;
    }

    if (materialRef.current) {
      const material = materialRef.current;
      material.uniforms.uTime.value = elapsed;
      material.uniforms.uCompleted.value = MathUtils.damp(
        material.uniforms.uCompleted.value,
        task.completed ? 1 : 0,
        3.5,
        delta,
      );
      material.uniforms.uComet.value = MathUtils.damp(
        material.uniforms.uComet.value,
        comet ? 1 : 0,
        2.8,
        delta,
      );
    }

    if (glowRef.current) {
      const material = glowRef.current.material as SpriteMaterial;
      const pulse = 0.52 + Math.sin(elapsed * 2 + orbit.phase) * 0.09;
      const target = task.completed ? pulse : comet ? 0.2 : 0;
      material.opacity = MathUtils.damp(material.opacity, target, 3, delta);
      const size = task.size * (task.completed ? 6.4 : comet ? 5 : 4);
      glowRef.current.scale.setScalar(size);
    }

    if (haloRef.current && haloMaterialRef.current) {
      const pulse = 0.5 + Math.sin(elapsed * 2.2 + orbit.phase) * 0.16;
      haloMaterialRef.current.opacity = MathUtils.damp(
        haloMaterialRef.current.opacity,
        task.completed ? pulse : 0,
        3,
        delta,
      );
      haloRef.current.scale.setScalar(
        1 + Math.sin(elapsed * 1.8 + orbit.phase) * 0.06,
      );
    }

    if (selectionMaterialRef.current) {
      selectionMaterialRef.current.opacity = MathUtils.damp(
        selectionMaterialRef.current.opacity,
        selected ? 0.75 : 0,
        4,
        delta,
      );
    }
  });

  return (
    <>
      <Line
        points={path}
        color={
          comet ? "#ff8a4c" : task.completed ? "#9fffe4" : task.color
        }
        lineWidth={selected ? 1.7 : 1}
        transparent
        opacity={lineOpacity}
        depthWrite={false}
      />

      {quality === "high" && (
        <Trail
          target={groupRef as unknown as RefObject<Object3D>}
          color={trailColor}
          width={task.size * (comet ? 0.55 : 0.42)}
          length={comet ? 9 : task.completed ? 4 : 6}
          decay={comet ? 1.1 : 1.8}
          attenuation={(width) => width * 0.65}
        />
      )}

      <group ref={groupRef}>
        <group ref={bodyRef} scale={0.001}>
          <mesh ref={planetRef}>
            <sphereGeometry args={[task.size, 40, 28]} />
            <shaderMaterial
              ref={materialRef}
              uniforms={uniforms}
              vertexShader={planetVertexShader}
              fragmentShader={planetFragmentShader}
            />
          </mesh>

          {/* Thin atmosphere rim */}
          <mesh scale={1.22}>
            <sphereGeometry args={[task.size, 24, 24]} />
            <meshBasicMaterial
              color={comet ? "#ff8a4c" : task.color}
              transparent
              opacity={comet ? 0.22 : 0.14}
              blending={AdditiveBlending}
              side={BackSide}
              depthWrite={false}
              toneMapped={false}
            />
          </mesh>

          {hasRing && (
            <group rotation={[1.18, 0.24, 0.18]}>
              <mesh>
                <ringGeometry args={[task.size * 1.5, task.size * 2.36, 96]} />
                <meshBasicMaterial
                  color={task.color}
                  transparent
                  opacity={0.3}
                  side={DoubleSide}
                  blending={AdditiveBlending}
                  depthWrite={false}
                  toneMapped={false}
                />
              </mesh>
              <mesh>
                <ringGeometry args={[task.size * 1.86, task.size * 2.04, 96]} />
                <meshBasicMaterial
                  color="#e8f0ff"
                  transparent
                  opacity={0.16}
                  side={DoubleSide}
                  depthWrite={false}
                  toneMapped={false}
                />
              </mesh>
            </group>
          )}

          <sprite ref={glowRef} scale={task.size * 4}>
            <spriteMaterial
              map={glowTexture ?? undefined}
              color={
                task.completed
                  ? "#c9fff0"
                  : comet
                    ? "#ff8a4c"
                    : task.color
              }
              transparent
              opacity={0}
              blending={AdditiveBlending}
              depthWrite={false}
              toneMapped={false}
            />
          </sprite>

          {/* Completed: a soft pulsing halo */}
          <Billboard ref={haloRef} position={[0, 0, 0]}>
            <mesh>
              <ringGeometry args={[task.size * 1.55, task.size * 1.74, 64]} />
              <meshBasicMaterial
                ref={haloMaterialRef}
                color="#c9fff0"
                transparent
                opacity={0}
                blending={AdditiveBlending}
                side={DoubleSide}
                depthWrite={false}
                toneMapped={false}
              />
            </mesh>
          </Billboard>

          {/* Selected: a crisp target ring */}
          <Billboard position={[0, 0, 0]}>
            <mesh>
              <ringGeometry args={[task.size * 2.05, task.size * 2.14, 64]} />
              <meshBasicMaterial
                ref={selectionMaterialRef}
                color="#e6f0ff"
                transparent
                opacity={0}
                side={DoubleSide}
                depthWrite={false}
                toneMapped={false}
              />
            </mesh>
          </Billboard>

          {task.subtasks.map((subtask, index) => (
            <Moon
              key={subtask.id}
              subtask={subtask}
              index={index}
              parentSize={task.size}
              color={task.color}
            />
          ))}

          {/* Invisible but easy to hit */}
          <mesh
            onClick={(event) => {
              event.stopPropagation();
              selectTask(task.id);
            }}
            onPointerOver={(event) => {
              event.stopPropagation();
              setHovered(true);
            }}
            onPointerOut={() => setHovered(false)}
          >
            <sphereGeometry args={[task.size * 2, 16, 16]} />
            <meshBasicMaterial transparent opacity={0} depthWrite={false} />
          </mesh>
        </group>

        {(hovered || selected) && (
          <Html
            position={[0, task.size + 0.48, 0]}
            center
            distanceFactor={11}
            zIndexRange={[20, 0]}
            style={{ pointerEvents: "none" }}
          >
            <div
              className="planet-label"
              style={{ borderColor: `${task.color}55` }}
            >
              <span
                className="h-1.5 w-1.5 shrink-0 rounded-full"
                style={{ background: comet ? "#ff8a4c" : meta.color }}
              />
              <span className="max-w-[190px] truncate">{task.title}</span>
              {moons.total > 0 && (
                <span className="font-mono text-[9px] opacity-70">
                  · {moons.done}/{moons.total} bulan
                </span>
              )}
              {comet && <span style={{ color: "#ff8a4c" }}>☄</span>}
              {task.completed && (
                <span style={{ color: "#5eead4" }}>✓</span>
              )}
            </div>
          </Html>
        )}
      </group>
    </>
  );
}
