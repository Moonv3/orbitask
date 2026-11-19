"use client";

import {
  ArchiveRestore,
  ArrowLeft,
  ArrowRight,
  Hand,
  Layers,
  MousePointer2,
  Plus,
  Settings2,
  Sparkles,
  Zap,
  ZoomIn,
} from "lucide-react";
import { formatMinutes } from "@/lib/format";
import { currentStreak, energySummary } from "@/lib/selectors";
import { useTaskStore } from "@/store/useTaskStore";
import type { System } from "@/lib/types";

const ghostButton =
  "inline-flex h-10 items-center justify-center gap-2 rounded-full border border-white/10 bg-white/[0.04] px-3 text-xs font-medium text-white/75 transition hover:border-white/20 hover:bg-white/[0.08] hover:text-white";

function SystemCard({
  system,
  active,
  compact = false,
}: {
  system: System;
  active: boolean;
  compact?: boolean;
}) {
  const enterSystem = useTaskStore((state) => state.enterSystem);
  const restoreSystem = useTaskStore((state) => state.restoreSystem);

  const done = system.tasks.filter((task) => task.completed).length;
  const percent =
    system.tasks.length === 0
      ? 0
      : Math.round((done / system.tasks.length) * 100);
  const energy = energySummary(system.tasks, system.energyMinutes);
  const streak = currentStreak(system.streak);

  return (
    <div
      className={`rounded-2xl border p-3 transition ${
        compact ? "w-[222px] shrink-0" : ""
      } ${
        active
          ? "border-white/20 bg-white/[0.06]"
          : system.archived
            ? "border-white/8 bg-white/[0.015] opacity-70"
            : "border-white/8 bg-white/[0.03] hover:border-white/15"
      }`}
    >
      <div className="flex items-start gap-2.5">
        <span
          className="mt-1 h-2.5 w-2.5 shrink-0 rounded-full"
          style={{
            background: system.accent,
            boxShadow: active ? `0 0 12px ${system.accent}` : undefined,
          }}
        />
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-1.5">
            <p className="truncate text-[12.5px] font-medium text-white/90">
              {system.name}
            </p>
            {active && (
              <span className="shrink-0 rounded-full border border-mint/30 bg-mint/10 px-1.5 py-0.5 font-mono text-[8.5px] uppercase tracking-[0.1em] text-mint">
                aktif
              </span>
            )}
            {system.archived && (
              <span className="shrink-0 rounded-full border border-white/12 bg-white/[0.05] px-1.5 py-0.5 font-mono text-[8.5px] uppercase tracking-[0.1em] text-white/45">
                arsip
              </span>
            )}
          </div>
          <p className="mt-0.5 truncate text-[10.5px] text-muted">
            {system.mainGoal}
          </p>
        </div>
      </div>

      <div className="mt-2.5 flex items-center gap-2">
        <div className="h-1 flex-1 overflow-hidden rounded-full bg-white/10">
          <div
            className="h-full rounded-full bg-gradient-to-r from-mint to-emerald-300 transition-[width] duration-500"
            style={{ width: `${percent}%` }}
          />
        </div>
        <span className="font-mono text-[9.5px] text-muted">
          {done}/{system.tasks.length}
        </span>
      </div>

      <div className="mt-2 flex items-center justify-between gap-2">
        <div className="flex items-center gap-2 font-mono text-[9.5px] text-muted">
          <span
            className="inline-flex items-center gap-1"
            style={{ color: energy.over ? energy.color : undefined }}
          >
            <Zap className="h-2.5 w-2.5" style={{ color: energy.color }} />
            {formatMinutes(energy.used)}/{formatMinutes(energy.budget)}
          </span>
          {streak > 0 && (
            <span className="text-orange-300/80">{streak} hari</span>
          )}
        </div>

        {system.archived ? (
          <button
            type="button"
            onClick={() => restoreSystem(system.id)}
            className="inline-flex h-7 shrink-0 items-center gap-1 rounded-full border border-white/10 bg-white/[0.04] px-2.5 text-[10.5px] font-medium text-white/70 transition hover:border-mint/40 hover:text-mint"
          >
            <ArchiveRestore className="h-3 w-3" />
            Pulihkan
          </button>
        ) : (
          <button
            type="button"
            onClick={() => enterSystem(system.id)}
            className="inline-flex h-7 shrink-0 items-center gap-1 rounded-full border border-accent/30 bg-accent/10 px-2.5 text-[10.5px] font-medium text-accent transition hover:border-accent/60 hover:bg-accent/20"
          >
            {active ? "Lihat" : "Masuk"}
            <ArrowRight className="h-3 w-3" />
          </button>
        )}
      </div>
    </div>
  );
}

