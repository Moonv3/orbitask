"use client";

import { useEffect, useMemo, useRef } from "react";
import { useFrame, useThree } from "@react-three/fiber";
import { OrbitControls } from "@react-three/drei";
import type { ComponentRef } from "react";
import { Vector3 } from "three";
import { maxOrbitRadius, orbitPosition } from "@/lib/orbit";
import { effectiveOrbit } from "@/lib/selectors";
import { useActiveSystem, useTaskStore } from "@/store/useTaskStore";

type CameraRigProps = {
  autoRotate: boolean;
  resetSignal: number;
};

export default function CameraRig({
  autoRotate,
  resetSignal,
}: CameraRigProps) {
  const controlsRef = useRef<ComponentRef<typeof OrbitControls>>(null);
  const { camera, size } = useThree();

  const system = useActiveSystem();
  const tasks = system.tasks;
  const selectedId = useTaskStore((state) => state.selectedId);
  const selected = useMemo(
    () => tasks.find((task) => task.id === selectedId) ?? null,
    [tasks, selectedId],
  );

  const focusing = useRef(false);
  const resetting = useRef(false);
  const initialized = useRef(false);
  const lastSelected = useRef<string | null>(null);
  const lastReset = useRef(resetSignal);

  const vectors = useRef({
    desired: new Vector3(),
    cameraGoal: new Vector3(),
    outward: new Vector3(),
    homeTarget: new Vector3(),
    scratch: new Vector3(),
  });
  const maxRadius = maxOrbitRadius(tasks);

  const home = useMemo(() => {
    const aspect = size.width / Math.max(size.height, 1);
    const base = Math.max(15, maxRadius * 1.35 + 3.2);
    const scale = aspect < 1.05 ? 1.38 : aspect < 1.4 ? 1.16 : 1;
    const distance = base * scale;
    return new Vector3(0, distance * 0.46, distance * 0.9);
  }, [maxRadius, size.width, size.height]);

  useEffect(() => {
    if (selectedId === lastSelected.current) return;
    lastSelected.current = selectedId;
    if (selectedId) {
      focusing.current = true;
      resetting.current = false;
    } else {
      focusing.current = false;
    }
  }, [selectedId]);

  useEffect(() => {
    if (resetSignal === lastReset.current) return;
    lastReset.current = resetSignal;
    focusing.current = false;
    resetting.current = true;
  }, [resetSignal]);

  useFrame((state, delta) => {
    const controls = controlsRef.current;
    if (!controls) return;

    if (!initialized.current) {
      camera.position.copy(home);
      controls.target.set(0, 0, 0);
      controls.update();
      initialized.current = true;
    }

    controls.autoRotate =
      autoRotate && !selected && !resetting.current && !focusing.current;

    const alpha = 1 - Math.exp(-3.4 * delta);

    if (focusing.current && selected) {
      const [x, y, z] = orbitPosition(
        effectiveOrbit(selected),
        state.clock.elapsedTime,
      );
      const { desired, outward, cameraGoal, scratch } = vectors.current;
      desired.set(x, y, z);

      outward.set(x, 0, z);
      if (outward.lengthSq() > 0) {
        outward.normalize().multiplyScalar(4.6);
      }
      outward.y = 2.3;

      cameraGoal.copy(desired).add(outward);
      camera.position.lerp(cameraGoal, alpha);
      scratch.copy(desired);
      controls.target.lerp(scratch, Math.min(1, alpha * 1.5));
      controls.update();
    } else if (resetting.current) {
      camera.position.lerp(home, alpha * 0.9);
      controls.target.lerp(vectors.current.homeTarget, alpha * 0.9);
      controls.update();
      if (camera.position.distanceTo(home) < 0.08) {
        resetting.current = false;
      }
    }
  });

  return (
    <OrbitControls
      ref={controlsRef}
      makeDefault
      enableDamping
      dampingFactor={0.07}
      enablePan={false}
      minDistance={4.2}
      maxDistance={75}
      minPolarAngle={0.16}
      maxPolarAngle={Math.PI * 0.86}
      autoRotateSpeed={0.35}
      onStart={() => {
        focusing.current = false;
        resetting.current = false;
      }}
    />
  );
}
