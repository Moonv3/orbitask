"use client";

import { useState, type FormEvent } from "react";
import { Sparkles, Target, X } from "lucide-react";
import { todayLabel } from "@/lib/format";
import { useActiveSystem, useTaskStore } from "@/store/useTaskStore";

export default function GoalDialog() {
  const closeGoal = useTaskStore((state) => state.closeGoal);
  const updateMainGoal = useTaskStore((state) => state.updateMainGoal);
  const system = useActiveSystem();
  const mainGoal = system.mainGoal;
  const tasks = system.tasks;

  const [draft, setDraft] = useState(mainGoal);

  const total = tasks.length;
  const completed = tasks.filter((task) => task.completed).length;
  const percent = total === 0 ? 0 : Math.round((completed / total) * 100);

  const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!draft.trim()) return;
    updateMainGoal(draft);
  };

  return (
    <div
      className="fixed inset-0 z-50 grid place-items-center bg-[#02040a]/70 p-4 backdrop-blur-md"
      onMouseDown={(event) => {
        if (event.target === event.currentTarget) closeGoal();
      }}
      role="presentation"
    >
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="goal-title"
        className="glass w-full max-w-md animate-rise-in rounded-3xl p-5 sm:p-6"
      >
        <div className="flex items-start justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="grid h-11 w-11 place-items-center rounded-2xl border border-accent/25 bg-accent/10">
              <Target className="h-5 w-5 text-accent" />
            </div>
            <div>
              <span className="block max-w-[240px] truncate font-mono text-[10px] uppercase tracking-[0.22em] text-accent">
                Matahari · {system.name}
              </span>
              <h2
                id="goal-title"
                className="text-lg font-semibold tracking-tight text-white"
              >
                Main goal hari ini
              </h2>
            </div>
          </div>
          <button
            type="button"
            onClick={closeGoal}
            className="grid h-8 w-8 shrink-0 place-items-center rounded-full border border-white/10 bg-white/[0.04] text-white/60 transition hover:border-white/20 hover:text-white"
            aria-label="Tutup dialog main goal"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        <p className="mt-4 text-[12px] leading-relaxed text-muted">
          Matahari adalah pusat gravitasi tata surya ini. Semua planetnya
          mengorbit satu fokus besar — pilih satu hal yang paling berarti.
        </p>

        <form onSubmit={handleSubmit} className="mt-4 space-y-4">
          <div>
            <label
              htmlFor="goal-input"
              className="mb-1.5 block text-[11px] font-medium uppercase tracking-[0.14em] text-muted"
            >
              Fokus utama
            </label>
            <input
              id="goal-input"
              value={draft}
              onChange={(event) => setDraft(event.target.value)}
              maxLength={90}
              autoFocus
              className="w-full rounded-xl border border-white/10 bg-white/[0.04] px-3.5 py-2.5 text-sm text-white outline-none transition focus:border-accent/50 focus:bg-white/[0.06]"
              placeholder="Apa satu hal terpenting hari ini?"
            />
          </div>

          <div className="rounded-2xl border border-white/8 bg-white/[0.03] p-3.5">
            <div className="flex items-center justify-between text-[11px] text-muted">
              <span>{todayLabel()}</span>
              <span className="font-mono">
                {completed}/{total} selesai
              </span>
            </div>
            <div className="mt-2 h-1.5 overflow-hidden rounded-full bg-white/10">
              <div
                className="h-full rounded-full bg-gradient-to-r from-mint to-emerald-300 transition-[width] duration-500"
                style={{ width: `${percent}%` }}
              />
            </div>
            <p className="mt-2.5 flex items-center gap-1.5 text-[10.5px] text-muted/80">
              <Sparkles className="h-3 w-3 text-mint" />
              Cincin di sekitar matahari menunjukkan progresmu.
            </p>
          </div>

          <div className="flex items-center justify-end gap-2">
            <button
              type="button"
              onClick={closeGoal}
              className="h-10 rounded-full border border-white/10 px-4 text-[12px] font-medium text-white/65 transition hover:border-white/25 hover:text-white"
            >
              Batal
            </button>
            <button
              type="submit"
              disabled={!draft.trim()}
              className="h-10 rounded-full bg-gradient-to-r from-[#ffc26b] to-[#ff9a4d] px-5 text-[12px] font-semibold text-[#231304] shadow-[0_12px_30px_-14px_rgba(255,179,92,0.8)] transition hover:brightness-105 disabled:opacity-40 disabled:shadow-none"
            >
              Simpan fokus
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
