import { daysUntil } from "./format";
import { BASE_RADIUS, ORBIT_GAP, createOrbit } from "./orbit";
import { DEFAULT_ACCENT, planetColor, planetSize } from "./palette";
import { DEFAULT_MAIN_GOAL } from "./seed";
import type {
  Lane,
  Orbit,
  PersistedData,
  Priority,
  Settings,
  Streak,
  Subtask,
  System,
  Task,
} from "./types";

export const STORE_VERSION = 3;

export const DEFAULT_ENERGY_MINUTES = 360;
export const MAX_SYSTEMS = 8;
export const MAX_SYSTEM_NAME = 28;
/** New moons are capped at five; older saved data is never truncated. */
export const MAX_SUBTASKS = 5;
export const MAX_SUBTASKS_LEGACY = 12;

export const DEFAULT_SYSTEM_NAME = "Tata Surya Utama";

export const DEFAULT_SETTINGS: Settings = {
  quality: "high",
  sound: false,
  hasSeenIntro: false,
};

export const EMPTY_STREAK: Streak = { count: 0 };

type UnknownRecord = Record<string, unknown>;

const isRecord = (value: unknown): value is UnknownRecord =>
  typeof value === "object" && value !== null && !Array.isArray(value);

const numberOr = (value: unknown, fallback: number): number =>
  typeof value === "number" && Number.isFinite(value) ? value : fallback;

const intOr = (value: unknown, fallback: number): number =>
  Math.max(0, Math.round(numberOr(value, fallback)));

const clamp = (value: number, min: number, max: number) =>
  Math.min(max, Math.max(min, value));

const DAY_PATTERN = /^\d{4}-\d{2}-\d{2}$/;
const HEX_PATTERN = /^#[0-9a-f]{6}$/i;

const normalizeDate = (value: unknown): string | undefined => {
  if (typeof value !== "string" || !DAY_PATTERN.test(value)) return undefined;
  const [year, month, day] = value.split("-").map(Number);
  const date = new Date(year, month - 1, day);
  if (
    date.getFullYear() !== year ||
    date.getMonth() !== month - 1 ||
    date.getDate() !== day
  ) {
    return undefined;
  }
  return value;
};

const cleanText = (value: unknown, max: number): string =>
  typeof value === "string" ? value.trim().slice(0, max) : "";

export function effortForPriority(priority: Priority): number {
  if (priority === "high") return 60;
  if (priority === "medium") return 30;
  return 15;
}

/** Overdue and due-today tasks belong to "now"; the next days to "today". */
export function defaultLane(dueDate?: string): Lane {
  const days = daysUntil(dueDate);
  if (days === null) return "today";
  if (days <= 0) return "now";
  if (days <= 3) return "today";
  return "later";
}

const normalizePriority = (value: unknown): Priority => {
  if (value === "high" || value === "medium" || value === "low") return value;
  return "medium";
};

const normalizeSubtask = (
  value: unknown,
  taskId: string,
  index: number,
): Subtask | null => {
  if (typeof value === "string") {
    const title = value.trim();
    if (!title) return null;
    return {
      id: `${taskId}-moon-${index + 1}`,
      title,
      completed: false,
      createdAt: Date.now(),
    };
  }

  if (!isRecord(value)) return null;
  const title = typeof value.title === "string" ? value.title.trim() : "";
  if (!title) return null;

  return {
    id:
      typeof value.id === "string" && value.id
        ? value.id
        : `${taskId}-moon-${index + 1}`,
    title,
    completed: value.completed === true,
    createdAt: numberOr(value.createdAt, Date.now()),
  };
};

const normalizeOrbit = (value: unknown, index: number): Orbit => {
  const fallback = createOrbit(index);
  if (!isRecord(value)) return fallback;

  const radius = numberOr(value.radius, fallback.radius);
  return {
    radius: radius > 1 ? radius : fallback.radius,
    speed: numberOr(value.speed, fallback.speed) || fallback.speed,
    phase: numberOr(value.phase, fallback.phase),
    inclination: numberOr(value.inclination, fallback.inclination),
  };
};

