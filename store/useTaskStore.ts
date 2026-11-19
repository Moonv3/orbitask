"use client";

import { create } from "zustand";
import { persist } from "zustand/middleware";
import {
  EMPTY_STREAK,
  MAX_SUBTASKS,
  MAX_SYSTEM_NAME,
  MAX_SYSTEMS,
  STORE_VERSION,
  defaultLane,
  effortForPriority,
  normalizeSettings,
  normalizeState,
} from "@/lib/migrate";
import { createOrbit, MAX_TASKS, nextOrbitIndex } from "@/lib/orbit";
import { planetColor, planetSize } from "@/lib/palette";
import { DEFAULT_MAIN_GOAL } from "@/lib/seed";
import { nextStreak } from "@/lib/selectors";
import { playCompletionChime } from "@/lib/sound";
import { STORAGE_KEY, preserveLegacyData } from "@/lib/storage";
import {
  accentForIndex,
  createId,
  createInitialData,
  createSystem,
  pickActiveSystem,
} from "@/lib/system";
import type {
  Lane,
  NewTaskInput,
  PersistedData,
  Settings,
  System,
  Task,
} from "@/lib/types";

type TaskPatch = Partial<
  Pick<
    Task,
    | "title"
    | "description"
    | "priority"
    | "dueDate"
    | "lane"
    | "effortMinutes"
    | "tags"
  >
>;

type NewSystemInput = {
  name: string;
  mainGoal: string;
  accent?: string;
  energyMinutes?: number;
};

export type FocusState = {
  taskId: string | null;
  minutes: number;
  remaining: number;
  running: boolean;
  endsAt: number | null;
};

type TaskStore = PersistedData & {
  // UI state (not persisted)
  selectedId: string | null;
  viewMode: "system" | "galaxy";
  autoRotate: boolean;
  resetSignal: number;
  isAddOpen: boolean;
  isListOpen: boolean;
  isGoalOpen: boolean;
  isSettingsOpen: boolean;
  isSystemOpen: boolean;
  isCommandOpen: boolean;
  focus: FocusState;

  addTask: (input: NewTaskInput) => string | null;
  toggleComplete: (id: string) => void;
  deleteTask: (id: string) => void;
  updateTask: (id: string, patch: TaskPatch) => void;
  rescheduleTask: (id: string, dueDate?: string) => void;
  setTaskEffort: (id: string, minutes: number) => void;
  setTaskLane: (id: string, lane: Lane) => void;

  addSubtask: (taskId: string, title: string) => void;
  toggleSubtask: (taskId: string, subtaskId: string) => void;
  deleteSubtask: (taskId: string, subtaskId: string) => void;
  logFocusSession: (taskId: string, minutes: number) => void;

  addSystem: (input: NewSystemInput) => string | null;
  renameSystem: (id: string, name: string) => void;
  setSystemEnergy: (id: string, minutes: number) => void;
  switchSystem: (id: string) => void;
  enterSystem: (id: string) => void;
  archiveSystem: (id: string) => void;
  restoreSystem: (id: string) => void;

  updateSettings: (patch: Partial<Settings>) => void;
  dismissIntro: () => void;
  reopenIntro: () => void;
  resetStreak: () => void;
  restoreData: (data: PersistedData) => void;

  selectTask: (id: string | null) => void;
  updateMainGoal: (goal: string) => void;

  openGalaxy: () => void;
  closeGalaxy: () => void;
  openCommand: () => void;
  closeCommand: () => void;
  toggleCommand: () => void;

  startFocus: (taskId: string, minutes: number) => void;
  pauseFocus: () => void;
  resumeFocus: () => void;
  stopFocus: () => void;
  tickFocus: () => void;

  toggleAutoRotate: () => void;
  requestReset: () => void;
  openAdd: () => void;
  closeAdd: () => void;
  openList: () => void;
  closeList: () => void;
  openGoal: () => void;
  closeGoal: () => void;
  openSettings: () => void;
  closeSettings: () => void;
  openSystem: () => void;
  closeSystem: () => void;
  closeAllPanels: () => void;
};

const clampEffort = (minutes: number) =>
  Math.min(480, Math.max(5, Math.round(minutes)));

const clampEnergy = (minutes: number) =>
  Math.min(1440, Math.max(30, Math.round(minutes)));

