"use client";

import { useState } from "react";
import { useTaskStore } from "@/store/useTaskStore";
import type { Quality } from "./types";

export type WebGLInfo = {
  supported: boolean;
  software: boolean;
  webgl2: boolean;
  renderer: string | null;
  reason: string | null;
};

const SOFTWARE_RENDERER =
  /swiftshader|llvmpipe|softpipe|software|mesa offscreen|basic render/i;

/** Probe WebGL on a throwaway canvas, then release the context immediately. */
export function detectWebGL(): WebGLInfo {
  if (typeof document === "undefined") {
    return {
      supported: true,
      software: false,
      webgl2: true,
      renderer: null,
      reason: null,
    };
  }

  // Dev-only switch so the fallback can be verified without a broken GPU.
  if (
    typeof window !== "undefined" &&
    process.env.NODE_ENV !== "production" &&
    new URLSearchParams(window.location.search).has("nowebgl")
  ) {
    return {
      supported: false,
      software: false,
      webgl2: false,
      renderer: null,
      reason: "Simulasi pengembangan: WebGL dinonaktifkan.",
    };
  }

  try {
    const canvas = document.createElement("canvas");
    const gl2 = canvas.getContext("webgl2");
    const gl = gl2 ?? canvas.getContext("webgl");

    if (!gl) {
      return {
        supported: false,
        software: false,
        webgl2: false,
        renderer: null,
        reason: "Browser tidak menyediakan konteks WebGL.",
      };
    }

    const debugInfo = gl.getExtension("WEBGL_debug_renderer_info");
    const raw = debugInfo
      ? gl.getParameter(debugInfo.UNMASKED_RENDERER_WEBGL)
      : gl.getParameter(gl.RENDERER);
    const renderer = typeof raw === "string" ? raw : "";

    gl.getExtension("WEBGL_lose_context")?.loseContext();

    return {
      supported: true,
      software: SOFTWARE_RENDERER.test(renderer),
      webgl2: Boolean(gl2),
      renderer: renderer || null,
      reason: null,
    };
  } catch {
    return {
      supported: false,
      software: false,
      webgl2: false,
      renderer: null,
      reason: "Pembuatan konteks grafis gagal.",
    };
  }
}

export type DeviceSignals = {
  reducedMotion: boolean;
  lowMemory: boolean;
  lowCores: boolean;
  saveData: boolean;
  coarseSmallScreen: boolean;
  webgl: WebGLInfo;
  recommended: Quality;
  reasons: string[];
};

let cachedSignals: DeviceSignals | null = null;

function computeDevice(): DeviceSignals {
  const webgl = detectWebGL();
  const reasons: string[] = [];

  if (!webgl.supported) {
    reasons.push("WebGL tidak tersedia");
  } else {
    if (webgl.software) reasons.push("Renderer perangkat lunak");
    if (!webgl.webgl2) reasons.push("WebGL 1 saja");
  }

  if (typeof window === "undefined") {
    return {
      reducedMotion: false,
      lowMemory: false,
      lowCores: false,
      saveData: false,
      coarseSmallScreen: false,
      webgl,
      recommended: "light",
      reasons,
    };
  }

  const nav = navigator as Navigator & {
    deviceMemory?: number;
    connection?: { saveData?: boolean };
  };

  const reducedMotion =
    window.matchMedia?.("(prefers-reduced-motion: reduce)")?.matches ?? false;
  const lowMemory =
    typeof nav.deviceMemory === "number" && nav.deviceMemory <= 4;
  const lowCores =
    typeof nav.hardwareConcurrency === "number" && nav.hardwareConcurrency <= 4;
  const saveData = nav.connection?.saveData === true;
  const coarseSmallScreen =
    (window.matchMedia?.("(pointer: coarse)")?.matches ?? false) &&
    window.innerWidth < 768;

  if (reducedMotion) reasons.push("Gerak dikurangi");
  if (lowMemory) reasons.push("Memori rendah");
  if (lowCores) reasons.push("Prosesor terbatas");
  if (saveData) reasons.push("Mode hemat data");
  if (coarseSmallScreen) reasons.push("Layar sentuh kecil");

  return {
    reducedMotion,
    lowMemory,
    lowCores,
    saveData,
    coarseSmallScreen,
    webgl,
    recommended: reasons.length > 0 ? "light" : "high",
    reasons,
  };
}

/** Device signals are stable for a session, so probe once and reuse. */
export function detectDevice(refresh = false): DeviceSignals {
  if (!cachedSignals || refresh) cachedSignals = computeDevice();
  return cachedSignals;
}

/** Manual choice wins; otherwise follow the device recommendation. */
export function useEffectiveQuality(): Quality {
  const quality = useTaskStore((state) => state.settings.quality);
  const autoQuality = useTaskStore((state) => state.settings.autoQuality);
  const [signals] = useState(() => detectDevice());
  return autoQuality ? signals.recommended : quality;
}
