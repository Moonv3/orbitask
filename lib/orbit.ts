import type { Orbit, Point3, Task } from "./types";

export const BASE_RADIUS = 3.25;
export const ORBIT_GAP = 0.68;
export const MAX_TASKS = 16;
const GOLDEN_ANGLE = Math.PI * (3 - Math.sqrt(5));

export function radiusForIndex(index: number): number {
  return BASE_RADIUS + index * ORBIT_GAP;
}

export function createOrbit(index: number): Orbit {
  const radius = radiusForIndex(index);
  return {
    radius,
    // Inner planets orbit faster, loosely following Kepler's third law.
    speed: 0.42 / Math.sqrt(radius / BASE_RADIUS),
    phase: (index * GOLDEN_ANGLE) % (Math.PI * 2),
    inclination: ((index % 5) - 2) * 0.06,
  };
}

/** Position on an inclined orbit at a given elapsed time. */
export function orbitPosition(orbit: Orbit, elapsed: number): Point3 {
  const angle = orbit.phase + elapsed * orbit.speed;
  const x = Math.cos(angle) * orbit.radius;
  const z = Math.sin(angle) * orbit.radius;
  return [
    x,
    -Math.sin(orbit.inclination) * z,
    Math.cos(orbit.inclination) * z,
  ];
}

export function orbitPath(orbit: Orbit, segments = 160): Point3[] {
  const points: Point3[] = [];
  for (let i = 0; i <= segments; i += 1) {
    const angle = (i / segments) * Math.PI * 2;
    const x = Math.cos(angle) * orbit.radius;
    const z = Math.sin(angle) * orbit.radius;
    points.push([
      x,
      -Math.sin(orbit.inclination) * z,
      Math.cos(orbit.inclination) * z,
    ]);
  }
  return points;
}

/** Find the first free orbit lane, keeping gaps after tasks are deleted. */
export function nextOrbitIndex(tasks: Task[]): number {
  let index = 0;
  while (
    tasks.some(
      (task) => Math.abs(task.orbit.radius - radiusForIndex(index)) < 0.3,
    )
  ) {
    index += 1;
  }
  return index;
}

export function maxOrbitRadius(tasks: Task[]): number {
  return tasks.reduce(
    (max, task) => Math.max(max, task.orbit.radius),
    BASE_RADIUS,
  );
}