const emptyFocus = (): FocusState => ({
  taskId: null,
  minutes: 25,
  remaining: 25 * 60,
  running: false,
  endsAt: null,
});

const clampFocusMinutes = (minutes: number) =>
  Math.min(120, Math.max(5, Math.round(minutes)));

const cleanTags = (tags?: string[]) =>
  (tags ?? [])
    .map((tag) => tag.trim())
    .filter(Boolean)
    .slice(0, 8);

const cleanSubtaskTitles = (titles?: string[]) =>
  (titles ?? [])
    .map((title) => title.trim())
    .filter(Boolean)
    .slice(0, MAX_SUBTASKS);

const withTasks = (
  state: TaskStore,
  updater: (tasks: Task[], system: System) => Task[],
) => {
  const active = pickActiveSystem(state);
  return {
    systems: state.systems.map((system) =>
      system.id === active.id
        ? { ...system, tasks: updater(system.tasks, system) }
        : system,
    ),
  };
};

const updateActiveSystem = (
  state: TaskStore,
  updater: (system: System) => System,
) => {
  const active = pickActiveSystem(state);
  return {
    systems: state.systems.map((system) =>
      system.id === active.id ? updater(system) : system,
    ),
  };
};

preserveLegacyData();

export const useTaskStore = create<TaskStore>()(
  persist(
    (set, get) => ({
      ...createInitialData(),

      selectedId: null,
      viewMode: "system",
      autoRotate: true,
      resetSignal: 0,
      isAddOpen: false,
      isListOpen: false,
      isGoalOpen: false,
      isSettingsOpen: false,
      isSystemOpen: false,
      isCommandOpen: false,
      focus: emptyFocus(),

      addTask: (input) => {
        const title = input.title.trim();
        if (!title) return null;

        const state = get();
        const active = pickActiveSystem(state);
        if (active.tasks.length >= MAX_TASKS) return null;

        const orbitIndex = nextOrbitIndex(active.tasks);
        const now = Date.now();
        const lane = input.lane ?? defaultLane(input.dueDate);
        const effortMinutes = clampEffort(
          input.effortMinutes ?? effortForPriority(input.priority),
        );
        const subtasks = cleanSubtaskTitles(input.subtasks).map((subtask) => ({
          id: createId("moon"),
          title: subtask,
          completed: false,
          createdAt: now,
        }));

        const task: Task = {
          id: createId("task"),
          title,
          description: input.description.trim(),
          priority: input.priority,
          dueDate: input.dueDate || undefined,
          completed: false,
          createdAt: now,
          color: planetColor(input.priority, orbitIndex),
          size: planetSize(input.priority, orbitIndex),
          orbit: createOrbit(orbitIndex),
          lane,
          effortMinutes,
          tags: cleanTags(input.tags),
          subtasks,
          focusSessions: 0,
          focusMinutes: 0,
        };

        set({
          systems: state.systems.map((system) =>
            system.id === active.id
              ? { ...system, tasks: [...system.tasks, task] }
              : system,
          ),
          selectedId: task.id,
          isAddOpen: false,
          isListOpen: false,
          isGoalOpen: false,
          isSettingsOpen: false,
          isSystemOpen: false,
          isCommandOpen: false,
        });
        return task.id;
      },

      toggleComplete: (id) => {
        const state = get();
        const active = pickActiveSystem(state);
        const task = active.tasks.find((item) => item.id === id);
        if (!task) return;

        const completed = !task.completed;
        set({
          systems: state.systems.map((system) =>
            system.id === active.id
              ? {
                  ...system,
                  tasks: system.tasks.map((item) =>
                    item.id === id
                      ? {
                          ...item,
                          completed,
                          completedAt: completed ? Date.now() : undefined,
                        }
                      : item,
                  ),
                  streak: completed ? nextStreak(system.streak) : system.streak,
                }
              : system,
          ),
        });

        if (completed && state.settings.sound) {
          playCompletionChime();
        }
      },

      deleteTask: (id) =>
        set((state) => ({
          ...withTasks(state, (tasks) =>
            tasks.filter((task) => task.id !== id),
          ),
          selectedId: state.selectedId === id ? null : state.selectedId,
          focus: state.focus.taskId === id ? emptyFocus() : state.focus,
        })),

      updateTask: (id, patch) =>
        set((state) =>
          withTasks(state, (tasks) =>
            tasks.map((task) =>
              task.id === id ? { ...task, ...patch } : task,
            ),
          ),
        ),

      rescheduleTask: (id, dueDate) =>
        set((state) =>
          withTasks(state, (tasks) =>
            tasks.map((task) =>
              task.id === id
                ? {
                    ...task,
                    dueDate: dueDate || undefined,
                    lane: defaultLane(dueDate || undefined),
                  }
                : task,
            ),
          ),
        ),

      setTaskEffort: (id, minutes) =>
        set((state) =>
          withTasks(state, (tasks) =>
            tasks.map((task) =>
              task.id === id
                ? { ...task, effortMinutes: clampEffort(minutes) }
                : task,
            ),
          ),
        ),

      setTaskLane: (id, lane) =>
        set((state) =>
          withTasks(state, (tasks) =>
            tasks.map((task) => (task.id === id ? { ...task, lane } : task)),
          ),
        ),

      addSubtask: (taskId, title) => {
        const value = title.trim();
        if (!value) return;

        set((state) =>
          withTasks(state, (tasks) =>
            tasks.map((task) =>
              task.id === taskId && task.subtasks.length < MAX_SUBTASKS
                ? {
                    ...task,
                    subtasks: [
                      ...task.subtasks,
                      {
                        id: createId("moon"),
                        title: value,
                        completed: false,
                        createdAt: Date.now(),
                      },
                    ],
                  }
                : task,
            ),
          ),
        );
      },

      toggleSubtask: (taskId, subtaskId) =>
        set((state) =>
          withTasks(state, (tasks) =>
            tasks.map((task) =>
              task.id === taskId
                ? {
                    ...task,
                    subtasks: task.subtasks.map((subtask) =>
                      subtask.id === subtaskId
                        ? { ...subtask, completed: !subtask.completed }
                        : subtask,
                    ),
                  }
                : task,
            ),
          ),
        ),

      deleteSubtask: (taskId, subtaskId) =>
        set((state) =>
          withTasks(state, (tasks) =>
            tasks.map((task) =>
              task.id === taskId
                ? {
                    ...task,
                    subtasks: task.subtasks.filter(
                      (subtask) => subtask.id !== subtaskId,
                    ),
                  }
                : task,
            ),
          ),
        ),

      /** Logs into the system that owns the task, even after a system switch. */
      logFocusSession: (taskId, minutes) =>
        set((state) => ({
          systems: state.systems.map((system) =>
            system.tasks.some((task) => task.id === taskId)
              ? {
                  ...system,
                  tasks: system.tasks.map((task) =>
                    task.id === taskId
                      ? {
                          ...task,
                          focusSessions: task.focusSessions + 1,
                          focusMinutes:
                            task.focusMinutes +
                            Math.min(240, Math.max(1, minutes)),
                        }
                      : task,
                  ),
                }
              : system,
          ),
        })),

      addSystem: (input) => {
        const state = get();
        if (state.systems.length >= MAX_SYSTEMS) return null;

        const name = input.name.trim().slice(0, MAX_SYSTEM_NAME);
        if (!name) return null;

        const system = createSystem({
          name,
          mainGoal: input.mainGoal.trim().slice(0, 90) || DEFAULT_MAIN_GOAL,
          accent: input.accent ?? accentForIndex(state.systems.length),
          energyMinutes: clampEnergy(input.energyMinutes ?? 360),
        });

        set({
          systems: [...state.systems, system],
          activeSystemId: system.id,
          selectedId: null,
          viewMode: "system",
          resetSignal: state.resetSignal + 1,
          isAddOpen: false,
          isListOpen: false,
          isGoalOpen: false,
          isSettingsOpen: false,
          isSystemOpen: false,
          isCommandOpen: false,
        });
        return system.id;
      },

      renameSystem: (id, name) => {
        const value = name.trim().slice(0, MAX_SYSTEM_NAME);
        if (!value) return;

        set((state) => ({
          systems: state.systems.map((system) =>
            system.id === id ? { ...system, name: value } : system,
          ),
        }));
      },

      setSystemEnergy: (id, minutes) =>
        set((state) => ({
          systems: state.systems.map((system) =>
            system.id === id
              ? { ...system, energyMinutes: clampEnergy(minutes) }
              : system,
          ),
        })),

      switchSystem: (id) =>
        set((state) => {
          const target = state.systems.find(
            (system) => system.id === id && !system.archived,
          );
          if (!target || target.id === state.activeSystemId) return {};

          return {
            activeSystemId: target.id,
            selectedId: null,
            viewMode: "system",
            resetSignal: state.resetSignal + 1,
            isAddOpen: false,
            isListOpen: false,
            isGoalOpen: false,
            isSettingsOpen: false,
            isSystemOpen: false,
            isCommandOpen: false,
          };
        }),

      /** Enter a system from the galaxy map. Archived systems stay untouched. */
      enterSystem: (id) => {
        const state = get();
        const target = state.systems.find(
          (system) => system.id === id && !system.archived,
        );
        if (!target) return;

        const changed = target.id !== state.activeSystemId;
        set({
          activeSystemId: target.id,
          viewMode: "system",
          selectedId: null,
          resetSignal: changed ? state.resetSignal + 1 : state.resetSignal,
          isAddOpen: false,
          isListOpen: false,
          isGoalOpen: false,
          isSettingsOpen: false,
          isSystemOpen: false,
          isCommandOpen: false,
        });
      },

      archiveSystem: (id) =>
        set((state) => {
          const target = state.systems.find((system) => system.id === id);
          if (!target || target.archived) return {};

          const remaining = state.systems.filter(
            (system) => system.id !== id && !system.archived,
          );
          if (remaining.length === 0) return {};

          const systems = state.systems.map((system) =>
            system.id === id ? { ...system, archived: true } : system,
          );

          if (state.activeSystemId !== id) return { systems };

          return {
            systems,
            activeSystemId: remaining[0].id,
            selectedId: null,
            resetSignal: state.resetSignal + 1,
            isAddOpen: false,
            isListOpen: false,
            isGoalOpen: false,
          };
        }),

      restoreSystem: (id) =>
        set((state) => ({
          systems: state.systems.map((system) =>
            system.id === id ? { ...system, archived: false } : system,
          ),
        })),

      updateSettings: (patch) =>
        set((state) => ({
          settings: normalizeSettings({ ...state.settings, ...patch }),
        })),

      dismissIntro: () =>
        set((state) => ({
          settings: { ...state.settings, hasSeenIntro: true },
        })),

      reopenIntro: () =>
        set((state) => ({
          settings: { ...state.settings, hasSeenIntro: false },
        })),

      resetStreak: () =>
        set((state) =>
          updateActiveSystem(state, (system) => ({
            ...system,
            streak: EMPTY_STREAK,
          })),
        ),

      restoreData: (data) =>
        set({
          ...normalizeState(data),
          selectedId: null,
          viewMode: "system",
          isAddOpen: false,
          isListOpen: false,
          isGoalOpen: false,
          isSettingsOpen: false,
          isSystemOpen: false,
          isCommandOpen: false,
          focus: emptyFocus(),
        }),

      selectTask: (id) => set({ selectedId: id, isListOpen: false }),

      updateMainGoal: (goal) => {
        const value = goal.trim();
        if (!value) return;

        set((state) => ({
          ...updateActiveSystem(state, (system) => ({
            ...system,
            mainGoal: value,
          })),
          isGoalOpen: false,
        }));
      },

      openGalaxy: () =>
        set({
          viewMode: "galaxy",
          selectedId: null,
          isAddOpen: false,
          isListOpen: false,
          isGoalOpen: false,
          isSettingsOpen: false,
          isSystemOpen: false,
          isCommandOpen: false,
        }),

      closeGalaxy: () => set({ viewMode: "system" }),

      openCommand: () => set({ isCommandOpen: true }),
      closeCommand: () => set({ isCommandOpen: false }),
      toggleCommand: () =>
        set((state) => ({ isCommandOpen: !state.isCommandOpen })),

      startFocus: (taskId, minutes) => {
        const state = get();
        const exists = state.systems.some((system) =>
          system.tasks.some((task) => task.id === taskId),
        );
        if (!exists) return;
        const duration = clampFocusMinutes(minutes);
        set({
          focus: {
            taskId,
            minutes: duration,
            remaining: duration * 60,
            running: true,
            endsAt: Date.now() + duration * 60_000,
          },
          selectedId: taskId,
          viewMode: "system",
          isCommandOpen: false,
          isAddOpen: false,
          isListOpen: false,
          isGoalOpen: false,
          isSettingsOpen: false,
          isSystemOpen: false,
        });
      },

      pauseFocus: () =>
        set((state) => {
          const focus = state.focus;
          if (!focus.running || focus.endsAt === null) return {};
          return {
            focus: {
              ...focus,
              running: false,
              endsAt: null,
              remaining: Math.max(
                0,
                Math.round((focus.endsAt - Date.now()) / 1000),
              ),
            },
          };
        }),

      resumeFocus: () =>
        set((state) => {
          const focus = state.focus;
          if (!focus.taskId || focus.running || focus.remaining <= 0) return {};
          return {
            focus: {
              ...focus,
              running: true,
              endsAt: Date.now() + focus.remaining * 1000,
            },
          };
        }),

      stopFocus: () => {
        const state = get();
        const focus = state.focus;
        if (!focus.taskId) return;
        const elapsed = focus.minutes * 60 - focus.remaining;
        if (elapsed >= 60) {
          state.logFocusSession(
            focus.taskId,
            Math.max(1, Math.round(elapsed / 60)),
          );
        }
        set({ focus: emptyFocus() });
      },

      tickFocus: () => {
        const state = get();
        const focus = state.focus;
        if (!focus.running || focus.endsAt === null) return;
        const remaining = Math.max(
          0,
          Math.round((focus.endsAt - Date.now()) / 1000),
        );
        if (remaining === focus.remaining) return;

        if (remaining === 0) {
          const taskId = focus.taskId;
          set({ focus: emptyFocus() });
          if (taskId) state.logFocusSession(taskId, focus.minutes);
          if (state.settings.sound) playCompletionChime();
          return;
        }
        set({ focus: { ...focus, remaining } });
      },

      toggleAutoRotate: () =>
        set((state) => ({ autoRotate: !state.autoRotate })),

      requestReset: () =>
        set((state) => ({
          resetSignal: state.resetSignal + 1,
          selectedId: null,
          isListOpen: false,
        })),

      openAdd: () =>
        set({
          isAddOpen: true,
          isListOpen: false,
          isGoalOpen: false,
          isSettingsOpen: false,
          isSystemOpen: false,
          isCommandOpen: false,
        }),
      closeAdd: () => set({ isAddOpen: false }),
      openList: () =>
        set({
          isListOpen: true,
          isAddOpen: false,
          isGoalOpen: false,
          isSettingsOpen: false,
          isSystemOpen: false,
          isCommandOpen: false,
        }),
      closeList: () => set({ isListOpen: false }),
      openGoal: () =>
        set({
          isGoalOpen: true,
          isAddOpen: false,
          isListOpen: false,
          isSettingsOpen: false,
          isSystemOpen: false,
          isCommandOpen: false,
        }),
      closeGoal: () => set({ isGoalOpen: false }),
      openSettings: () =>
        set({
          isSettingsOpen: true,
          isAddOpen: false,
          isListOpen: false,
          isGoalOpen: false,
          isSystemOpen: false,
          isCommandOpen: false,
        }),
      closeSettings: () => set({ isSettingsOpen: false }),
      openSystem: () =>
        set({
          isSystemOpen: true,
          isAddOpen: false,
          isListOpen: false,
          isGoalOpen: false,
          isSettingsOpen: false,
          isCommandOpen: false,
        }),
      closeSystem: () => set({ isSystemOpen: false }),
      closeAllPanels: () =>
        set({
          isAddOpen: false,
          isListOpen: false,
          isGoalOpen: false,
          isSettingsOpen: false,
          isSystemOpen: false,
          isCommandOpen: false,
        }),
    }),
    {
      name: STORAGE_KEY,
      version: STORE_VERSION,
      partialize: (state) => ({
        systems: state.systems,
        activeSystemId: state.activeSystemId,
        settings: state.settings,
      }),
      migrate: (persisted) => normalizeState(persisted),
      merge: (persisted, current) => ({
        ...current,
        ...normalizeState(persisted),
      }),
    },
  ),
);

/** Convenience hook: the solar system the user is currently inside. */
export const useActiveSystem = () =>
  useTaskStore((state) => pickActiveSystem(state));
