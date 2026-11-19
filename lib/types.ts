export type Priority = "high" | "medium" | "low";

/** How urgently a planet should be tackled. */
export type Lane = "now" | "today" | "later";

/** Rendering quality, tuned in Settings. */
export type Quality = "high" | "light";

export type Orbit = {
  /** Distance from the sun in scene units. */
  radius: number;
  /** Angular speed in radians per second. */
  speed: number;
  /** Starting angle so planets do not line up. */
  phase: number;
  /** Slight tilt of the orbital plane in radians. */
  inclination: number;
};

/** A subtask is rendered as a moon orbiting its planet. */
export type Subtask = {
  id: string;
  title: string;
  completed: boolean;
  createdAt: number;
};

export type Task = {
  id: string;
  title: string;
  description: string;
  priority: Priority;
  dueDate?: string;
  completed: boolean;
  createdAt: number;
  color: string;
  size: number;
  orbit: Orbit;

  // v2 fields
  lane: Lane;
  effortMinutes: number;
  tags: string[];
  subtasks: Subtask[];
  focusSessions: number;
  focusMinutes: number;
  completedAt?: number;
};

export type NewTaskInput = {
  title: string;
  description: string;
  priority: Priority;
  dueDate?: string;
  lane?: Lane;
  effortMinutes?: number;
  tags?: string[];
  subtasks?: string[];
};

/** Global preferences. Energy moved to each system in v3. */
export type Settings = {
  quality: Quality;
  sound: boolean;
  hasSeenIntro: boolean;
};

export type Streak = {
  count: number;
  lastDate?: string;
};

/** One solar system: a sun (main goal) with its own planets and budget. */
export type System = {
  id: string;
  name: string;
  mainGoal: string;
  /** Star tint in hex, also used as the UI accent. */
  accent: string;
  /** Advisory daily effort budget for this system, in minutes. */
  energyMinutes: number;
  tasks: Task[];
  streak: Streak;
  archived: boolean;
  createdAt: number;
};

/** Persisted slice of the store. */
export type PersistedData = {
  systems: System[];
  activeSystemId: string;
  settings: Settings;
};

export type Backup = PersistedData & {
  app: "orbitask";
  version: 3;
  exportedAt: string;
};

export type Point3 = [number, number, number];
