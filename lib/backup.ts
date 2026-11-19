import { normalizeState } from "./migrate";
import type { Backup, PersistedData } from "./types";

export const BACKUP_VERSION = 3;

export function createBackup(data: PersistedData): Backup {
  return {
    app: "orbitask",
    version: BACKUP_VERSION,
    exportedAt: new Date().toISOString(),
    ...data,
  };
}

/**
 * Accepts a full Orbitask backup, a v2 flat payload, or a bare
 * `{ systems, activeSystemId, ... }` object. Returns null when the file is not
 * JSON or contains neither systems nor tasks.
 */
export function parseBackup(text: string): Backup | null {
  let raw: unknown;
  try {
    raw = JSON.parse(text);
  } catch {
    return null;
  }

  if (typeof raw !== "object" || raw === null) return null;

  const candidate = raw as { tasks?: unknown; systems?: unknown };
  const hasTasks = Array.isArray(candidate.tasks);
  const hasSystems = Array.isArray(candidate.systems);
  if (!hasTasks && !hasSystems) return null;

  const data = normalizeState(raw);
  return {
    ...createBackup(data),
    exportedAt:
      typeof (raw as { exportedAt?: unknown }).exportedAt === "string"
        ? (raw as { exportedAt: string }).exportedAt
        : new Date().toISOString(),
  };
}
