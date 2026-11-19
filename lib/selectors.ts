import { dateFromToday, daysUntil, todayKey } from "./format";
import { BASE_RADIUS } from "./orbit";
import { LANE_META, energyColor } from "./palette";
import type { Orbit, Streak, Task } from "./types";

export type EnergySummary = {
  used: number;
  budget: number;
  ratio: number;
  remaining: number;
  over: boolean;
  color: string;
};

export type MoonProgress = {
  done: number;
  total: number;
  ratio: number;
};

const clamp01 = (value: number) => Math.min(1, Math.max(0, value));

/**
 * 0 = comfortable, 1 = due today or overdue. Tasks without a deadline get a
 * gentle pull so they still feel alive without pretending to be urgent.
 */
export function urgencyOf(task: Task): number {
  if (task.completed) return 0.12;
  const days = daysUntil(task.dueDate);
  if (days === null) return 0.18;
  return clamp01(1 - days / 7);
}

/** An unfinished task whose deadline already passed becomes a comet. */
export function isComet(task: Task): boolean {
  if (task.completed) return false;
  const days = daysUntil(task.dueDate);
  return days !== null && days < 0;
}

/**
 * Presentation orbit: deadlines pull a planet inward, comets dive closer to
 * the sun, and the lane changes how quickly it circles. The stored orbit is
 * never mutated, so the task can always be rescued.
 */
export function effectiveOrbit(task: Task): Orbit {
  const urgency = urgencyOf(task);
  const pull = urgency * 0.6 + (isComet(task) ? 0.95 : 0);
  const radius = Math.max(BASE_RADIUS * 0.62, task.orbit.radius - pull);

  return {
    ...task.orbit,
    radius,
    speed: task.orbit.speed * LANE_META[task.lane].speed,
  };
}

/** Incomplete tasks due today, overdue, or without a due date count as today. */
export function isActiveToday(task: Task): boolean {
  if (task.completed) return false;
  const days = daysUntil(task.dueDate);
  return days === null || days <= 0;
}

export function energySummary(
  tasks: Task[],
  energyMinutes: number,
): EnergySummary {
  const used = tasks
    .filter(isActiveToday)
    .reduce((total, task) => total + Math.max(0, task.effortMinutes), 0);
  const budget = Math.max(30, energyMinutes);
  const ratio = budget === 0 ? 0 : used / budget;

  return {
    used,
    budget,
    ratio,
    remaining: Math.max(0, budget - used),
    over: used > budget,
    color: energyColor(ratio),
  };
}

export function taskMoonProgress(task: Task): MoonProgress {
  const total = task.subtasks.length;
  const done = task.subtasks.filter((subtask) => subtask.completed).length;
  return { done, total, ratio: total === 0 ? 0 : done / total };
}

export function completedToday(tasks: Task[]): number {
  const today = todayKey();
  return tasks.filter(
    (task) =>
      task.completed &&
      task.completedAt !== undefined &&
      todayKey(new Date(task.completedAt)) === today,
  ).length;
}

/** Streak stays visible only if it was earned today or yesterday. */
export function currentStreak(streak: Streak): number {
  if (!streak.lastDate || streak.count <= 0) return 0;
  const days = daysUntil(streak.lastDate);
  if (days === null) return 0;
  return days === 0 || days === -1 ? streak.count : 0;
}

export function nextStreak(streak: Streak): Streak {
  const today = todayKey();
  if (streak.lastDate === today) return streak;

  const yesterday = dateFromToday(-1);
  const count = streak.lastDate === yesterday ? streak.count + 1 : 1;
  return { count, lastDate: today };
}

export function countComets(tasks: Task[]): number {
  return tasks.filter(isComet).length;
}

export type Constellation = {
  tag: string;
  tasks: Task[];
  done: number;
  ratio: number;
};

/** Tags are treated as constellations: a way to cluster related planets. */
export function taskConstellations(tasks: Task[]): string[] {
  const counts = new Map<string, number>();
  tasks.forEach((task) =>
    task.tags.forEach((tag) => counts.set(tag, (counts.get(tag) ?? 0) + 1)),
  );
  return [...counts.entries()]
    .sort((a, b) => b[1] - a[1] || a[0].localeCompare(b[0]))
    .map(([tag]) => tag);
}

export function constellationGroups(tasks: Task[]): Constellation[] {
  return taskConstellations(tasks).map((tag) => {
    const group = tasks.filter((task) => task.tags.includes(tag));
    const done = group.filter((task) => task.completed).length;
    return {
      tag,
      tasks: group,
      done,
      ratio: group.length === 0 ? 0 : done / group.length,
    };
  });
}

export function inConstellation(task: Task, tag: string | null): boolean {
  return tag === null || task.tags.includes(tag);
}
