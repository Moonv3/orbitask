"use client";

import { Pause, Play, Square, Timer } from "lucide-react";
import { useTaskStore } from "@/store/useTaskStore";

const FOCUS_PRESETS = [15, 25, 50] as const;

function clock(seconds: number): string {
  const safe = Math.max(0, Math.round(seconds));
  const minutes = Math.floor(safe / 60);
  const rest = safe % 60;
  return `${String(minutes).padStart(2, "0")}:${String(rest).padStart(2, "0")}`;
}

export default function FocusHud() {
  const focus = useTaskStore((state) => state.focus);
  const systems = useTaskStore((state) => state.systems);
  const startFocus = useTaskStore((state) => state.startFocus);
  const pauseFocus = useTaskStore((state) => state.pauseFocus);
  const resumeFocus = useTaskStore((state) => state.resumeFocus);
  const stopFocus = useTaskStore((state) => state.stopFocus);

  const task = focus.taskId
    ? systems
        .flatMap((system) => system.tasks)
        .find((item) => item.id === focus.taskId)
    : null;

  if (!focus.taskId || !task) return null;

  const total = focus.minutes * 60;
  const progress = total === 0 ? 0 : 1 - focus.remaining / total;
  const circumference = 2 * Math.PI * 18;

  return (
    <section
      aria-label="Sesi fokus"
      className="pointer-events-auto fixed bottom-3 left-3 z-40 w-[calc(100%-1.5rem)] max-w-[330px] animate-rise-in rounded-3xl border border-white/12 bg-[#070c18]/90 p-3.5 shadow-[0_24px_60px_-24px_rgba(0,0,0,0.9)] backdrop-blur-xl sm:bottom-5 sm:left-5"
    >
      <div className="flex items-center gap-3">
        <div className="relative grid h-12 w-12 shrink-0 place-items-center">
          <svg className="absolute inset-0 h-12 w-12 -rotate-90" viewBox="0 0 44 44">
            <circle
              cx="22"
              cy="22"
              r="18"
              fill="none"
              stroke="rgba(255,255,255,0.1)"
              strokeWidth="3"
            />
            <circle
              cx="22"
              cy="22"
              r="18"
              fill="none"
              stroke="var(--color-mint)"
              strokeWidth="3"
              strokeLinecap="round"
              strokeDasharray={circumference}
              strokeDashoffset={circumference * (1 - Math.min(1, Math.max(0, progress)))}
              className="transition-[stroke-dashoffset] duration-700"
            />
          </svg>
          <Timer className="h-4 w-4 text-mint" />
        </div>

        <div className="min-w-0 flex-1">
          <p className="font-mono text-[9px] uppercase tracking-[0.2em] text-mint">
            {focus.running ? "Fokus berjalan" : "Fokus dijeda"}
          </p>
          <p className="mt-0.5 truncate text-[12.5px] font-medium text-white">
            {task.title}
          </p>
          <p
            aria-live="polite"
            className="mt-0.5 font-mono text-[19px] font-semibold tabular-nums tracking-tight text-white/90"
          >
            {clock(focus.remaining)}
          </p>
        </div>

        <div className="flex shrink-0 items-center gap-1">
          {focus.running ? (
            <button
              type="button"
              onClick={pauseFocus}
              className="grid h-9 w-9 place-items-center rounded-xl border border-white/10 bg-white/[0.05] text-white/75 transition hover:border-white/25 hover:text-white"
              aria-label="Jeda fokus"
              title="Jeda"
            >
              <Pause className="h-4 w-4" />
            </button>
          ) : (
            <button
              type="button"
              onClick={resumeFocus}
              disabled={focus.remaining <= 0}
              className="grid h-9 w-9 place-items-center rounded-xl border border-mint/30 bg-mint/10 text-mint transition hover:bg-mint/20 disabled:opacity-30"
              aria-label="Lanjutkan fokus"
              title="Lanjutkan"
            >
              <Play className="h-4 w-4" />
            </button>
          )}
          <button
            type="button"
            onClick={stopFocus}
            className="grid h-9 w-9 place-items-center rounded-xl border border-white/10 bg-white/[0.04] text-white/55 transition hover:border-rose-400/30 hover:text-rose-200"
            aria-label="Hentikan fokus dan catat durasinya"
            title="Hentikan"
          >
            <Square className="h-3.5 w-3.5" />
          </button>
        </div>
      </div>

      <div className="mt-3 flex items-center gap-1.5 border-t border-white/8 pt-2.5">
        <span className="mr-auto text-[10px] text-muted">Ubah durasi</span>
        {FOCUS_PRESETS.map((minutes) => (
          <button
            key={minutes}
            type="button"
            onClick={() => startFocus(task.id, minutes)}
            aria-pressed={focus.minutes === minutes}
            className={`rounded-lg border px-2 py-1 font-mono text-[10px] transition ${
              focus.minutes === minutes
                ? "border-accent/40 bg-accent/10 text-accent"
                : "border-white/8 bg-white/[0.02] text-white/50 hover:border-white/20 hover:text-white/80"
            }`}
          >
            {minutes}m
          </button>
        ))}
      </div>
    </section>
  );
}
