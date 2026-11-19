"use client";

import { Hand, MousePointer2, ZoomIn } from "lucide-react";
import { PRIORITIES, PRIORITY_META } from "@/lib/palette";
import { useTaskStore } from "@/store/useTaskStore";

export default function SceneFooter() {
  const selectedId = useTaskStore((state) => state.selectedId);

  return (
    <div className="pointer-events-none absolute inset-x-0 bottom-0 z-20 flex items-end justify-between gap-4 p-4 sm:p-6">
      <div className="glass-soft hidden items-center gap-4 rounded-full px-4 py-2.5 text-[11px] text-white/55 md:flex">
        <span className="inline-flex items-center gap-1.5">
          <MousePointer2 className="h-3.5 w-3.5" />
          Klik planet
        </span>
        <span className="h-1 w-1 rounded-full bg-white/25" />
        <span className="inline-flex items-center gap-1.5">
          <Hand className="h-3.5 w-3.5" />
          Seret untuk memutar
        </span>
        <span className="h-1 w-1 rounded-full bg-white/25" />
        <span className="inline-flex items-center gap-1.5">
          <ZoomIn className="h-3.5 w-3.5" />
          Scroll untuk zoom
        </span>
      </div>

      {!selectedId && (
        <div className="glass-soft inline-flex items-center gap-1.5 rounded-full px-3.5 py-2 text-[11px] text-white/60 md:hidden">
          <MousePointer2 className="h-3.5 w-3.5" />
          Ketuk planet untuk detail
        </div>
      )}

      <div className="glass-soft ml-auto hidden items-center gap-3 rounded-full px-4 py-2.5 lg:flex">
        {PRIORITIES.map((priority) => (
          <span
            key={priority}
            className="inline-flex items-center gap-1.5 text-[10px] uppercase tracking-[0.12em] text-white/45"
          >
            <span
              className="h-1.5 w-1.5 rounded-full"
              style={{ background: PRIORITY_META[priority].color }}
            />
            {PRIORITY_META[priority].label}
          </span>
        ))}
      </div>
    </div>
  );
}
