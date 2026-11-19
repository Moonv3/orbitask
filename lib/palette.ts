import type { Lane, Priority } from "./types";

export const PRIORITY_META: Record<
  Priority,
  { label: string; color: string; soft: string; description: string }
> = {
  high: {
    label: "Tinggi",
    color: "#ff6b6b",
    soft: "rgba(255, 107, 107, 0.14)",
    description: "Prioritas utama",
  },
  medium: {
    label: "Sedang",
    color: "#f5b544",
    soft: "rgba(245, 181, 68, 0.14)",
    description: "Penting, tidak mendesak",
  },
  low: {
    label: "Rendah",
    color: "#5eead4",
    soft: "rgba(94, 234, 212, 0.14)",
    description: "Santai dan ringan",
  },
};

export const PRIORITIES: Priority[] = ["high", "medium", "low"];

export const LANES: Lane[] = ["now", "today", "later"];

/** Star tints a user can pick for a new system. */
export const SYSTEM_ACCENTS: { value: string; label: string }[] = [
  { value: "#ffb35c", label: "Amber" },
  { value: "#7aa2ff", label: "Biru" },
  { value: "#5eead4", label: "Mint" },
  { value: "#c084fc", label: "Violet" },
  { value: "#fb7185", label: "Rose" },
];

export const DEFAULT_ACCENT = SYSTEM_ACCENTS[0].value;

export const LANE_META: Record<
  Lane,
  { label: string; hint: string; color: string; speed: number }
> = {
  now: {
    label: "Sekarang",
    hint: "Fokus utama hari ini",
    color: "#ffb35c",
    speed: 1.15,
  },
  today: {
    label: "Hari ini",
    hint: "Selesaikan sebelum tidur",
    color: "#7aa2ff",
    speed: 0.85,
  },
  later: {
    label: "Nanti",
    hint: "Antrean tanpa tekanan",
    color: "#5eead4",
    speed: 0.55,
  },
};

/** Suggested effort values, in minutes. */
export const EFFORT_PRESETS = [15, 30, 60, 90, 120] as const;

/**
 * Planet color families follow the priority so the legend always makes sense,
 * while the variant keeps neighbouring planets visually distinct.
 */
export const PLANET_COLORS: Record<Priority, string[]> = {
  high: ["#ff6b6b", "#ff8a5c", "#ff5c8a", "#ffa25c"],
  medium: ["#7aa2ff", "#9b8cff", "#5cc8ff", "#8f9dff"],
  low: ["#5eead4", "#7bd88f", "#5ed4e8", "#a3e635"],
};

export const START_COLORS = ["#ffb35c", "#ffd166", "#ff8f5e"];

export const PROGRESS_COLOR = "#5eead4";
export const COMPLETED_RING = "rgba(190, 255, 235, 0.9)";

export function planetColor(priority: Priority, index: number): string {
  const family = PLANET_COLORS[priority];
  return family[index % family.length];
}

export function planetSize(priority: Priority, index: number): number {
  const base = priority === "high" ? 0.34 : priority === "medium" ? 0.28 : 0.23;
  const variation = [0, 0.04, -0.02][index % 3];
  return base + variation;
}

/** Mint when comfortable, amber near the budget, rose when exceeded. */
export function energyColor(ratio: number): string {
  if (ratio > 1) return "#fb7185";
  if (ratio > 0.85) return "#ff8a5c";
  if (ratio > 0.6) return "#f5b544";
  return "#5eead4";
}
