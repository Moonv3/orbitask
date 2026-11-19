"use client";

import { Layers, Moon, Orbit, Sparkles, Zap } from "lucide-react";
import { useTaskStore } from "@/store/useTaskStore";

const FEATURES = [
  {
    icon: Layers,
    title: "Banyak tata surya",
    text: "Pisahkan pekerjaan, kuliah, dan sisi pribadi. Setiap tata surya punya matahari, energi, dan streak sendiri.",
  },
  {
    icon: Moon,
    title: "Bulan adalah subtask",
    text: "Pecah planet menjadi langkah kecil. Bulan yang selesai ikut menyala bersama planetnya.",
  },
  {
    icon: Zap,
    title: "Tenggat punya gravitasi",
    text: "Makin dekat tenggat, makin dekat orbitnya. Lewat tenggat, planet menjadi komet — tidak pernah dihapus.",
  },
  {
    icon: Sparkles,
    title: "Energi itu saran",
    text: "Anggaran harian hanya mengingatkan lewat corona matahari. Kamu tetap bebas menambah tugas.",
  },
  {
    icon: Orbit,
    title: "Peta galaksi",
    text: "Semua tata surya terlihat dalam satu peta. Klik bintangnya untuk masuk, atau pulihkan yang sudah diarsipkan.",
  },
  {
    icon: Moon,
    title: "Timer fokus",
    text: "Pilih 15, 25, atau 50 menit. HUD fokus menemani tanpa mengganggu orbit yang sedang berjalan.",
  },
  {
    icon: Sparkles,
    title: "Palet perintah",
    text: "Tekan Ctrl+K (atau ⌘K) untuk mencari tugas, memulai fokus, dan berpindah tata surya secepatnya.",
  },
  {
    icon: Layers,
    title: "Konstelasi dari tag",
    text: "Beri tag yang sama pada beberapa planet, lalu saring mereka sebagai satu konstelasi di daftar tugas.",
  },
];

export default function IntroDialog() {
  const hasSeenIntro = useTaskStore((state) => state.settings.hasSeenIntro);
  const dismissIntro = useTaskStore((state) => state.dismissIntro);

  if (hasSeenIntro) return null;

  return (
    <div className="intro-stage fixed inset-0 z-50 grid place-items-center bg-[#02040a]/75 p-4 backdrop-blur-md">
      <div aria-hidden className="intro-stars" />
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="intro-title"
        className="glass intro-panel flex max-h-[90dvh] w-full max-w-md animate-rise-in flex-col overflow-hidden rounded-3xl"
      >
        <div className="panel-scroll min-h-0 flex-1 overflow-y-auto overscroll-contain p-5 sm:p-6">
        <div className="flex items-center gap-3">
          <div className="intro-emblem relative grid h-11 w-11 place-items-center rounded-2xl border border-white/10 bg-white/[0.05]">
            <Orbit className="h-5 w-5 text-accent" strokeWidth={1.7} />
            <span className="absolute -right-0.5 -top-0.5 h-2 w-2 rounded-full bg-mint shadow-[0_0_12px_#5eead4]" />
          </div>
          <div>
            <span className="font-mono text-[10px] uppercase tracking-[0.24em] text-mint">
              Orbitask v3
            </span>
            <h2
              id="intro-title"
              className="text-lg font-semibold tracking-tight text-white"
            >
              Tata surya yang lebih hidup
            </h2>
          </div>
        </div>

        <p className="mt-3 text-[12px] leading-relaxed text-muted">
          Data lamamu otomatis menjadi tata surya pertama. Tidak ada tugas yang
          hilang — hanya orbit yang menjadi lebih luas.
        </p>

        <ul className="mt-4 space-y-2.5">
          {FEATURES.map((feature, index) => {
            const Icon = feature.icon;
            return (
              <li
                key={feature.title}
                className="animate-intro-card flex gap-3 rounded-2xl border border-white/8 bg-white/[0.025] p-3"
                style={{ animationDelay: `${180 + index * 70}ms` }}
              >
                <div className="grid h-8 w-8 shrink-0 place-items-center rounded-xl border border-white/10 bg-white/[0.04]">
                  <Icon className="h-4 w-4 text-accent" />
                </div>
                <div>
                  <p className="text-[12px] font-medium text-white/90">
                    {feature.title}
                  </p>
                  <p className="mt-0.5 text-[11px] leading-relaxed text-muted">
                    {feature.text}
                  </p>
                </div>
              </li>
            );
          })}
        </ul>
        </div>

        <div className="shrink-0 border-t border-white/10 bg-[#070c18]/95 px-5 pb-5 pt-4 backdrop-blur-sm sm:px-6 sm:pb-6">
          <button
            type="button"
            onClick={dismissIntro}
            className="intro-launch flex h-11 w-full items-center justify-center gap-2 rounded-2xl bg-gradient-to-r from-emerald-300 to-teal-300 text-[12.5px] font-semibold text-[#04211b] shadow-[0_14px_35px_-14px_rgba(94,234,212,0.8)] transition hover:brightness-105"
          >
            <Sparkles className="h-4 w-4" />
            Mulai menjelajah
          </button>

          <p className="mt-3 text-center text-[10px] text-muted/70">
            Panduan ini bisa dibuka lagi dari Pengaturan.
          </p>
        </div>
      </div>
    </div>
  );
}
