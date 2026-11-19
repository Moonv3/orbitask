"use client";

import { useMemo } from "react";
import { CanvasTexture, SRGBColorSpace } from "three";

/**
 * Soft radial glow used for the sun corona and completed-planet halos.
 */
export function useGlowTexture(core = 0.16) {
  return useMemo(() => {
    if (typeof document === "undefined") return null;
    const size = 256;
    const canvas = document.createElement("canvas");
    canvas.width = size;
    canvas.height = size;
    const context = canvas.getContext("2d");
    if (!context) return null;

    const center = size / 2;
    const gradient = context.createRadialGradient(
      center,
      center,
      0,
      center,
      center,
      center,
    );
    gradient.addColorStop(0, "rgba(255,255,255,1)");
    gradient.addColorStop(core, "rgba(255,255,255,0.85)");
    gradient.addColorStop(0.42, "rgba(255,255,255,0.22)");
    gradient.addColorStop(1, "rgba(255,255,255,0)");
    context.fillStyle = gradient;
    context.fillRect(0, 0, size, size);

    const texture = new CanvasTexture(canvas);
    texture.colorSpace = SRGBColorSpace;
    return texture;
  }, [core]);
}
