export const STORAGE_KEY = "orbitask-v3";
export const LEGACY_STORAGE_KEYS = ["orbitask-v2", "orbitask-v1"] as const;

/**
 * Copy the newest legacy payload into the v3 key before zustand hydrates.
 * Older keys are left untouched, so nothing is lost even if the migration
 * fails or the user wants to go back.
 */
export function preserveLegacyData(): void {
  if (typeof window === "undefined") return;

  try {
    const storage = window.localStorage;
    if (storage.getItem(STORAGE_KEY)) return;

    for (const key of LEGACY_STORAGE_KEYS) {
      const legacy = storage.getItem(key);
      if (legacy) {
        storage.setItem(STORAGE_KEY, legacy);
        return;
      }
    }
  } catch {
    // Private mode or a blocked storage quota: the store still works for the
    // current session, it just cannot persist.
  }
}
