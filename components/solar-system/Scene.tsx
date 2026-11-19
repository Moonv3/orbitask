"use client";

import { Suspense, useMemo, useState } from "react";
import { Stars } from "@react-three/drei";
import {
  Bloom,
  ChromaticAberration,
  DepthOfField,
  EffectComposer,
  GodRays,
  LensFlare,
  Noise,
  Vignette,
} from "@react-three/postprocessing";
import { BlendFunction } from "postprocessing";
import { Color, type Mesh } from "three";
import { useActiveSystem, useTaskStore } from "@/store/useTaskStore";
import { MilkyWay, NebulaCloud } from "./Atmosphere";
import CameraRig from "./CameraRig";
import Planet from "./Planet";
import Sun from "./Sun";

type SceneProps = {
  autoRotate: boolean;
  resetSignal: number;
};

export default function Scene({ autoRotate, resetSignal }: SceneProps) {
  const system = useActiveSystem();
  const quality = useTaskStore((state) => state.settings.quality);
  const tasks = system.tasks;
  const [sunMesh, setSunMesh] = useState<Mesh | null>(null);
  const flareColor = useMemo(() => new Color(system.accent), [system.accent]);

  return (
    <>
      <color attach="background" args={["#04060f"]} />
      <fog attach="fog" args={["#04060f", 42, 105]} />

      <ambientLight intensity={0.55} color="#a9bcff" />
      <directionalLight
        position={[8, 16, 9]}
        intensity={0.45}
        color="#7fa8ff"
      />

      <NebulaCloud
        position={[-16, 7, -42]}
        color="#6d5cff"
        scale={30}
        opacity={0.11}
      />
      <NebulaCloud
        position={[18, -6, -46]}
        color="#2a9d8f"
        scale={26}
        opacity={0.07}
      />
      <MilkyWay count={quality === "high" ? 1300 : 520} />

      <Stars
        radius={95}
        depth={45}
        count={quality === "high" ? 2400 : 1100}
        factor={3.2}
        saturation={0}
        fade
        speed={quality === "high" ? 0.25 : 0.12}
      />

      <Suspense fallback={null}>
        <group key={system.id}>
          <Sun onSunReady={setSunMesh} />
          {tasks.map((task) => (
            <Planet key={task.id} task={task} />
          ))}
        </group>
      </Suspense>

      <CameraRig autoRotate={autoRotate} resetSignal={resetSignal} />

      {quality === "high" && sunMesh && (
        <EffectComposer>
          <GodRays
            sun={sunMesh}
            density={0.92}
            decay={0.94}
            weight={0.3}
            exposure={0.32}
            samples={42}
            clampMax={1}
          />
          <Bloom
            mipmapBlur
            intensity={0.9}
            luminanceThreshold={0.55}
            luminanceSmoothing={0.25}
            radius={0.72}
          />
          <DepthOfField
            target={[0, 0, 0]}
            focalLength={0.035}
            bokehScale={1.5}
            height={480}
          />
          <ChromaticAberration
            offset={[0.00035, 0.0005]}
            radialModulation
            modulationOffset={0.35}
          />
          <LensFlare
            lensPosition={[0, 0, 0]}
            colorGain={flareColor}
            glareSize={0.34}
            flareSize={0.11}
            starPoints={6}
            haloScale={0.6}
            opacity={0.32}
            animated
          />
          <Noise opacity={0.03} blendFunction={BlendFunction.SOFT_LIGHT} />
          <Vignette eskil={false} offset={0.2} darkness={0.78} />
        </EffectComposer>
      )}
    </>
  );
}