export function normalizeTask(value: unknown, index: number): Task | null {
  if (!isRecord(value)) return null;

  const title =
    typeof value.title === "string" && value.title.trim()
      ? value.title.trim()
      : "Tugas tanpa judul";
  const priority = normalizePriority(value.priority);
  const completed = value.completed === true;
  const createdAt = numberOr(value.createdAt, Date.now());
  const dueDate = normalizeDate(value.dueDate);
  const id =
    typeof value.id === "string" && value.id
      ? value.id
      : `migrated-${index + 1}`;
  const orbit = normalizeOrbit(value.orbit, index);
  const laneValue = value.lane;
  const lane: Lane =
    laneValue === "now" || laneValue === "today" || laneValue === "later"
      ? laneValue
      : defaultLane(dueDate);

  const tags = Array.isArray(value.tags)
    ? value.tags
        .filter((tag): tag is string => typeof tag === "string")
        .map((tag) => tag.trim())
        .filter(Boolean)
        .slice(0, 8)
    : [];

  const subtasks = Array.isArray(value.subtasks)
    ? value.subtasks
        .map((subtask, subIndex) =>
          normalizeSubtask(subtask, id, subIndex),
        )
        .filter((subtask): subtask is Subtask => subtask !== null)
        .slice(0, MAX_SUBTASKS_LEGACY)
    : [];

  return {
    id,
    title,
    description:
      typeof value.description === "string" ? value.description : "",
    priority,
    dueDate,
    completed,
    createdAt,
    color:
      typeof value.color === "string" && value.color
        ? value.color
        : planetColor(priority, index),
    size:
      typeof value.size === "number" && value.size > 0.05
        ? value.size
        : planetSize(priority, index),
    orbit,
    lane,
    effortMinutes: Math.max(
      5,
      intOr(value.effortMinutes, effortForPriority(priority)),
    ),
    tags,
    subtasks,
    focusSessions: intOr(value.focusSessions, 0),
    focusMinutes: intOr(value.focusMinutes, 0),
    completedAt: completed
      ? numberOr(value.completedAt, createdAt)
      : undefined,
  };
}

export function normalizeSettings(value: unknown): Settings {
  const input = isRecord(value) ? value : {};
  return {
    quality: input.quality === "light" ? "light" : "high",
    sound: input.sound === true,
    hasSeenIntro: input.hasSeenIntro === true,
  };
}

export function normalizeStreak(value: unknown): Streak {
  const input = isRecord(value) ? value : {};
  const count = intOr(input.count, 0);
  const lastDate = normalizeDate(input.lastDate);
  return lastDate ? { count, lastDate } : { count };
}

const normalizeAccent = (value: unknown): string =>
  typeof value === "string" && HEX_PATTERN.test(value)
    ? value.toLowerCase()
    : DEFAULT_ACCENT;

const fallbackSystemName = (index: number): string =>
  index === 0 ? DEFAULT_SYSTEM_NAME : `Tata Surya ${index + 1}`;

export function normalizeSystem(value: unknown, index: number): System | null {
  if (!isRecord(value)) return null;

  const tasks = Array.isArray(value.tasks)
    ? value.tasks
        .map((task, taskIndex) => normalizeTask(task, taskIndex))
        .filter((task): task is Task => task !== null)
    : [];

  const id =
    typeof value.id === "string" && value.id
      ? value.id
      : `system-${index + 1}`;
  const name = cleanText(value.name, MAX_SYSTEM_NAME);

  return {
    id,
    name: name || fallbackSystemName(index),
    mainGoal: cleanText(value.mainGoal, 90) || DEFAULT_MAIN_GOAL,
    accent: normalizeAccent(value.accent),
    energyMinutes: clamp(
      intOr(value.energyMinutes, DEFAULT_ENERGY_MINUTES),
      30,
      1440,
    ),
    tasks,
    streak: normalizeStreak(value.streak),
    archived: value.archived === true,
    createdAt: numberOr(value.createdAt, Date.now()),
  };
}

/**
 * Lossless normalizer for legacy v1/v2 state, v3 state, and imported backups.
 * A legacy flat payload (`mainGoal` + `tasks`) becomes a single system.
 */
export function normalizeState(value: unknown): PersistedData {
  const input = isRecord(value) ? value : {};

  const systems = Array.isArray(input.systems)
    ? input.systems
        .map((system, index) => normalizeSystem(system, index))
        .filter((system): system is System => system !== null)
        .slice(0, MAX_SYSTEMS)
    : [];

  if (systems.length === 0) {
    const legacySettings = isRecord(input.settings) ? input.settings : {};
    const legacy = normalizeSystem(
      {
        id: "system-1",
        name: DEFAULT_SYSTEM_NAME,
        mainGoal: input.mainGoal,
        accent: DEFAULT_ACCENT,
        energyMinutes: legacySettings.dailyEnergyMinutes,
        tasks: input.tasks,
        streak: input.streak,
        createdAt: Date.now(),
      },
      0,
    );
    if (legacy) systems.push(legacy);
  }

  const requested =
    typeof input.activeSystemId === "string" ? input.activeSystemId : undefined;
  const active =
    systems.find((system) => system.id === requested && !system.archived) ??
    systems.find((system) => !system.archived) ??
    systems[0];

  return {
    systems,
    activeSystemId: active.id,
    settings: normalizeSettings(input.settings),
  };
}

/** Best-effort index of the lane a v1 orbit used. Kept for future migrations. */
export function orbitIndexForRadius(radius: number): number {
  return Math.max(0, Math.round((radius - BASE_RADIUS) / ORBIT_GAP));
}
