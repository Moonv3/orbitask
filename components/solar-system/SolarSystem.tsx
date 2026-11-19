"use client";

import { Suspense } from "react";
import { Canvas } from "@react-three/fiber";
import { useTaskStore } from "@/store/useTaskStore";
import Scene from "./Scene";

type SolarSystemProps = {
  autoRotate: boolean;
  resetSignal: number;
};

export default function SolarSystem({
  autoRotate,
  resetSignal,
}: SolarSystemProps) {
  const quality = useTaskStore((state) => state.settings.quality);

  return (
    <div className="absolute inset-0">
      <Canvas
        dpr={quality === "high" ? [1, 1.9] : [1, 1.25]}
        camera={{ position: [0, 8, 15], fov: 42, near: 0.1, far: 240 }}
        gl={{ antialias: true, powerPreference: "high-performance" }}
        onPointerMissed={() => useTaskStore.getState().selectTask(null)}
      >
        <Suspense fallback={null}>
          <Scene autoRotate={autoRotate} resetSignal={resetSignal} />
        </Suspense>
      </Canvas>
    </div>
  );
}
