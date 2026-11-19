"use client";

import { useMemo, useRef } from "react";
import { useFrame } from "@react-three/fiber";
import { Line, OrbitControls, Stars } from "@react-three/drei";
import { Bloom, EffectComposer, Vignette } from "@react-three/postprocessing";
import { AdditiveBlending, type Sprite, type SpriteMaterial } from "three";
import { galaxyLayout } from "@/lib/galaxy";
import { useTaskStore } from "@/store/useTaskStore";
import { useGlowTexture } from "../solar-system/textures";
import SystemStar from "./SystemStar";

type CloudProps = {
  position: [number, number, number];
  color: string;
  scale: number;
  opacity: number;
};

function NebulaCloud({ position, color, scale, opacity }: CloudProps) {
  const glow = useGlowTexture(0.04);
  return (
    <sprite position={position} scale={scale}>
      <spriteMaterial
        map={glow ?? undefined}
        color={color}
        transparent
        opacity={opacity}
        blending={AdditiveBlending}
        depthWrite={false}
        toneMapped={false}
      />
    </sprite>
  );
}

function GalaxyCore() {
  const spriteRef = useRef<Sprite>(null);
  const materialRef = useRef<SpriteMaterial>(null);
  const glow = useGlowTexture(0.06);

  useFrame((state) => {
    const elapsed = state.clock.elapsedTime;
    if (spriteRef.current) {
      spriteRef.current.scale.setScalar(12.5 + Math.sin(elapsed * 0.3) * 0.6);
    }
    if (materialRef.current) {
      materialRef.current.opacity = 0.15 + Math.sin(elapsed * 0.5) * 0.025;
    }
  });

  return (
    <sprite ref={spriteRef} scale={12.5}>
      <spriteMaterial
        ref={materialRef}
        map={glow ?? undefined}
        color="#8ea2ff"
        transparent
        opacity={0.15}
        blending={AdditiveBlending}
        depthWrite={false}
        toneMapped={false}
      />
    </sprite>
  );
}

export default function GalaxyScene() {
  const systems = useTaskStore((state) => state.systems);
  const activeSystemId = useTaskStore((state) => state.activeSystemId);
  const quality = useTaskStore((state) => state.settings.quality);

  const nodes = useMemo(() => galaxyLayout(systems.length), [systems.length]);

  return (
    <>
      <color attach="background" args={["#03040d"]} />
      <fog attach="fog" args={["#03040d", 34, 95]} />

      <ambientLight intensity={0.8} color="#9fb2ff" />
      <directionalLight
        position={[6, 12, 8]}
        intensity={0.35}
        color="#8ea2ff"
      />

      <Stars
        radius={110}
        depth={50}
        count={quality === "high" ? 2800 : 1200}
        factor={3.4}
        saturation={0.12}
        fade
        speed={quality === "high" ? 0.22 : 0.1}
      />

      <NebulaCloud
        position={[-8, -3, -12]}
        color="#6d5cff"
        scale={20}
        opacity={0.12}
      />
      <NebulaCloud
        position={[10, 4, -14]}
        color="#2a9d8f"
        scale={17}
        opacity={0.08}
      />
      <GalaxyCore />

      {nodes.slice(0, -1).map((node, index) => (
        <Line
          key={`route-${index}`}
          points={[node.position, nodes[index + 1].position]}
          color="#7183c4"
          lineWidth={1}
          transparent
          opacity={0.2}
        />
      ))}

      {systems.map((system, index) => (
        <SystemStar
          key={system.id}
          system={system}
          position={nodes[index].position}
          index={index}
          active={system.id === activeSystemId}
        />
      ))}

      <OrbitControls
        makeDefault
        enableDamping
        dampingFactor={0.06}
        enablePan={false}
        minDistance={9}
        maxDistance={46}
        minPolarAngle={0.18}
        maxPolarAngle={Math.PI * 0.82}
        autoRotate
        autoRotateSpeed={0.16}
      />

      {quality === "high" && (
        <EffectComposer>
          <Bloom
            mipmapBlur
            intensity={1.05}
            luminanceThreshold={0.5}
            luminanceSmoothing={0.3}
            radius={0.75}
          />
          <Vignette eskil={false} offset={0.22} darkness={0.72} />
        </EffectComposer>
      )}
    </>
  );
}
