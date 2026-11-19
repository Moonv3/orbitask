"use client";

import { useMemo, useState, type KeyboardEvent as ReactKeyboardEvent } from "react";
import {
  ArrowRight,
  Check,
  Command,
  Galaxy,
  List,
  Moon,
  Orbit,
  Plus,
  RotateCcw,
  Settings2,
  Sparkles,
  Target,
  Timer,
} from "lucide-react";
import type { LucideIcon } from "lucide-react";
import { useActiveSystem, useTaskStore } from "@/store/useTaskStore";

type CommandAction = {
  id: string;
  label: string;
  hint?: string;
  icon: LucideIcon;
  keywords: string;
  run: () => void;
};

export default function CommandPalette() {
  const isOpen = useTaskStore((state) => state.isCommandOpen);
  const closeCommand = useTaskStore((state) => state.closeCommand);
  const systems = useTaskStore((state) => state.systems);
  const system = useActiveSystem();
  const openAdd = useTaskStore((state) => state.openAdd);
  const openList = useTaskStore((state) => state.openList);
  const openGoal = useTaskStore((state) => state.openGoal);
  const openSettings = useTaskStore((state) => state.openSettings);
  const openSystem = useTaskStore((state) => state.openSystem);
  const openGalaxy = useTaskStore((state) => state.openGalaxy);
  const requestReset = useTaskStore((state) => state.requestReset);
  const toggleAutoRotate = useTaskStore((state) => state.toggleAutoRotate);
  const toggleComplete = useTaskStore((state) => state.toggleComplete);
  const selectTask = useTaskStore((state) => state.selectTask);
  const startFocus = useTaskStore((state) => state.startFocus);
  const switchSystem = useTaskStore((state) => state.switchSystem);
  const autoRotate = useTaskStore((state) => state.autoRotate);
  const reopenIntro = useTaskStore((state) => state.reopenIntro);

  const [query, setQuery] = useState("");
  const [activeIndex, setActiveIndex] = useState(0);

  const actions = useMemo<CommandAction[]>(() => {
    const run = (action: () => void) => () => {
      action();
      closeCommand();
    };

    const base: CommandAction[] = [
      {
        id: "add",
        label: "Tambah tugas baru",
        hint: "planet",
        icon: Plus,
        keywords: "tambah tugas baru planet add",
        run: run(openAdd),
      },
      {
        id: "list",
        label: "Buka daftar tugas",
        hint: "semua orbit",
        icon: List,
        keywords: "daftar tugas semua orbit list",
        run: run(openList),
      },
      {
        id: "goal",
        label: "Ubah tujuan utama",
        hint: "matahari",
        icon: Target,
        keywords: "tujuan utama matahari goal edit",
        run: run(openGoal),
      },
      {
        id: "galaxy",
        label: "Buka peta galaksi",
        icon: Galaxy,
        keywords: "peta galaksi sistem sistem-surya galaxy",
        run: run(openGalaxy),
      },
      {
        id: "systems",
        label: "Kelola tata surya",
        icon: Orbit,
        keywords: "kelola tata surya arsip system",
        run: run(openSystem),
      },
      {
        id: "settings",
        label: "Buka pengaturan",
        icon: Settings2,
        keywords: "pengaturan kualitas suara settings",
        run: run(openSettings),
      },
      {
        id: "reset-camera",
        label: "Reset kamera",
        icon: RotateCcw,
        keywords: "reset kamera tampilan camera",
        run: run(requestReset),
      },
      {
        id: "auto-rotate",
        label: autoRotate
          ? "Hentikan rotasi otomatis"
          : "Aktifkan rotasi otomatis",
        icon: Sparkles,
        keywords: "rotasi otomatis putar pause play",
        run: run(toggleAutoRotate),
      },
      {
        id: "intro",
        label: "Buka panduan singkat",
        icon: Moon,
        keywords: "panduan intro bantuan guide",
        run: run(reopenIntro),
      },
    ];

    const taskActions: CommandAction[] = system.tasks.flatMap((task) => [
      {
        id: `focus-${task.id}`,
        label: `Fokus 25 menit · ${task.title}`,
        hint: "timer",
        icon: Timer,
        keywords: `fokus timer ${task.title}`,
        run: run(() => startFocus(task.id, 25)),
      },
      {
        id: `open-${task.id}`,
        label: `Lihat detail · ${task.title}`,
        icon: Orbit,
        keywords: `detail buka ${task.title} ${task.tags.join(" ")}`,
        run: run(() => selectTask(task.id)),
      },
      {
        id: `done-${task.id}`,
        label: `${task.completed ? "Batalkan selesai" : "Tandai selesai"} · ${task.title}`,
        icon: Check,
        keywords: `selesai complete ${task.title}`,
        run: run(() => toggleComplete(task.id)),
      },
    ]);

    const systemActions: CommandAction[] = systems
      .filter((item) => !item.archived && item.id !== system.id)
      .map((item) => ({
        id: `switch-${item.id}`,
        label: `Pindah ke ${item.name}`,
        hint: `${item.tasks.length} tugas`,
        icon: Orbit,
        keywords: `pindah ganti tata surya ${item.name}`,
        run: run(() => switchSystem(item.id)),
      }));

    return [...base, ...taskActions, ...systemActions];
  }, [
    autoRotate,
    closeCommand,
    openAdd,
    openGalaxy,
    openGoal,
    openList,
    openSettings,
    openSystem,
    reopenIntro,
    requestReset,
    selectTask,
    startFocus,
    switchSystem,
    system,
    systems,
    toggleAutoRotate,
    toggleComplete,
  ]);

  const filtered = useMemo(() => {
    const needle = query.trim().toLocaleLowerCase("id");
    if (!needle) return actions;
    return actions.filter((action) =>
      `${action.label} ${action.keywords}`.toLocaleLowerCase("id").includes(needle),
    );
  }, [actions, query]);

  if (!isOpen) return null;

  const handleKeyDown = (event: ReactKeyboardEvent<HTMLInputElement>) => {
    if (event.key === "ArrowDown") {
      event.preventDefault();
      setActiveIndex((index) =>
        filtered.length === 0 ? 0 : (index + 1) % filtered.length,
      );
    } else if (event.key === "ArrowUp") {
      event.preventDefault();
      setActiveIndex((index) =>
        filtered.length === 0 ? 0 : (index - 1 + filtered.length) % filtered.length,
      );
    } else if (event.key === "Enter") {
      event.preventDefault();
      filtered[activeIndex]?.run();
    }
  };

  return (
    <div
      className="fixed inset-0 z-[70] flex items-start justify-center bg-[#02040a]/75 p-4 pt-[12vh] backdrop-blur-md"
      onMouseDown={(event) => {
        if (event.target === event.currentTarget) closeCommand();
      }}
      role="presentation"
    >
      <div
        role="dialog"
        aria-modal="true"
        aria-label="Palet perintah"
        className="glass w-full max-w-lg animate-rise-in overflow-hidden rounded-3xl"
      >
        <div className="flex items-center gap-3 border-b border-white/8 px-4 py-3.5">
          <Command className="h-4 w-4 shrink-0 text-accent" />
          <input
            autoFocus
            value={query}
            onChange={(event) => {
              setQuery(event.target.value);
              setActiveIndex(0);
            }}
            onKeyDown={handleKeyDown}
            placeholder="Cari perintah atau tugas…"
            aria-label="Cari perintah atau tugas"
            className="h-8 min-w-0 flex-1 bg-transparent text-[13px] text-white placeholder:text-muted/70 outline-none"
          />
          <kbd className="rounded-md border border-white/10 bg-white/[0.04] px-1.5 py-0.5 font-mono text-[9px] text-muted">
            ESC
          </kbd>
        </div>

        <div className="panel-scroll max-h-[54dvh] overflow-y-auto p-2">
          {filtered.length === 0 ? (
            <p className="px-3 py-8 text-center text-[12px] text-muted">
              Tidak ada perintah yang cocok.
            </p>
          ) : (
            <ul role="listbox" aria-label="Hasil perintah">
              {filtered.map((action, index) => {
                const Icon = action.icon;
                const active = index === activeIndex;
                return (
                  <li key={action.id} role="option" aria-selected={active}>
                    <button
                      type="button"
                      onMouseEnter={() => setActiveIndex(index)}
                      onClick={action.run}
                      className={`flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-left transition ${
                        active
                          ? "bg-white/[0.09] text-white"
                          : "text-white/70 hover:bg-white/[0.05]"
                      }`}
                    >
                      <span
                        className={`grid h-7 w-7 shrink-0 place-items-center rounded-lg border ${
                          active
                            ? "border-accent/35 bg-accent/10 text-accent"
                            : "border-white/10 bg-white/[0.03] text-white/50"
                        }`}
                      >
                        <Icon className="h-3.5 w-3.5" />
                      </span>
                      <span className="min-w-0 flex-1 truncate text-[12px] font-medium">
                        {action.label}
                      </span>
                      {action.hint && (
                        <span className="hidden font-mono text-[9.5px] text-muted sm:inline">
                          {action.hint}
                        </span>
                      )}
                      {active && (
                        <ArrowRight className="h-3.5 w-3.5 shrink-0 text-accent" />
                      )}
                    </button>
                  </li>
                );
              })}
            </ul>
          )}
        </div>

        <div className="flex items-center gap-3 border-t border-white/8 px-4 py-2.5 font-mono text-[9.5px] text-muted">
          <span>↑ ↓ pilih</span>
          <span>↵ jalankan</span>
          <span className="ml-auto">Orbitask · {system.name}</span>
        </div>
      </div>
    </div>
  );
}
