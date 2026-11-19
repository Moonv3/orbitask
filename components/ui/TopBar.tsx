"use client";

import { useState } from "react";
import {
  Check,
  ChevronDown,
  Command,
  List,
  Orbit,
  Pause,
  Play,
  Plus,
  RotateCcw,
  Settings2,
  Sparkles,
} from "lucide-react";
import { MAX_TASKS } from "@/lib/orbit";
import { MAX_SYSTEMS } from "@/lib/migrate";
import { useActiveSystem, useTaskStore } from "@/store/useTaskStore";

const ghostButton =
  "inline-flex h-10 items-center justify-center gap-2 rounded-full border border-white/10 bg-white/[0.04] px-3 text-xs font-medium text-white/75 transition hover:border-white/20 hover:bg-white/[0.08] hover:text-white";

export default function TopBar() {
  const system = useActiveSystem();
  const systems = useTaskStore((state) => state.systems);
  const autoRotate = useTaskStore((state) => state.autoRotate);
  const toggleAutoRotate = useTaskStore((state) => state.toggleAutoRotate);
  const requestReset = useTaskStore((state) => state.requestReset);
  const openList = useTaskStore((state) => state.openList);
  const openAdd = useTaskStore((state) => state.openAdd);
  const openSettings = useTaskStore((state) => state.openSettings);
  const openSystem = useTaskStore((state) => state.openSystem);
  const openGalaxy = useTaskStore((state) => state.openGalaxy);
  const openCommand = useTaskStore((state) => state.openCommand);
  const switchSystem = useTaskStore((state) => state.switchSystem);

  const [menuOpen, setMenuOpen] = useState(false);

  const tasks = system.tasks;
  const total = tasks.length;
  const completed = tasks.filter((task) => task.completed).length;
  const percent = total === 0 ? 0 : Math.round((completed / total) * 100);
  const orbitFull = total >= MAX_TASKS;

  const activeSystems = systems.filter((item) => !item.archived);
  const archivedCount = systems.length - activeSystems.length;

  return (
    <header className="pointer-events-none absolute inset-x-0 top-0 z-30 flex flex-wrap items-start justify-between gap-3 px-4 py-4 sm:px-6 sm:py-5">
      <div className="pointer-events-auto flex items-center gap-3">
        <div className="relative grid h-10 w-10 place-items-center rounded-2xl border border-white/10 bg-white/[0.05] shadow-[inset_0_1px_0_rgba(255,255,255,0.08)]">
          <Orbit className="h-5 w-5 text-accent" strokeWidth={1.7} />
          <span
            className="absolute -right-0.5 -top-0.5 h-2 w-2 rounded-full"
            style={{
              background: system.accent,
              boxShadow: `0 0 12px ${system.accent}`,
            }}
          />
        </div>
        <div className="leading-tight">
          <p className="text-[15px] font-semibold tracking-tight text-white">
            Orbitask
          </p>
          <p className="hidden text-[11px] text-muted sm:block">
            Satu tujuan, satu tata surya.
          </p>
        </div>
      </div>

      <div className="pointer-events-auto flex flex-wrap items-center justify-end gap-2">
        <div className="hidden items-center gap-3 rounded-full border border-white/10 bg-white/[0.04] px-3.5 py-2 md:flex">
          <div
            className="h-1.5 w-24 overflow-hidden rounded-full bg-white/10"
            role="progressbar"
            aria-valuenow={percent}
            aria-valuemin={0}
            aria-valuemax={100}
            aria-label="Progres tugas"
          >
            <div
              className="h-full rounded-full bg-gradient-to-r from-mint to-emerald-300 transition-[width] duration-500"
              style={{ width: `${percent}%` }}
            />
          </div>
          <span className="font-mono text-[11px] text-white/70">
            {completed}/{total} selesai
          </span>
        </div>

        <span className="rounded-full border border-white/10 bg-white/[0.04] px-3 py-2 font-mono text-[11px] text-white/70 md:hidden">
          {completed}/{total}
        </span>

        <button
          type="button"
          onClick={openCommand}
          className={ghostButton}
          aria-label="Buka palet perintah (Ctrl+K)"
          title="Palet perintah · Ctrl+K"
        >
          <Command className="h-4 w-4 text-accent" />
          <kbd className="hidden rounded border border-white/10 bg-white/[0.04] px-1.5 py-0.5 font-mono text-[9px] text-muted xl:inline">
            ⌘K
          </kbd>
        </button>

        <button
          type="button"
          onClick={openGalaxy}
          className={ghostButton}
          aria-label="Buka peta galaksi"
          title="Peta galaksi"
        >
          <Sparkles className="h-4 w-4 text-accent" />
          <span className="hidden xl:inline">Galaksi</span>
        </button>

        <div className="relative">
          <button
            type="button"
            onClick={() => setMenuOpen((open) => !open)}
            className={`${ghostButton} max-w-[188px]`}
            aria-label={`Tata surya aktif: ${system.name}. Ganti tata surya`}
            aria-haspopup="menu"
            aria-expanded={menuOpen}
            title="Ganti tata surya"
          >
            <span
              className="h-2.5 w-2.5 shrink-0 rounded-full"
              style={{
                background: system.accent,
                boxShadow: `0 0 10px ${system.accent}`,
              }}
            />
            <span className="max-w-[104px] truncate text-[11.5px]">
              {system.name}
            </span>
            <ChevronDown
              className={`h-3.5 w-3.5 shrink-0 text-white/45 transition ${
                menuOpen ? "rotate-180" : ""
              }`}
            />
          </button>

          {menuOpen && (
            <>
              <button
                type="button"
                aria-label="Tutup daftar tata surya"
                onClick={() => setMenuOpen(false)}
                className="fixed inset-0 z-40 cursor-default bg-[#02040a]/20"
              />
              <div
                role="menu"
                aria-label="Daftar tata surya"
                className="glass absolute right-0 z-50 mt-2 w-64 animate-rise-in overflow-hidden rounded-2xl p-1.5"
              >
                <p className="px-2.5 pb-1.5 pt-1 font-mono text-[9px] uppercase tracking-[0.2em] text-muted">
                  Tata surya
                </p>

                <div className="max-h-64 overflow-y-auto panel-scroll">
                  {activeSystems.map((item) => {
                    const active = item.id === system.id;
                    const itemDone = item.tasks.filter(
                      (task) => task.completed,
                    ).length;
                    return (
                      <button
                        key={item.id}
                        type="button"
                        role="menuitem"
                        aria-current={active ? "true" : undefined}
                        onClick={() => {
                          switchSystem(item.id);
                          setMenuOpen(false);
                        }}
                        className={`flex w-full items-center gap-2.5 rounded-xl px-2.5 py-2 text-left transition ${
                          active
                            ? "bg-white/[0.09] text-white"
                            : "text-white/70 hover:bg-white/[0.06] hover:text-white"
                        }`}
                      >
                        <span
                          className="h-2 w-2 shrink-0 rounded-full"
                          style={{
                            background: item.accent,
                            boxShadow: active
                              ? `0 0 10px ${item.accent}`
                              : undefined,
                          }}
                        />
                        <span className="min-w-0 flex-1">
                          <span className="block truncate text-[12px] font-medium">
                            {item.name}
                          </span>
                          <span className="mt-0.5 block truncate font-mono text-[9.5px] text-muted">
                            {itemDone}/{item.tasks.length} tugas
                            {item.mainGoal ? ` · ${item.mainGoal}` : ""}
                          </span>
                        </span>
                        {active && <Check className="h-3.5 w-3.5 text-mint" />}
                      </button>
                    );
                  })}
                </div>

                <div className="mt-1 border-t border-white/8 pt-1">
                  <button
                    type="button"
                    role="menuitem"
                    onClick={() => {
                      setMenuOpen(false);
                      openGalaxy();
                    }}
                    className="flex w-full items-center gap-2 rounded-xl px-2.5 py-2 text-left text-[11.5px] text-white/65 transition hover:bg-white/[0.06] hover:text-white"
                  >
                    <Sparkles className="h-3.5 w-3.5 text-accent" />
                    Lihat peta galaksi
                  </button>
                  <button
                    type="button"
                    role="menuitem"
                    onClick={() => {
                      setMenuOpen(false);
                      openSystem();
                    }}
                    className="flex w-full items-center gap-2 rounded-xl px-2.5 py-2 text-left text-[11.5px] text-white/65 transition hover:bg-white/[0.06] hover:text-white"
                  >
                    <Sparkles className="h-3.5 w-3.5 text-accent" />
                    Kelola tata surya
                    <span className="ml-auto font-mono text-[9.5px] text-muted">
                      {systems.length}/{MAX_SYSTEMS}
                      {archivedCount > 0 ? ` · ${archivedCount} arsip` : ""}
                    </span>
                  </button>
                </div>
              </div>
            </>
          )}
        </div>

        <button
          type="button"
          onClick={openList}
          className={ghostButton}
          aria-label="Buka daftar tugas"
          title="Daftar tugas"
        >
          <List className="h-4 w-4" />
          <span className="hidden lg:inline">Daftar</span>
        </button>

        <button
          type="button"
          onClick={toggleAutoRotate}
          className={`${ghostButton} w-10 px-0 ${
            autoRotate ? "text-mint" : "text-white/50"
          }`}
          aria-label={
            autoRotate ? "Hentikan rotasi otomatis" : "Aktifkan rotasi otomatis"
          }
          aria-pressed={autoRotate}
          title={autoRotate ? "Pause rotasi" : "Putar otomatis"}
        >
          {autoRotate ? (
            <Pause className="h-4 w-4" />
          ) : (
            <Play className="h-4 w-4" />
          )}
        </button>

        <button
          type="button"
          onClick={requestReset}
          className={`${ghostButton} w-10 px-0`}
          aria-label="Reset kamera"
          title="Reset kamera"
        >
          <RotateCcw className="h-4 w-4" />
        </button>

        <button
          type="button"
          onClick={openSettings}
          className={`${ghostButton} w-10 px-0`}
          aria-label="Buka pengaturan"
          title="Pengaturan"
        >
          <Settings2 className="h-4 w-4" />
        </button>

        <button
          type="button"
          onClick={openAdd}
          disabled={orbitFull}
          className="inline-flex h-10 items-center justify-center gap-2 rounded-full bg-gradient-to-r from-[#ffc26b] via-[#ffb35c] to-[#ff8f5e] px-4 text-xs font-semibold text-[#231304] shadow-[0_10px_30px_-10px_rgba(255,179,92,0.7)] transition hover:brightness-110 disabled:opacity-50 disabled:shadow-none"
          title={orbitFull ? "Orbit penuh" : "Tambah tugas"}
        >
          <Plus className="h-4 w-4" strokeWidth={2.6} />
          <span>Tambah tugas</span>
        </button>
      </div>
    </header>
  );
}
