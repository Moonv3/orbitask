"use client";

import { useState } from "react";
import {
  Check,
  ChevronRight,
  Moon,
  Orbit,
  Plus,
  X,
  Zap,
} from "lucide-react";
import { dueLabel, formatMinutes, isOverdue } from "@/lib/format";
import { MAX_TASKS } from "@/lib/orbit";
import { LANES, LANE_META, PRIORITY_META } from "@/lib/palette";
import {
  countComets,
  energySummary,
  inConstellation,
  isComet,
  taskConstellations,
  taskMoonProgress,
} from "@/lib/selectors";
import { useActiveSystem, useTaskStore } from "@/store/useTaskStore";
import type { Priority } from "@/lib/types";

const rank: Record<Priority, number> = { high: 0, medium: 1, low: 2 };

type Filter = "all" | "active" | "comet" | "done";

const FILTERS: { id: Filter; label: string }[] = [
  { id: "all", label: "Semua" },
  { id: "active", label: "Aktif" },
  { id: "comet", label: "Komet" },
  { id: "done", label: "Selesai" },
];

export default function TaskListDialog() {
  const [filter, setFilter] = useState<Filter>("all");
  const [constellation, setConstellation] = useState<string | null>(null);
  const [draggingId, setDraggingId] = useState<string | null>(null);

  const isOpen = useTaskStore((state) => state.isListOpen);
  const closeList = useTaskStore((state) => state.closeList);
  const openAdd = useTaskStore((state) => state.openAdd);
  const selectTask = useTaskStore((state) => state.selectTask);
  const toggleComplete = useTaskStore((state) => state.toggleComplete);
  const setTaskLane = useTaskStore((state) => state.setTaskLane);
  const system = useActiveSystem();
  const tasks = system.tasks;

  if (!isOpen) return null;

  const total = tasks.length;
  const completed = tasks.filter((task) => task.completed).length;
  const percent = total === 0 ? 0 : Math.round((completed / total) * 100);
  const comets = countComets(tasks);
  const energy = energySummary(tasks, system.energyMinutes);
  const constellations = taskConstellations(tasks);

  const sorted = [...tasks].sort((a, b) => {
    if (isComet(a) !== isComet(b)) return isComet(a) ? -1 : 1;
    if (a.completed !== b.completed) return a.completed ? 1 : -1;
    if (rank[a.priority] !== rank[b.priority]) {
      return rank[a.priority] - rank[b.priority];
    }
    return (a.dueDate ?? "9999-12-31").localeCompare(
      b.dueDate ?? "9999-12-31",
    );
  });

  const visible = sorted.filter((task) => {
    if (!inConstellation(task, constellation)) return false;
    if (filter === "active") return !task.completed;
    if (filter === "comet") return isComet(task);
    if (filter === "done") return task.completed;
    return true;
  });

  const counts: Record<Filter, number> = {
    all: total,
    active: total - completed,
    comet: comets,
    done: completed,
  };

  return (
    <div
      className="fixed inset-0 z-50 grid place-items-center bg-[#02040a]/70 p-4 backdrop-blur-md"
      onMouseDown={(event) => {
        if (event.target === event.currentTarget) closeList();
      }}
      role="presentation"
    >
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="task-list-title"
        className="glass flex max-h-[88dvh] w-full max-w-xl animate-rise-in flex-col rounded-3xl p-5 sm:p-6"
      >
        <div className="flex items-start justify-between gap-4">
          <div>
            <span className="block max-w-[280px] truncate font-mono text-[10px] uppercase tracking-[0.24em] text-mint">
              Semua orbit · {system.name}
            </span>
            <h2
              id="task-list-title"
              className="mt-1.5 text-xl font-semibold tracking-tight text-white"
            >
              Daftar tugas
            </h2>
            <p className="mt-1 flex flex-wrap items-center gap-x-1.5 gap-y-1 text-[12px] text-muted">
              <span>
                {completed} selesai dari {total} tugas
              </span>
              {comets > 0 && (
                <>
                  <span className="text-white/20">·</span>
                  <span className="inline-flex items-center gap-1 text-orange-300">
                    <Zap className="h-3 w-3" />
                    {comets} komet
                  </span>
                </>
              )}
              <span className="text-white/20">·</span>
              <span
                className="font-mono text-[10.5px]"
                style={{ color: energy.over ? energy.color : undefined }}
              >
                {formatMinutes(energy.used)} / {formatMinutes(energy.budget)}
              </span>
            </p>
          </div>
          <button
            type="button"
            onClick={closeList}
            className="grid h-8 w-8 shrink-0 place-items-center rounded-full border border-white/10 bg-white/[0.04] text-white/60 transition hover:border-white/20 hover:text-white"
            aria-label="Tutup daftar tugas"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        <div className="mt-4 h-1.5 overflow-hidden rounded-full bg-white/10">
          <div
            className="h-full rounded-full bg-gradient-to-r from-mint to-emerald-300 transition-[width] duration-500"
            style={{ width: `${percent}%` }}
          />
        </div>

        <div className="mt-3 flex flex-wrap gap-1.5">
          {FILTERS.map((item) => {
            const active = filter === item.id;
            return (
              <button
                key={item.id}
                type="button"
                onClick={() => setFilter(item.id)}
                aria-pressed={active}
                className={`inline-flex h-7 items-center gap-1.5 rounded-full border px-2.5 text-[10.5px] font-medium transition ${
                  active
                    ? "border-white/20 bg-white/[0.09] text-white"
                    : "border-white/8 bg-white/[0.02] text-white/50 hover:border-white/15 hover:text-white/80"
                }`}
              >
                {item.id === "comet" && (
                  <Zap className="h-3 w-3 text-orange-300" />
                )}
                {item.label}
                <span className="font-mono text-[9px] text-white/40">
                  {counts[item.id]}
                </span>
              </button>
            );
          })}
        </div>

        {constellations.length > 0 && (
          <div className="mt-2.5 flex flex-wrap items-center gap-1.5">
            <span className="font-mono text-[9px] uppercase tracking-[0.16em] text-muted">
              Konstelasi
            </span>
            {constellations.map((tag) => {
              const active = constellation === tag;
              const count = tasks.filter((task) => task.tags.includes(tag)).length;
              return (
                <button
                  key={tag}
                  type="button"
                  onClick={() => setConstellation(active ? null : tag)}
                  aria-pressed={active}
                  className={`inline-flex h-6 items-center gap-1 rounded-full border px-2 text-[10px] transition ${
                    active
                      ? "border-accent/40 bg-accent/10 text-accent"
                      : "border-white/8 bg-white/[0.02] text-white/55 hover:border-white/20 hover:text-white/85"
                  }`}
                >
                  #{tag}
                  <span className="font-mono text-[9px] opacity-60">{count}</span>
                </button>
              );
            })}
            {constellation && (
              <button
                type="button"
                onClick={() => setConstellation(null)}
                className="text-[10px] text-muted underline decoration-white/20 underline-offset-2 transition hover:text-white"
              >
                hapus filter
              </button>
            )}
          </div>
        )}

        <div className="mt-3 grid grid-cols-3 gap-1.5" aria-label="Lintasan fokus">
          {LANES.map((value) => {
            const laneMeta = LANE_META[value];
            const targeted = draggingId !== null;
            return (
              <div
                key={value}
                onDragOver={(event) => event.preventDefault()}
                onDrop={(event) => {
                  event.preventDefault();
                  const id =
                    event.dataTransfer.getData("text/orbitask-task") ||
                    draggingId;
                  if (id) setTaskLane(id, value);
                  setDraggingId(null);
                }}
                className={`flex h-9 items-center justify-center gap-1.5 rounded-xl border text-[10.5px] font-medium transition ${
                  targeted
                    ? "border-dashed opacity-100"
                    : "border-white/8 bg-white/[0.02] text-white/40"
                }`}
                style={{
                  borderColor: targeted ? `${laneMeta.color}88` : undefined,
                  color: targeted ? laneMeta.color : undefined,
                  background: targeted ? `${laneMeta.color}12` : undefined,
                }}
                title={`Jatuhkan tugas ke lintasan ${laneMeta.label}`}
              >
                <Orbit className="h-3 w-3" />
                {laneMeta.label}
              </div>
            );
          })}
        </div>

        <div className="panel-scroll mt-3 -mr-1 flex-1 overflow-y-auto pr-1">
          {visible.length === 0 ? (
            <div className="flex flex-col items-center gap-3 py-10 text-center">
              <div className="grid h-12 w-12 place-items-center rounded-2xl border border-white/10 bg-white/[0.04]">
                <Orbit className="h-6 w-6 text-muted" />
              </div>
              <div>
                <p className="text-sm font-medium text-white">
                  {total === 0
                    ? "Belum ada tugas di orbit"
                    : "Tidak ada tugas di filter ini"}
                </p>
                <p className="mt-1 text-[11.5px] text-muted">
                  {total === 0
                    ? "Tambahkan satu planet untuk memulai tata surya hari ini."
                    : "Coba filter lain, atau tambahkan tugas baru."}
                </p>
              </div>
              {total > 0 && (
                <button
                  type="button"
                  onClick={() => setFilter("all")}
                  className="rounded-full border border-white/10 px-3 py-1.5 text-[11px] text-white/70 transition hover:border-white/25 hover:text-white"
                >
                  Lihat semua
                </button>
              )}
            </div>
          ) : (
            <ul className="space-y-2">
              {visible.map((task) => {
                const meta = PRIORITY_META[task.priority];
                const lane = LANE_META[task.lane];
                const moon = taskMoonProgress(task);
                const comet = isComet(task);
                const overdue = isOverdue(task.dueDate) && !task.completed;
                return (
                  <li
                    key={task.id}
                    draggable
                    onDragStart={(event) => {
                      event.dataTransfer.setData("text/orbitask-task", task.id);
                      event.dataTransfer.effectAllowed = "move";
                      setDraggingId(task.id);
                    }}
                    onDragEnd={() => setDraggingId(null)}
                    className={`group flex cursor-grab items-center gap-3 rounded-2xl border px-3 py-2.5 transition active:cursor-grabbing ${
                      draggingId === task.id
                        ? "border-mint/50 bg-mint/[0.06] opacity-70"
                        : comet
                          ? "border-orange-400/25 bg-orange-400/[0.05] hover:bg-orange-400/[0.08]"
                          : "border-white/8 bg-white/[0.03] hover:border-white/15 hover:bg-white/[0.05]"
                    }`}
                  >
                    <button
                      type="button"
                      onClick={() => toggleComplete(task.id)}
                      aria-label={
                        task.completed
                          ? `Batalkan selesai: ${task.title}`
                          : `Tandai selesai: ${task.title}`
                      }
                      className={`grid h-6 w-6 shrink-0 place-items-center rounded-full border transition ${
                        task.completed
                          ? "border-mint/60 bg-mint text-[#04211b]"
                          : "border-white/25 bg-transparent text-transparent hover:border-mint/60"
                      }`}
                    >
                      <Check className="h-3.5 w-3.5" strokeWidth={3} />
                    </button>

                    <button
                      type="button"
                      onClick={() => selectTask(task.id)}
                      className="min-w-0 flex-1 text-left"
                    >
                      <span
                        className={`block truncate text-[13px] font-medium transition ${
                          task.completed
                            ? "text-white/40 line-through"
                            : "text-white/90 group-hover:text-white"
                        }`}
                      >
                        {task.title}
                      </span>
                      <span className="mt-1 flex flex-wrap items-center gap-x-1.5 gap-y-1 text-[10.5px] text-muted">
                        <span
                          className="h-1.5 w-1.5 rounded-full"
                          style={{ background: meta.color }}
                        />
                        {meta.label}
                        <span className="text-white/15">·</span>
                        <span
                          className={overdue ? "text-orange-300" : ""}
                        >
                          {dueLabel(task.dueDate)}
                        </span>
                        <span className="text-white/15">·</span>
                        <span style={{ color: lane.color }}>{lane.label}</span>
                        <span className="text-white/15">·</span>
                        <span>{formatMinutes(task.effortMinutes)}</span>
                        {moon.total > 0 && (
                          <>
                            <span className="text-white/15">·</span>
                            <span className="inline-flex items-center gap-1">
                              <Moon className="h-2.5 w-2.5" />
                              {moon.done}/{moon.total}
                            </span>
                          </>
                        )}
                        {comet && (
                          <span className="inline-flex items-center gap-1 rounded-full bg-orange-400/15 px-1.5 py-0.5 text-[9px] font-medium text-orange-200">
                            <Zap className="h-2.5 w-2.5" />
                            komet
                          </span>
                        )}
                      </span>
                    </button>

                    <ChevronRight className="h-4 w-4 shrink-0 text-white/20 transition group-hover:translate-x-0.5 group-hover:text-white/50" />
                  </li>
                );
              })}
            </ul>
          )}
        </div>

        <div className="mt-4 flex items-center justify-between gap-3 border-t border-white/8 pt-4">
          <span className="text-[10.5px] text-muted">
            Klik untuk detail · seret ke lintasan untuk mengorbit ulang.
          </span>
          <button
            type="button"
            onClick={openAdd}
            disabled={total >= MAX_TASKS}
            className="inline-flex h-9 items-center gap-1.5 rounded-full bg-white/[0.07] px-3.5 text-[11.5px] font-medium text-white transition hover:bg-white/[0.12] disabled:opacity-40"
          >
            <Plus className="h-3.5 w-3.5" />
            Tambah tugas
          </button>
        </div>
      </div>
    </div>
  );
}
