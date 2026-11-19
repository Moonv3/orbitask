import type { Point3 } from "./types";

export type GalaxyNode = {
  position: Point3;
  angle: number;
  radius: number;
};

/**
 * Deterministic spiral placement for the system-stars. A fixed layout keeps a
 * system in the same spot while other systems are created or archived, so the
 * galaxy feels like a stable map rather than a shuffling list.
 */
export function galaxyLayout(count: number): GalaxyNode[] {
  return Array.from({ length: Math.max(0, count) }, (_, index) => {
    const angle = index * 0.92 - 0.55;
    const radius = 2.9 + index * 1.2;
    return {
      position: [
        Math.cos(angle) * radius,
        Math.sin(index * 0.85) * 1.25,
        Math.sin(angle) * radius,
      ] as Point3,
      angle,
      radius,
    };
  });
}
