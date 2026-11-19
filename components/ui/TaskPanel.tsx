"use client";

import { useState, type FormEvent } from "react";
import {
  CalendarDays,
  Check,
  Flag,
  Moon,
  Orbit,
  Plus,
  RotateCcw,
  Sparkles,
  Timer,
  Trash2,
  X,
  Zap,
} from "lucide-react";
import {
  dateFromToday,
  daysUntil,
  dueLabel,
  formatDate,
  formatMinutes,
  isOverdue,
} from "@/lib/format";
import { MAX_SUBTASKS } from "@/lib/migrate";
import { BASE_RADIUS, ORBIT_GAP } from "@/lib/orbit";
import {
  EFFORT_PRESETS,
  LANES,
  LANE_META,
  PRIORITY_META,
} from "@/lib/palette";
import { isComet, taskMoonProgress } from "@/lib/selectors";
import { useTaskStore } from "@/store/useTaskStore";
import type { Task } from "@/lib/types";

type TaskPanelProps = {
  task: Task;
};

const chipClass =
  "inline-flex h-8 items-center justify-center gap-1 rounded-lg border border-white/10 bg-white/[0.04] px-2.5 text-[11px] font-medium text-white/65 transition hover:border-white/25 hover:text-white";

export default function TaskPanel({ task }: TaskPanelProps) {
  const toggleComplete = useTaskStore((state) => state.toggleComplete);
  const deleteTask = useTaskStore((state) => state.deleteTask);
  const selectTask = useTaskStore((state) => state.selectTask);
  const rescheduleTask = useTaskStore((state) => state.rescheduleTask);
  const setTaskEffort = useTaskStore((state) => state.setTaskEffort);
  const setTaskLane = useTaskStore((state) => state.setTaskLane);
  const addSubtask = useTaskStore((state) => state.addSubtask);
  const toggleSubtask = useTaskStore((state) => state.toggleSubtask);
  const deleteSubtask = useTaskStore((state) => state.deleteSubtask);
  const startFocus = useTaskStore((state) => state.startFocus);
  const focusState = useTaskStore((state) => state.focus);

  const [confirming, setConfirming] = useState(false);
  const [subtaskDraft, setSubtaskDraft] = useState("");

  const meta = PRIORITY_META[task.priority];
  const lane = LANE_META[task.lane];
  const moon = taskMoonProgress(task);
  const comet = isComet(task);
  const overdue = isOverdue(task.dueDate) && !task.completed;
  const days = daysUntil(task.dueDate);
  const orbitNumber =
    Math.round((task.orbit.radius - BASE_RADIUS) / ORBIT_GAP) + 1;
  const pendingMoons = task.subtasks.filter(
    (subtask) => !subtask.completed,
  ).length;

  const handleSubtask = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!subtaskDraft.trim()) return;
    addSubtask(task.id, subtaskDraft);
    setSubtaskDraft("");
  };

  const handleComplete = () => {
    toggleComplete(task.id);
  };

  return (
    <aside
      aria-label="Detail tugas"
      className="pointer-events-none fixed inset-x-3 bottom-3 z-40 sm:inset-x-auto sm:right-6 sm:top-24 sm:bottom-5 sm:w-[380px]"
    >
      <div className="glass panel-scroll pointer-events-auto flex max-h-[72dvh] animate-panel-in flex-col overflow-y-auto rounded-3xl p-5 sm:max-h-full sm:p-6">
        <div className="flex items-center justify-between gap-3">
          <span className="font-mono text-[10px] uppercase tracking-[0.24em] text-muted">
            Detail tugas · Orbit {orbitNumber}
          </span>
          <button
            type="button"
            onClick={() => selectTask(null)}
            className="grid h-8 w-8 place-items-center rounded-full border border-white/10 bg-white/[0.04] text-white/60 transition hover:border-white/20 hover:text-white"
            aria-label="Tutup detail tugas"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        <div className="mt-4 flex flex-wrap items-center gap-2">
          <span
            className="inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-[10px] font-medium"
            style={{
              borderColor: `${meta.color}44`,
              background: meta.soft,
              color: meta.color,
            }}
          >
            <span
              className="h-1.5 w-1.5 rounded-full"
              style={{ background: meta.color }}
            />
            Prioritas {meta.label.toLowerCase()}
          </span>
          <span
            className={`inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-[10px] font-medium ${
              task.completed
                ? "border-mint/25 bg-mint/10 text-mint"
                : "border-white/10 bg-white/[0.04] text-white/65"
            }`}
          >
            <span
              className={`h-1.5 w-1.5 rounded-full ${
                task.completed ? "bg-mint" : "animate-soft-pulse bg-accent"
              }`}
            />
            {task.completed ? "Selesai" : "Sedang berjalan"}
          </span>
          <span
            className="inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-[10px] font-medium"
            style={{
              borderColor: `${lane.color}40`,
              color: lane.color,
            }}
          >
            <Orbit className="h-3 w-3" />
            {lane.label}
          </span>
          {comet && (
            <span className="inline-flex items-center gap-1.5 rounded-full border border-orange-400/30 bg-orange-400/10 px-2.5 py-1 text-[10px] font-medium text-orange-200">
              <Zap className="h-3 w-3" />
              Komet
            </span>
          )}
        </div>

        <h2 className="mt-3 text-[22px] font-semibold leading-tight tracking-tight text-white">
          {task.title}
        </h2>

        <p className="mt-2 text-[13px] leading-relaxed text-white/60">
          {task.description ||
            "Belum ada deskripsi. Fokuskan energimu pada judulnya saja."}
        </p>

        <div className="mt-5 grid grid-cols-2 gap-2">
          <div className="rounded-2xl border border-white/8 bg-white/[0.03] p-3">
            <div className="flex items-center gap-1.5 text-[10px] uppercase tracking-[0.14em] text-muted">
              <Flag className="h-3 w-3" />
              Prioritas
            </div>
            <div
              className="mt-1.5 text-[13px] font-medium"
              style={{ color: meta.color }}
            >
              {meta.label}
            </div>
          </div>

          <div className="rounded-2xl border border-white/8 bg-white/[0.03] p-3">
            <div className="flex items-center gap-1.5 text-[10px] uppercase tracking-[0.14em] text-muted">
              <CalendarDays className="h-3 w-3" />
              Tenggat
            </div>
            <div
              className={`mt-1.5 text-[13px] font-medium ${
                overdue ? "text-orange-300" : "text-white/80"
              }`}
            >
              {dueLabel(task.dueDate)}
            </div>
            <div className="mt-0.5 text-[10px] text-muted">
              {formatDate(task.dueDate)}
            </div>
          </div>

          <div className="rounded-2xl border border-white/8 bg-white/[0.03] p-3">
            <div className="flex items-center gap-1.5 text-[10px] uppercase tracking-[0.14em] text-muted">
              <Zap className="h-3 w-3" />
              Energi
            </div>
            <div className="mt-1.5 text-[13px] font-medium text-white/80">
              {formatMinutes(task.effortMinutes)}
            </div>
            <div className="mt-0.5 text-[10px] text-muted">
              perkiraan fokus
            </div>
          </div>

          <div className="rounded-2xl border border-white/8 bg-white/[0.03] p-3">
            <div className="flex items-center gap-1.5 text-[10px] uppercase tracking-[0.14em] text-muted">
              <Moon className="h-3 w-3" />
              Bulan
            </div>
            <div className="mt-1.5 text-[13px] font-medium text-white/80">
              {moon.total === 0 ? "Belum ada" : `${moon.done}/${moon.total}`}
            </div>
            <div className="mt-0.5 text-[10px] text-muted">
              {moon.total === 0 ? "subtask" : "subtask selesai"}
            </div>
          </div>
        </div>

        {comet && (
          <div className="mt-4 rounded-2xl border border-orange-400/25 bg-orange-400/[0.07] p-3">
            <div className="flex items-center gap-1.5 text-[11px] font-semibold text-orange-200">
              <Zap className="h-3.5 w-3.5" />
              Komet perlu diselamatkan
            </div>
            <p className="mt-1 text-[11.5px] leading-relaxed text-orange-100/70">
              Tenggat sudah lewat {Math.abs(days ?? 0)} hari. Planet tidak
              dihapus — beri jadwal baru dan ia akan kembali ke orbit yang
              tenang.
            </p>
            <div className="mt-2.5 flex flex-wrap gap-1.5">
              <button
                type="button"
                onClick={() => rescheduleTask(task.id, dateFromToday(1))}
                className={chipClass}
              >
                Besok
              </button>
              <button
                type="button"
                onClick={() => rescheduleTask(task.id, dateFromToday(3))}
                className={chipClass}
              >
                +3 hari
              </button>
              <button
                type="button"
                onClick={() => rescheduleTask(task.id, dateFromToday(7))}
                className={chipClass}
              >
                Minggu depan
              </button>
            </div>
          </div>
        )}

        <div className="mt-4">
          <span className="mb-1.5 block text-[10px] font-medium uppercase tracking-[0.16em] text-muted">
            Lintasan fokus
          </span>
          <div className="grid grid-cols-3 gap-1.5">
            {LANES.map((value) => {
              const laneMeta = LANE_META[value];
              const active = task.lane === value;
              return (
                <button
                  key={value}
                  type="button"
                  onClick={() => setTaskLane(task.id, value)}
                  aria-pressed={active}
                  className={`rounded-xl border px-1.5 py-2 text-[11px] font-medium transition ${
                    active
                      ? "bg-white/[0.08] text-white"
                      : "border-white/8 bg-white/[0.02] text-white/50 hover:border-white/20 hover:text-white/80"
                  }`}
                  style={{
                    borderColor: active ? `${laneMeta.color}66` : undefined,
                  }}
                  title={laneMeta.hint}
                >
                  {laneMeta.label}
                </button>
              );
            })}
          </div>
        </div>

        <div className="mt-4">
          <span className="mb-1.5 block text-[10px] font-medium uppercase tracking-[0.16em] text-muted">
            Perkiraan energi
          </span>
          <div className="flex flex-wrap gap-1.5">
            {EFFORT_PRESETS.map((minutes) => {
              const active = task.effortMinutes === minutes;
              return (
                <button
                  key={minutes}
                  type="button"
                  onClick={() => setTaskEffort(task.id, minutes)}
                  aria-pressed={active}
                  className={`rounded-lg border px-2.5 py-1.5 font-mono text-[11px] transition ${
                    active
                      ? "border-mint/50 bg-mint/10 text-mint"
                      : "border-white/8 bg-white/[0.02] text-white/50 hover:border-white/20 hover:text-white/80"
                  }`}
                >
                  {formatMinutes(minutes)}
                </button>
              );
            })}
          </div>
        </div>

        <div className="mt-4">
          <label
            htmlFor="task-reschedule"
            className="mb-1.5 block text-[10px] font-medium uppercase tracking-[0.16em] text-muted"
          >
            Jadwalkan ulang
          </label>
          <div className="relative">
            <CalendarDays className="pointer-events-none absolute left-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-muted" />
            <input
              id="task-reschedule"
              type="date"
              value={task.dueDate ?? ""}
              onChange={(event) =>
                rescheduleTask(task.id, event.target.value || undefined)
              }
              className="h-9 w-full rounded-xl border border-white/10 bg-white/[0.04] pl-9 pr-3 text-[12px] text-white outline-none transition [color-scheme:dark] focus:border-mint/50"
            />
          </div>
        </div>

        {task.tags.length > 0 && (
          <div className="mt-3 flex flex-wrap gap-1.5">
            {task.tags.map((tag) => (
              <span
                key={tag}
                className="rounded-full border border-white/10 bg-white/[0.04] px-2 py-0.5 text-[10px] text-white/55"
              >
                #{tag}
              </span>
            ))}
          </div>
        )}

        <div className="mt-4 rounded-2xl border border-white/8 bg-white/[0.025] p-3">
          <div className="flex items-center justify-between gap-2">
            <span className="flex items-center gap-1.5 text-[11px] font-semibold text-white/80">
              <Moon className="h-3.5 w-3.5 text-accent" />
              Bulan pengorbit
            </span>
            <span className="font-mono text-[10px] text-muted">
              {moon.total === 0 ? "0" : `${moon.done}/${moon.total}`} · maks{" "}
              {MAX_SUBTASKS}
            </span>
          </div>

          {moon.total > 0 && (
            <div className="mt-2 h-1 overflow-hidden rounded-full bg-white/10">
              <div
                className="h-full rounded-full bg-gradient-to-r from-mint to-emerald-300 transition-[width] duration-500"
                style={{ width: `${Math.round(moon.ratio * 100)}%` }}
              />
            </div>
          )}

          <ul className="mt-2 space-y-1">
            {task.subtasks.map((subtask) => (
              <li
                key={subtask.id}
                className="group flex items-center gap-2 rounded-lg px-0.5 py-1"
              >
                <button
                  type="button"
                  onClick={() => toggleSubtask(task.id, subtask.id)}
                  aria-label={
                    subtask.completed
                      ? `Batalkan: ${subtask.title}`
                      : `Selesaikan: ${subtask.title}`
                  }
                  className={`grid h-4 w-4 shrink-0 place-items-center rounded-full border transition ${
                    subtask.completed
                      ? "border-mint/60 bg-mint text-[#04211b]"
                      : "border-white/25 text-transparent hover:border-mint/60"
                  }`}
                >
                  <Check className="h-2.5 w-2.5" strokeWidth={3.5} />
                </button>
                <span
                  className={`min-w-0 flex-1 truncate text-[11.5px] ${
                    subtask.completed
                      ? "text-white/35 line-through"
                      : "text-white/75"
                  }`}
                >
                  {subtask.title}
                </span>
                <button
                  type="button"
                  onClick={() => deleteSubtask(task.id, subtask.id)}
                  className="text-white/20 opacity-0 transition hover:text-rose-300 group-hover:opacity-100"
                  aria-label={`Hapus bulan: ${subtask.title}`}
                >
                  <X className="h-3 w-3" />
                </button>
              </li>
            ))}
          </ul>

          <form onSubmit={handleSubtask} className="mt-2 flex items-center gap-1.5">
            <input
              value={subtaskDraft}
              onChange={(event) => setSubtaskDraft(event.target.value)}
              maxLength={80}
              placeholder="Tambah subtask kecil…"
              className="h-8 min-w-0 flex-1 rounded-lg border border-white/10 bg-white/[0.04] px-2.5 text-[11.5px] text-white placeholder:text-muted/60 outline-none transition focus:border-mint/50"
              aria-label="Judul subtask baru"
            />
            <button
              type="submit"
              disabled={
                task.subtasks.length >= MAX_SUBTASKS || !subtaskDraft.trim()
              }
              className="grid h-8 w-8 shrink-0 place-items-center rounded-lg border border-white/10 bg-white/[0.04] text-white/70 transition hover:border-mint/40 hover:text-mint disabled:opacity-30"
              aria-label="Tambah subtask"
            >
              <Plus className="h-3.5 w-3.5" />
            </button>
          </form>
        </div>

        {!task.completed && pendingMoons > 0 && (
          <div className="mt-3 flex gap-2.5 rounded-2xl border border-amber-400/20 bg-amber-400/[0.06] p-3">
            <Moon className="mt-0.5 h-3.5 w-3.5 shrink-0 text-amber-300" />
            <p className="text-[11px] leading-relaxed text-amber-100/80">
              Masih ada {pendingMoons} bulan yang belum selesai. Kamu tetap
              bisa menuntaskan planetnya — bulan akan ikut menyala.
            </p>
          </div>
        )}

        <div className="mt-3 rounded-2xl border border-white/8 bg-white/[0.03] p-3">
          <div className="flex items-center justify-between gap-2">
            <span className="flex items-center gap-1.5 text-[11px] font-semibold text-white/80">
              <Timer className="h-3.5 w-3.5 text-accent" />
              Sesi fokus
            </span>
            <span className="font-mono text-[10px] text-muted">
              {task.focusSessions} sesi
              {task.focusMinutes > 0
                ? ` · ${formatMinutes(task.focusMinutes)}`
                : ""}
            </span>
          </div>
          <div className="mt-2 flex flex-wrap gap-1.5">
            {[15, 25, 50].map((minutes) => (
              <button
                key={minutes}
                type="button"
                onClick={() => startFocus(task.id, minutes)}
                className={chipClass}
                aria-label={`Mulai fokus ${minutes} menit untuk ${task.title}`}
              >
                <Timer className="h-3 w-3 text-accent" />
                {minutes} menit
              </button>
            ))}
          </div>
          {focusState.taskId === task.id && (
            <p className="mt-2 flex items-center gap-1.5 text-[10.5px] text-mint">
              <span className="h-1.5 w-1.5 animate-soft-pulse rounded-full bg-mint" />
              Sesi berjalan — pantau di HUD fokus.
            </p>
          )}
        </div>

        <div className="mt-5 space-y-2">
          <button
            type="button"
            onClick={handleComplete}
            className={`flex h-11 w-full items-center justify-center gap-2 rounded-2xl text-[13px] font-semibold transition ${
              task.completed
                ? "border border-mint/25 bg-mint/[0.06] text-mint hover:bg-mint/10"
                : "bg-gradient-to-r from-emerald-300 to-teal-300 text-[#04211b] shadow-[0_14px_35px_-14px_rgba(94,234,212,0.8)] hover:brightness-105"
            }`}
          >
            {task.completed ? (
              <>
                <RotateCcw className="h-4 w-4" />
                Batalkan selesai
              </>
            ) : (
              <>
                <Sparkles className="h-4 w-4" />
                Tandai selesai
              </>
            )}
          </button>

          {confirming ? (
            <div className="flex items-center justify-between gap-2 rounded-2xl border border-rose-400/20 bg-rose-400/[0.06] px-3 py-2">
              <span className="text-[11px] text-rose-200">
                Hapus tugas ini?
              </span>
              <div className="flex items-center gap-1.5">
                <button
                  type="button"
                  onClick={() => deleteTask(task.id)}
                  className="rounded-lg bg-rose-500/90 px-2.5 py-1.5 text-[11px] font-semibold text-white transition hover:bg-rose-500"
                >
                  Ya, hapus
                </button>
                <button
                  type="button"
                  onClick={() => setConfirming(false)}
                  className="rounded-lg border border-white/10 px-2.5 py-1.5 text-[11px] text-white/70 transition hover:border-white/25"
                >
                  Batal
                </button>
              </div>
            </div>
          ) : (
            <button
              type="button"
              onClick={() => setConfirming(true)}
              className="flex h-10 w-full items-center justify-center gap-2 rounded-2xl border border-white/8 bg-white/[0.02] text-[12px] font-medium text-white/45 transition hover:border-rose-400/25 hover:bg-rose-400/[0.06] hover:text-rose-200"
            >
              <Trash2 className="h-3.5 w-3.5" />
              Hapus tugas
            </button>
          )}
        </div>

        <p className="mt-4 text-center text-[10px] text-muted/70">
          Perubahan tersimpan otomatis di perangkat ini.
        </p>
      </div>
    </aside>
  );
}
