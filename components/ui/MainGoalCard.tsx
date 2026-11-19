"use client";

import { Flame, Pencil, Target, Zap } from "lucide-react";
import { formatMinutes, todayLabel } from "@/lib/format";
import { currentStreak, energySummary } from "@/lib/selectors";
import { useActiveSystem, useTaskStore } from "@/store/useTaskStore";

export default function MainGoalCard() {
  const system = useActiveSystem();
  const openGoal = useTaskStore((state) => state.openGoal);

  const tasks = system.tasks;
  const total = tasks.length;
  const completed = tasks.filter((task) => task.completed).length;
  const percent = total === 0 ? 0 : Math.round((completed / total) * 100);
  const energy = energySummary(tasks, system.energyMinutes);
  const activeStreak = currentStreak(system.streak);

  return (
    <button
      type="button"
      onClick={openGoal}
      className="glass group absolute left-4 top-[78px] z-20 w-[252px] rounded-2xl p-4 text-left transition duration-300 hover:-translate-y-0.5 hover:border-accent/40 sm:left-6 sm:top-24 sm:w-[296px]"
      aria-label={`Ubah main goal ${system.name}`}
    >
      <div className="flex items-center justify-between gap-2">
        <span className="flex items-center gap-1.5 text-[10px] font-semibold uppercase tracking-[0.24em] text-accent">
          <Target className="h-3.5 w-3.5" />
          Main goal
        </span>
        <Pencil className="h-3.5 w-3.5 text-muted opacity-0 transition group-hover:opacity-100" />
      </div>

      <p className="mt-1.5 truncate font-mono text-[9px] uppercase tracking-[0.16em] text-muted/80">
        {system.name}
      </p>

      <p className="mt-1 line-clamp-2 text-sm font-medium leading-snug text-white">
        {system.mainGoal}
      </p>

      <div className="mt-3 flex items-center gap-2.5">
        <div className="h-1 flex-1 overflow-hidden rounded-full bg-white/10">
          <div
            className="h-full rounded-full bg-gradient-to-r from-mint to-emerald-300 transition-[width] duration-500"
            style={{ width: `${percent}%` }}
          />
        </div>
        <span className="font-mono text-[10px] text-muted">{percent}%</span>
      </div>

      <p className="mt-2 text-[11px] text-muted">
        {todayLabel()} · {completed}/{total} tugas
      </p>

      <div className="mt-3 border-t border-white/8 pt-2.5">
        <div className="flex items-center justify-between gap-2">
          <span className="flex items-center gap-1 text-[10px] font-medium uppercase tracking-[0.12em] text-muted">
            <Zap className="h-3 w-3" style={{ color: energy.color }} />
            Energi hari ini
          </span>
          <span
            className="font-mono text-[10px]"
            style={{ color: energy.over ? energy.color : undefined }}
          >
            {formatMinutes(energy.used)} / {formatMinutes(energy.budget)}
          </span>
        </div>

        <div className="mt-1.5 h-1 overflow-hidden rounded-full bg-white/10">
          <div
            className="h-full rounded-full transition-[width] duration-500"
            style={{
              width: `${Math.min(100, Math.round(energy.ratio * 100))}%`,
              background: `linear-gradient(90deg, ${energy.color}bb, ${energy.color})`,
            }}
          />
        </div>

        <div className="mt-1 flex items-center justify-between gap-2">
          <span
            className="text-[9.5px]"
            style={{ color: energy.over ? energy.color : undefined }}
          >
            {energy.over
              ? `Lebih ${formatMinutes(energy.used - energy.budget)} — tetap boleh lanjut`
              : `Sisa ${formatMinutes(energy.remaining)} energi`}
          </span>
          <span className="flex items-center gap-1 text-[9.5px] text-muted">
            <Flame
              className={`h-3 w-3 ${
                activeStreak > 0 ? "text-orange-300" : "text-white/25"
              }`}
            />
            {activeStreak > 0 ? `${activeStreak} hari` : "streak"}
          </span>
        </div>
      </div>
    </button>
  );
}
