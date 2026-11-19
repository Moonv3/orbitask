"use client";

import { ListChecks, MonitorOff, RotateCcw } from "lucide-react";
import { useTaskStore } from "@/store/useTaskStore";

type WebGLFallbackProps = {
  reason?: string | null;
  onRetry?: () => void;
};

export default function WebGLFallback({
  reason,
  onRetry,
}: WebGLFallbackProps) {
  const openList = useTaskStore((state) => state.openList);

  return (
    <div className="absolute inset-0 z-10 grid place-items-center p-5">
      <div className="glass animate-rise-in w-full max-w-sm rounded-3xl p-6 text-center">
        <div className="mx-auto grid h-12 w-12 place-items-center rounded-2xl border border-white/10 bg-white/[0.04]">
          <MonitorOff className="h-5 w-5 text-accent" strokeWidth={1.7} />
        </div>
        <h2 className="mt-4 text-[15px] font-semibold text-white">
          Tampilan 3D tidak tersedia
        </h2>
        <p className="mt-2 text-[11.5px] leading-relaxed text-muted">
          Perangkat atau browser ini tidak bisa merender tata surya. Tugas dan
          data kamu tetap aman — semua fitur masih bisa dipakai lewat daftar.
        </p>
        {reason && (
          <p className="mt-2 text-[10px] text-muted/70">Alasan: {reason}</p>
        )}
        <div className="mt-5 flex flex-col gap-2 sm:flex-row">
          <button
            type="button"
            onClick={openList}
            className="flex h-10 flex-1 items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-emerald-300 to-teal-300 text-[12px] font-semibold text-[#04211b] transition hover:brightness-105"
          >
            <ListChecks className="h-4 w-4" />
            Buka daftar tugas
          </button>
          {onRetry && (
            <button
              type="button"
              onClick={onRetry}
              className="flex h-10 items-center justify-center gap-2 rounded-xl border border-white/12 px-4 text-[12px] text-white/75 transition hover:border-white/25 hover:text-white"
            >
              <RotateCcw className="h-4 w-4" />
              Coba lagi
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
