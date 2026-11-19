"use client";

import { useState, type FormEvent } from "react";
import {
  CalendarDays,
  Moon,
  Plus,
  Tag,
  X,
  Zap,
} from "lucide-react";
import { daysUntil, formatMinutes } from "@/lib/format";
import { MAX_SUBTASKS } from "@/lib/migrate";
import { MAX_TASKS } from "@/lib/orbit";
import {
  EFFORT_PRESETS,
  LANES,
  LANE_META,
  PRIORITIES,
  PRIORITY_META,
  energyColor,
} from "@/lib/palette";
import { energySummary } from "@/lib/selectors";
import { useActiveSystem, useTaskStore } from "@/store/useTaskStore";
import type { Lane, Priority } from "@/lib/types";

const fieldClass =
  "w-full rounded-xl border border-white/10 bg-white/[0.04] px-3.5 py-2.5 text-sm text-white placeholder:text-muted/60 outline-none transition focus:border-mint/50 focus:bg-white/[0.06]";

const smallField =
  "h-9 w-full rounded-xl border border-white/10 bg-white/[0.04] px-3 text-[12px] text-white placeholder:text-muted/60 outline-none transition focus:border-mint/50";

const labelClass =
  "mb-1.5 block text-[11px] font-medium uppercase tracking-[0.14em] text-muted";

