"use client";

import { Suspense } from "react";
import { Canvas } from "@react-three/fiber";
import { useEffectiveQuality } from "@/lib/device";
import GalaxyScene from "./GalaxyScene";

export default function Galaxy() {
  const quality = useEffectiveQuality();

  return (
    <div className="absolute inset-0">
      <Canvas
        dpr={quality === "high" ? [1, 1.9] : [1, 1.25]}
        camera={{ position: [0, 14, 21], fov: 45, near: 0.1, far: 260 }}
        gl={{ antialias: true, powerPreference: "high-performance" }}
      >
        <Suspense fallback={null}>
          <GalaxyScene />
        </Suspense>
      </Canvas>
    </div>
  );
}
