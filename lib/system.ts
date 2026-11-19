import type { PersistedData, System } from "./types";
import {
  DEFAULT_ENERGY_MINUTES,
  DEFAULT_SETTINGS,
  DEFAULT_SYSTEM_NAME,
} from "./migrate";
import { DEFAULT_ACCENT, SYSTEM_ACCENTS } from "./palette";
import { DEFAULT_MAIN_GOAL, createSeedTasks } from "./seed";

/** Shared id generator with a graceful fallback for older browsers. */
export function createId(prefix = "id"): string {
  return typeof crypto !== "undefined" && "randomUUID" in crypto
    ? crypto.randomUUID()
    : `${prefix}-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
}

export function accentForIndex(index: number): string {
  return SYSTEM_ACCENTS[index % SYSTEM_ACCENTS.length]?.value ?? DEFAULT_ACCENT;
}

export function createSystem(input: {
  name: string;
  mainGoal: string;
  accent: string;
  energyMinutes: number;
}): System {
  return {
    id: createId("system"),
    name: input.name,
    mainGoal: input.mainGoal,
    accent: input.accent,
    energyMinutes: input.energyMinutes,
    tasks: [],
    streak: { count: 0 },
    archived: false,
    createdAt: Date.now(),
  };
}

/** State used before anything is persisted: one seeded solar system. */
export function createInitialData(): PersistedData {
  const system: System = {
    id: "system-1",
    name: DEFAULT_SYSTEM_NAME,
    mainGoal: DEFAULT_MAIN_GOAL,
    accent: DEFAULT_ACCENT,
    energyMinutes: DEFAULT_ENERGY_MINUTES,
    tasks: createSeedTasks(),
    streak: { count: 0 },
    archived: false,
    createdAt: Date.now(),
  };

  return {
    systems: [system],
    activeSystemId: system.id,
    settings: { ...DEFAULT_SETTINGS },
  };
}

/**
 * The active system. The store guarantees at least one system exists and that
 * the active id points at a real one, so callers can rely on a value.
 */
export function pickActiveSystem(state: {
  systems: System[];
  activeSystemId: string;
}): System {
  return (
    state.systems.find((system) => system.id === state.activeSystemId) ??
    state.systems[0]
  );
}