export default function GalaxyOverlay() {
  const systems = useTaskStore((state) => state.systems);
  const activeSystemId = useTaskStore((state) => state.activeSystemId);
  const closeGalaxy = useTaskStore((state) => state.closeGalaxy);
  const openSettings = useTaskStore((state) => state.openSettings);
  const openSystem = useTaskStore((state) => state.openSystem);

  const activeSystems = systems.filter((system) => !system.archived);
  const archived = systems.filter((system) => system.archived);
  const ordered = [...activeSystems, ...archived];

  return (
    <div className="pointer-events-none absolute inset-0 z-30">
      <header className="pointer-events-auto absolute inset-x-0 top-0 flex flex-wrap items-start justify-between gap-3 px-4 py-4 sm:px-6 sm:py-5">
        <div className="flex items-center gap-3">
          <div className="relative grid h-10 w-10 place-items-center rounded-2xl border border-white/10 bg-white/[0.05] shadow-[inset_0_1px_0_rgba(255,255,255,0.08)]">
            <Sparkles className="h-5 w-5 text-accent" strokeWidth={1.7} />
            <span className="absolute -right-0.5 -top-0.5 h-2 w-2 rounded-full bg-mint shadow-[0_0_12px_#5eead4]" />
          </div>
          <div className="leading-tight">
            <p className="text-[15px] font-semibold tracking-tight text-white">
              Peta Galaksi
            </p>
            <p className="hidden text-[11px] text-muted sm:block">
              Setiap bintang adalah satu tata surya.
            </p>
          </div>
        </div>

        <div className="flex flex-wrap items-center justify-end gap-2">
          <button
            type="button"
            onClick={openSystem}
            className={ghostButton}
            aria-label="Kelola tata surya"
            title="Kelola tata surya"
          >
            <Layers className="h-4 w-4" />
            <span className="hidden lg:inline">Kelola</span>
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
            onClick={closeGalaxy}
            className="inline-flex h-10 items-center gap-2 rounded-full bg-gradient-to-r from-[#ffc26b] via-[#ffb35c] to-[#ff8f5e] px-4 text-xs font-semibold text-[#231304] shadow-[0_10px_30px_-10px_rgba(255,179,92,0.7)] transition hover:brightness-110"
          >
            <ArrowLeft className="h-4 w-4" />
            <span>Kembali</span>
          </button>
        </div>
      </header>

      <aside className="pointer-events-auto absolute right-4 top-[78px] z-20 hidden w-[288px] flex-col rounded-3xl p-3 sm:right-6 md:flex">
        <div className="glass panel-scroll flex max-h-[calc(100dvh-104px)] flex-col overflow-hidden rounded-3xl">
          <div className="flex items-center justify-between gap-2 px-3 pb-2 pt-3.5">
            <div>
              <p className="font-mono text-[9px] uppercase tracking-[0.2em] text-accent">
                Daftar bintang
              </p>
              <p className="mt-0.5 text-[12px] font-medium text-white">
                {activeSystems.length} aktif
                {archived.length > 0 ? ` · ${archived.length} arsip` : ""}
              </p>
            </div>
            <button
              type="button"
              onClick={openSystem}
              className="grid h-8 w-8 place-items-center rounded-full border border-white/10 bg-white/[0.04] text-white/60 transition hover:border-white/20 hover:text-white"
              aria-label="Tambah tata surya"
              title="Tambah tata surya"
            >
              <Plus className="h-4 w-4" />
            </button>
          </div>

          <div className="panel-scroll space-y-2 overflow-y-auto px-2 pb-2">
            {ordered.map((system) => (
              <SystemCard
                key={system.id}
                system={system}
                active={system.id === activeSystemId}
              />
            ))}
          </div>

          <p className="border-t border-white/8 px-3 py-2.5 text-[10px] leading-snug text-muted/75">
            Arsip tidak menghapus apa pun. Pulihkan kapan saja dari sini.
          </p>
        </div>
      </aside>

      <div className="pointer-events-auto absolute bottom-6 left-6 z-20 hidden items-center gap-4 rounded-full px-4 py-2.5 text-[11px] text-white/55 md:inline-flex">
        <span className="glass-soft inline-flex items-center gap-1.5 rounded-full px-4 py-2.5">
          <MousePointer2 className="h-3.5 w-3.5" />
          Klik bintang untuk masuk
        </span>
        <span className="glass-soft inline-flex items-center gap-1.5 rounded-full px-4 py-2.5">
          <Hand className="h-3.5 w-3.5" />
          Seret untuk memutar
        </span>
        <span className="glass-soft inline-flex items-center gap-1.5 rounded-full px-4 py-2.5">
          <ZoomIn className="h-3.5 w-3.5" />
          Scroll untuk zoom
        </span>
      </div>

      <div className="pointer-events-auto absolute inset-x-0 bottom-0 z-20 md:hidden">
        <div className="panel-scroll flex gap-2 overflow-x-auto px-4 pb-4 pt-2">
          {ordered.map((system) => (
            <SystemCard
              key={system.id}
              system={system}
              active={system.id === activeSystemId}
              compact
            />
          ))}
        </div>
      </div>
    </div>
  );
}