export default function AddTaskDialog() {
  const closeAdd = useTaskStore((state) => state.closeAdd);
  const addTask = useTaskStore((state) => state.addTask);
  const system = useActiveSystem();
  const tasks = system.tasks;
  const taskCount = tasks.length;

  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [priority, setPriority] = useState<Priority>("medium");
  const [dueDate, setDueDate] = useState("");
  const [lane, setLane] = useState<Lane>("today");
  const [effort, setEffort] = useState(30);
  const [tags, setTags] = useState("");
  const [subtasks, setSubtasks] = useState<string[]>([]);
  const [subtaskDraft, setSubtaskDraft] = useState("");
  const [error, setError] = useState("");

  const orbitFull = taskCount >= MAX_TASKS;
  const energy = energySummary(tasks, system.energyMinutes);
  const days = daysUntil(dueDate || undefined);
  const countsToday = days === null || days <= 0;
  const projected = energy.used + (countsToday ? effort : 0);
  const projectedRatio = projected / energy.budget;
  const over = projected > energy.budget;

  const addSubtaskDraft = () => {
    const value = subtaskDraft.trim();
    if (!value || subtasks.length >= MAX_SUBTASKS) return;
    setSubtasks((current) => [...current, value]);
    setSubtaskDraft("");
  };

  const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!title.trim()) {
      setError("Beri nama tugasnya dulu, ya.");
      return;
    }
    if (orbitFull) return;
    addTask({
      title,
      description,
      priority,
      dueDate: dueDate || undefined,
      lane,
      effortMinutes: effort,
      tags: tags.split(","),
      subtasks,
    });
  };

  return (
    <div
      className="fixed inset-0 z-50 grid place-items-center bg-[#02040a]/70 p-4 backdrop-blur-md"
      onMouseDown={(event) => {
        if (event.target === event.currentTarget) closeAdd();
      }}
      role="presentation"
    >
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="add-task-title"
        className="glass panel-scroll max-h-[90dvh] w-full max-w-lg animate-rise-in overflow-y-auto rounded-3xl p-5 sm:p-6"
      >
        <div className="flex items-start justify-between gap-4">
          <div>
            <span className="block max-w-[260px] truncate font-mono text-[10px] uppercase tracking-[0.24em] text-accent">
              Orbit baru · {system.name}
            </span>
            <h2
              id="add-task-title"
              className="mt-1.5 text-xl font-semibold tracking-tight text-white"
            >
              Tambahkan tugas
            </h2>
            <p className="mt-1 text-[12px] text-muted">
              Tugas baru menjadi planet; subtask menjadi bulan yang
              mengorbitnya.
            </p>
          </div>
          <button
            type="button"
            onClick={closeAdd}
            className="grid h-8 w-8 shrink-0 place-items-center rounded-full border border-white/10 bg-white/[0.04] text-white/60 transition hover:border-white/20 hover:text-white"
            aria-label="Tutup dialog tambah tugas"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="mt-5 space-y-4">
          <div>
            <label htmlFor="task-title" className={labelClass}>
              Judul tugas <span className="text-accent">*</span>
            </label>
            <input
              id="task-title"
              value={title}
              onChange={(event) => {
                setTitle(event.target.value);
                setError("");
              }}
              maxLength={90}
              autoFocus
              placeholder="Contoh: Kirim proposal ke klien"
              className={fieldClass}
              aria-invalid={Boolean(error)}
            />
            {error && (
              <p className="mt-1.5 text-[11px] text-rose-300">{error}</p>
            )}
          </div>

          <div>
            <label htmlFor="task-description" className={labelClass}>
              Deskripsi
            </label>
            <textarea
              id="task-description"
              value={description}
              onChange={(event) => setDescription(event.target.value)}
              rows={2}
              maxLength={280}
              placeholder="Apa hasil akhir yang kamu inginkan?"
              className={`${fieldClass} resize-none`}
            />
          </div>

          <div>
            <span className={labelClass}>Prioritas</span>
            <div className="grid grid-cols-3 gap-2">
              {PRIORITIES.map((value) => {
                const meta = PRIORITY_META[value];
                const active = priority === value;
                return (
                  <button
                    key={value}
                    type="button"
                    onClick={() => setPriority(value)}
                    aria-pressed={active}
                    className={`flex items-center justify-center gap-1.5 rounded-xl border px-2 py-2.5 text-[12px] font-medium transition ${
                      active
                        ? "border-white/25 bg-white/[0.08] text-white"
                        : "border-white/8 bg-white/[0.02] text-white/50 hover:border-white/20 hover:text-white/80"
                    }`}
                  >
                    <span
                      className="h-1.5 w-1.5 rounded-full"
                      style={{ background: meta.color }}
                    />
                    {meta.label}
                  </button>
                );
              })}
            </div>
          </div>

          <div>
            <span className={labelClass}>Lintasan fokus</span>
            <div className="grid grid-cols-3 gap-2">
              {LANES.map((value) => {
                const meta = LANE_META[value];
                const active = lane === value;
                return (
                  <button
                    key={value}
                    type="button"
                    onClick={() => setLane(value)}
                    aria-pressed={active}
                    title={meta.hint}
                    className={`rounded-xl border px-2 py-2 text-[11.5px] font-medium transition ${
                      active
                        ? "bg-white/[0.08] text-white"
                        : "border-white/8 bg-white/[0.02] text-white/50 hover:border-white/20 hover:text-white/80"
                    }`}
                    style={{
                      borderColor: active ? `${meta.color}66` : undefined,
                    }}
                  >
                    {meta.label}
                  </button>
                );
              })}
            </div>
          </div>

          <div>
            <span className={labelClass}>Perkiraan energi</span>
            <div className="flex flex-wrap gap-1.5">
              {EFFORT_PRESETS.map((minutes) => {
                const active = effort === minutes;
                return (
                  <button
                    key={minutes}
                    type="button"
                    onClick={() => setEffort(minutes)}
                    aria-pressed={active}
                    className={`rounded-lg border px-2.5 py-1.5 font-mono text-[11.5px] transition ${
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

          <div className="grid gap-3 sm:grid-cols-2">
            <div>
              <label htmlFor="task-due" className={labelClass}>
                Tenggat
              </label>
              <div className="relative">
                <CalendarDays className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted" />
                <input
                  id="task-due"
                  type="date"
                  value={dueDate}
                  onChange={(event) => setDueDate(event.target.value)}
                  className={`${smallField} pl-9 [color-scheme:dark]`}
                />
              </div>
            </div>

            <div>
              <label htmlFor="task-tags" className={labelClass}>
                Tag konstelasi
              </label>
              <div className="relative">
                <Tag className="pointer-events-none absolute left-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-muted" />
                <input
                  id="task-tags"
                  value={tags}
                  onChange={(event) => setTags(event.target.value)}
                  maxLength={80}
                  placeholder="kerja, rilis, belajar"
                  className={`${smallField} pl-9`}
                />
              </div>
            </div>
          </div>

          <div>
            <span className={labelClass}>
              Bulan / subtask · maks. {MAX_SUBTASKS}
            </span>
            {subtasks.length > 0 && (
              <div className="mb-2 flex flex-wrap gap-1.5">
                {subtasks.map((subtask, index) => (
                  <span
                    key={`${subtask}-${index}`}
                    className="inline-flex items-center gap-1 rounded-full border border-white/10 bg-white/[0.05] py-1 pl-2.5 pr-1.5 text-[11px] text-white/70"
                  >
                    <Moon className="h-3 w-3 text-accent" />
                    {subtask}
                    <button
                      type="button"
                      onClick={() =>
                        setSubtasks((current) =>
                          current.filter((_, itemIndex) => itemIndex !== index),
                        )
                      }
                      className="grid h-4 w-4 place-items-center rounded-full text-white/40 transition hover:bg-white/10 hover:text-white"
                      aria-label={`Hapus subtask ${subtask}`}
                    >
                      <X className="h-2.5 w-2.5" />
                    </button>
                  </span>
                ))}
              </div>
            )}
            <div className="flex items-center gap-1.5">
              <input
                value={subtaskDraft}
                onChange={(event) => setSubtaskDraft(event.target.value)}
                onKeyDown={(event) => {
                  if (event.key === "Enter") {
                    event.preventDefault();
                    addSubtaskDraft();
                  }
                }}
                maxLength={80}
                placeholder="Contoh: Cek tampilan mobile"
                className={`${smallField} flex-1`}
                aria-label="Judul subtask"
              />
              <button
                type="button"
                onClick={addSubtaskDraft}
                disabled={
                  !subtaskDraft.trim() || subtasks.length >= MAX_SUBTASKS
                }
                className="grid h-9 w-9 shrink-0 place-items-center rounded-xl border border-white/10 bg-white/[0.04] text-white/70 transition hover:border-mint/40 hover:text-mint disabled:opacity-30"
                aria-label="Tambahkan subtask"
              >
                <Plus className="h-4 w-4" />
              </button>
            </div>
          </div>

          <div
            className="flex items-start gap-2 rounded-2xl border p-3"
            style={{
              borderColor: over ? "rgba(251,113,133,0.25)" : "rgba(255,255,255,0.08)",
              background: over
                ? "rgba(251,113,133,0.06)"
                : "rgba(255,255,255,0.03)",
            }}
          >
            <Zap
              className="mt-0.5 h-3.5 w-3.5 shrink-0"
              style={{ color: over ? energyColor(projectedRatio) : "#ffb35c" }}
            />
            <p className="text-[11px] leading-relaxed text-muted">
              {orbitFull ? (
                `Orbit ${system.name} sudah penuh. Selesaikan atau hapus tugas lama untuk memberi ruang.`
              ) : over ? (
                <>
                  Tambahan ini membuat energi hari ini{" "}
                  <span className="font-medium text-rose-200">
                    {formatMinutes(projected)}
                  </span>{" "}
                  dari {formatMinutes(energy.budget)}. Tetap bisa disimpan —
                  corona matahari akan meredup sebagai pengingat lembut.
                </>
              ) : (
                <>
                  Energi hari ini {formatMinutes(energy.used)} dari{" "}
                  {formatMinutes(energy.budget)}. Setelah tugas ini sekitar{" "}
                  {formatMinutes(projected)}.
                  {countsToday
                    ? ""
                    : " Tenggat di masa depan, jadi belum dihitung hari ini."}
                </>
              )}
            </p>
          </div>

          <div className="flex items-center justify-end gap-2 pt-1">
            <button
              type="button"
              onClick={closeAdd}
              className="h-10 rounded-full border border-white/10 px-4 text-[12px] font-medium text-white/65 transition hover:border-white/25 hover:text-white"
            >
              Batal
            </button>
            <button
              type="submit"
              disabled={orbitFull}
              className="inline-flex h-10 items-center gap-2 rounded-full bg-gradient-to-r from-emerald-300 to-teal-300 px-5 text-[12px] font-semibold text-[#04211b] shadow-[0_14px_35px_-14px_rgba(94,234,212,0.8)] transition hover:brightness-105 disabled:opacity-40 disabled:shadow-none"
            >
              <Plus className="h-4 w-4" strokeWidth={2.5} />
              Masukkan orbit
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
