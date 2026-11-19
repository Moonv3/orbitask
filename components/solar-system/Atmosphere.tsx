"use client";

import { useEffect, useMemo, useRef } from "react";
import { useFrame } from "@react-three/fiber";
import {
  AdditiveBlending,
  BufferAttribute,
  BufferGeometry,
  type ShaderMaterial,
} from "three";
import { useGlowTexture } from "./textures";

type CloudProps = {
  position: [number, number, number];
  color: string;
  scale: number;
  opacity: number;
};

/** Soft nebula wash, shared by the solar system and the galaxy map. */
export function NebulaCloud({ position, color, scale, opacity }: CloudProps) {
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

const vertexShader = /* glsl */ `
  attribute float aPhase;
  attribute float aSize;
  attribute vec3 aColor;
  uniform float uTime;
  varying float vAlpha;
  varying vec3 vColor;

  void main() {
    vColor = aColor;
    float twinkle = 0.55 + 0.45 * sin(uTime * (0.7 + aPhase * 0.11) + aPhase);
    vAlpha = 0.28 + 0.72 * twinkle;
    vec4 viewPosition = modelViewMatrix * vec4(position, 1.0);
    gl_PointSize = aSize * (150.0 / max(1.0, -viewPosition.z));
    gl_Position = projectionMatrix * viewPosition;
  }
`;

const fragmentShader = /* glsl */ `
  varying float vAlpha;
  varying vec3 vColor;

  void main() {
    float d = length(gl_PointCoord - vec2(0.5));
    float alpha = smoothstep(0.5, 0.05, d);
    gl_FragColor = vec4(vColor, alpha * vAlpha);
  }
`;

/** A tilted, slowly twinkling band of distant stars behind the scene. */
export function MilkyWay({ count = 1100 }: { count?: number }) {
  const materialRef = useRef<ShaderMaterial>(null);

  const geometry = useMemo(() => {
    let seed = 20261119;
    const random = () => {
      seed = (seed * 1664525 + 1013904223) >>> 0;
      return seed / 4294967296;
    };

    const positions = new Float32Array(count * 3);
    const colors = new Float32Array(count * 3);
    const phases = new Float32Array(count);
    const sizes = new Float32Array(count);
    const palette = [
      [0.62, 0.72, 1.0],
      [0.86, 0.82, 1.0],
      [1.0, 0.92, 0.82],
    ];

    for (let index = 0; index < count; index += 1) {
      const along = (random() - 0.5) * 165;
      const spread = (random() - 0.5) * 19;
      const offset = index * 3;
      positions[offset] = along;
      positions[offset + 1] = spread + along * 0.24;
      positions[offset + 2] = -66 - random() * 12;

      const tint = palette[Math.floor(random() * palette.length)];
      const intensity = 0.55 + random() * 0.45;
      colors[offset] = tint[0] * intensity;
      colors[offset + 1] = tint[1] * intensity;
      colors[offset + 2] = tint[2] * intensity;
      phases[index] = random() * Math.PI * 2;
      sizes[index] = 1.1 + random() * 2.4;
    }

    const result = new BufferGeometry();
    result.setAttribute("position", new BufferAttribute(positions, 3));
    result.setAttribute("aColor", new BufferAttribute(colors, 3));
    result.setAttribute("aPhase", new BufferAttribute(phases, 1));
    result.setAttribute("aSize", new BufferAttribute(sizes, 1));
    return result;
  }, [count]);

  useEffect(() => () => geometry.dispose(), [geometry]);

  useFrame((state) => {
    if (materialRef.current) {
      materialRef.current.uniforms.uTime.value = state.clock.elapsedTime;
    }
  });

  return (
    <points geometry={geometry} frustumCulled={false}>
      <shaderMaterial
        ref={materialRef}
        uniforms={{ uTime: { value: 0 } }}
        vertexShader={vertexShader}
        fragmentShader={fragmentShader}
        transparent
        depthWrite={false}
        blending={AdditiveBlending}
        toneMapped={false}
      />
    </points>
  );
}
