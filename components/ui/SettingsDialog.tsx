"use client";

import { useState, type ChangeEvent } from "react";
import {
  Download,
  Flame,
  Orbit,
  Sparkles,
  Upload,
  Volume2,
  VolumeX,
  X,
  Zap,
} from "lucide-react";
import { parseBackup, createBackup } from "@/lib/backup";
import { detectDevice } from "@/lib/device";
import { formatMinutes, todayKey } from "@/lib/format";
import { currentStreak } from "@/lib/selectors";
import { playCompletionChime } from "@/lib/sound";
import { useActiveSystem, useTaskStore } from "@/store/useTaskStore";
import type { Backup, Quality, System } from "@/lib/types";

const sectionTitle =
  "text-[10px] font-semibold uppercase tracking-[0.18em] text-muted";

type QualityChoice = "auto" | Quality;

const QUALITY_OPTIONS: {
  value: QualityChoice;
  label: string;
  hint: string;
}[] = [
  {
    value: "auto",
    label: "Otomatis",
    hint: "Ikut kemampuan perangkat",
  },
  {
    value: "high",
    label: "Sinematik",
    hint: "Efek penuh, lebih berat",
  },
  {
    value: "light",
    label: "Ringan",
    hint: "Hemat baterai",
  },
];

const totalTasks = (systems: System[]) =>
  systems.reduce((total, system) => total + system.tasks.length, 0);

export default function SettingsDialog() {
  const isOpen = useTaskStore((state) => state.isSettingsOpen);
  const closeSettings = useTaskStore((state) => state.closeSettings);
  const settings = useTaskStore((state) => state.settings);
  const updateSettings = useTaskStore((state) => state.updateSettings);
  const [device] = useState(() => detectDevice());
  const reopenIntro = useTaskStore((state) => state.reopenIntro);
  const resetStreak = useTaskStore((state) => state.resetStreak);
  const restoreData = useTaskStore((state) => state.restoreData);
  const setSystemEnergy = useTaskStore((state) => state.setSystemEnergy);
  const openSystem = useTaskStore((state) => state.openSystem);
  const system = useActiveSystem();

  const [status, setStatus] = useState("");
  const [pending, setPending] = useState<Backup | null>(null);

  if (!isOpen) return null;

  const activeStreak = currentStreak(system.streak);
  const pendingTasks = pending ? totalTasks(pending.systems) : 0;
  const pendingMainGoal = pending?.systems[0]?.mainGoal ?? "";

  const handleExport = () => {
    const snapshot = useTaskStore.getState();
    const backup = createBackup({
      systems: snapshot.systems,
      activeSystemId: snapshot.activeSystemId,
      settings: snapshot.settings,
    });

    const blob = new Blob([JSON.stringify(backup, null, 2)], {
      type: "application/json",
    });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `orbitask-backup-${todayKey()}.json`;
    link.click();
    URL.revokeObjectURL(url);
    setStatus(
      `Backup ${backup.systems.length} tata surya (${totalTasks(
        backup.systems,
      )} tugas) berhasil diunduh.`,
    );
  };

  const handleFile = async (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    event.target.value = "";
    if (!file) return;

    const backup = parseBackup(await file.text());
    if (!backup) {
      setPending(null);
      setStatus("File tidak dikenali. Pilih backup JSON dari Orbitask.");
      return;
    }

    setPending(backup);
    setStatus("");
  };

  const applyRestore = () => {
    if (!pending) return;
    restoreData({
      systems: pending.systems,
      activeSystemId: pending.activeSystemId,
      settings: pending.settings,
    });
    setPending(null);
    setStatus(
      `${totalTasks(pending.systems)} tugas dalam ${
        pending.systems.length
      } tata surya berhasil dipulihkan.`,
    );
  };

  return (
    <div
      className="fixed inset-0 z-50 grid place-items-center bg-[#02040a]/70 p-4 backdrop-blur-md"
      onMouseDown={(event) => {
        if (event.target === event.currentTarget) closeSettings();
      }}
      role="presentation"
    >
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="settings-title"
        className="glass panel-scroll max-h-[90dvh] w-full max-w-lg animate-rise-in overflow-y-auto rounded-3xl p-5 sm:p-6"
      >
        <div className="flex items-start justify-between gap-4">
          <div>
            <span className="font-mono text-[10px] uppercase tracking-[0.24em] text-accent">
              Konfigurasi orbit
            </span>
            <h2
              id="settings-title"
              className="mt-1.5 text-xl font-semibold tracking-tight text-white"
            >
              Pengaturan
            </h2>
            <p className="mt-1 text-[12px] text-muted">
              Energi tata surya aktif, kualitas visual, dan cadangan data.
            </p>
          </div>
          <button
            type="button"
            onClick={closeSettings}
            className="grid h-8 w-8 shrink-0 place-items-center rounded-full border border-white/10 bg-white/[0.04] text-white/60 transition hover:border-white/20 hover:text-white"
            aria-label="Tutup pengaturan"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        <div className="mt-5 space-y-5">
          <section>
            <div className="flex items-center justify-between gap-2">
              <span className={`${sectionTitle} flex items-center gap-1.5`}>
                <Zap className="h-3 w-3 text-accent" />
                Energi harian
              </span>
              <span className="font-mono text-[11px] text-white/80">
                {formatMinutes(system.energyMinutes)}
              </span>
            </div>
            <input
              id="daily-energy"
              type="range"
              min={60}
              max={720}
              step={30}
              value={system.energyMinutes}
              onChange={(event) =>
                setSystemEnergy(system.id, Number(event.target.value))
              }
              className="mt-2.5 w-full accent-[#5eead4]"
              aria-label={`Anggaran energi harian ${system.name} dalam menit`}
            />
            <div className="mt-1 flex justify-between font-mono text-[9px] text-muted/60">
              <span>1j</span>
              <span>6j</span>
              <span>12j</span>
            </div>
            <p className="mt-1.5 text-[11px] leading-relaxed text-muted">
              Anggaran untuk{" "}
              <span className="text-white/80">{system.name}</span>. Ini
              pengingat lembut, bukan pembatas — melewatinya hanya membuat
              corona matahari meredup.
            </p>
          </section>

          <section>
            <span className={sectionTitle}>Kualitas visual</span>
            <div className="mt-2 grid grid-cols-3 gap-2">
              {QUALITY_OPTIONS.map((option) => {
                const active = (settings.autoQuality ? "auto" : settings.quality) === option.value;
                return (
                  <button
                    key={option.value}
                    type="button"
                    onClick={() =>
                      option.value === "auto"
                        ? updateSettings({ autoQuality: true })
                        : updateSettings({
                            autoQuality: false,
                            quality: option.value,
                          })
                    }
                    aria-pressed={active}
                    className={`rounded-2xl border p-3 text-left transition ${
                      active
                        ? "border-mint/40 bg-mint/[0.07]"
                        : "border-white/8 bg-white/[0.02] hover:border-white/20"
                    }`}
                  >
                    <span
                      className={`block text-[12px] font-medium ${
                        active ? "text-mint" : "text-white/80"
                      }`}
                    >
                      {option.label}
                    </span>
                    <span className="mt-0.5 block text-[10px] leading-snug text-muted">
                      {option.hint}
                    </span>
                  </button>
                );
              })}
            </div>
            {settings.autoQuality && (
              <p className="mt-2 text-[10px] leading-relaxed text-muted">
                Rekomendasi perangkat: {device.recommended === "high" ? "Sinematik" : "Ringan"}
                {device.reasons.length > 0
                  ? ` (${device.reasons.join(", ")})`
                  : ""}
                .
              </p>
            )}
          </section>

          <section className="flex items-center justify-between gap-3 rounded-2xl border border-white/8 bg-white/[0.025] p-3">
            <div className="flex items-center gap-2.5">
              {settings.sound ? (
                <Volume2 className="h-4 w-4 text-mint" />
              ) : (
                <VolumeX className="h-4 w-4 text-muted" />
              )}
              <div>
                <p className="text-[12px] font-medium text-white/85">
                  Bunyi penyelesaian
                </p>
                <p className="text-[10.5px] text-muted">
                  Off secara default. Nada kecil saat planet menyala.
                </p>
              </div>
            </div>
            <button
              type="button"
              role="switch"
              aria-checked={settings.sound}
              aria-label="Bunyi penyelesaian"
              onClick={() => {
                const next = !settings.sound;
                updateSettings({ sound: next });
                if (next) playCompletionChime();
              }}
              className={`relative h-6 w-11 shrink-0 rounded-full border transition ${
                settings.sound
                  ? "border-mint/50 bg-mint/30"
                  : "border-white/15 bg-white/10"
              }`}
            >
              <span
                className={`absolute top-0.5 h-4.5 w-4.5 rounded-full transition ${
                  settings.sound
                    ? "left-[22px] bg-mint"
                    : "left-0.5 bg-white/60"
                }`}
                style={{ height: 18, width: 18 }}
              />
            </button>
          </section>

          <section className="flex items-center justify-between gap-3">
            <div className="flex items-center gap-2.5">
              <Flame
                className={`h-4 w-4 ${
                  activeStreak > 0 ? "text-orange-300" : "text-white/25"
                }`}
              />
              <div>
                <p className="text-[12px] font-medium text-white/85">
                  Streak penyelesaian
                </p>
                <p className="text-[10.5px] text-muted">
                  {activeStreak > 0
                    ? `${activeStreak} hari beruntun di ${system.name}.`
                    : `Selesaikan satu tugas di ${system.name} untuk memulai.`}
                </p>
              </div>
            </div>
            <button
              type="button"
              onClick={() => resetStreak()}
              disabled={system.streak.count === 0}
              className="rounded-full border border-white/10 px-3 py-1.5 text-[10.5px] text-white/55 transition hover:border-white/25 hover:text-white disabled:opacity-30"
            >
              Reset
            </button>
          </section>

          <section className="flex items-center justify-between gap-3 rounded-2xl border border-white/8 bg-white/[0.025] p-3">
            <div className="flex items-center gap-2.5">
              <Orbit className="h-4 w-4 text-accent" />
              <div>
                <p className="text-[12px] font-medium text-white/85">
                  Tata surya
                </p>
                <p className="max-w-[230px] truncate text-[10.5px] text-muted">
                  {system.name} aktif. Buat, ganti nama, atau arsipkan.
                </p>
              </div>
            </div>
            <button
              type="button"
              onClick={() => {
                closeSettings();
                openSystem();
              }}
              className="shrink-0 rounded-full border border-white/10 px-3 py-1.5 text-[10.5px] text-white/65 transition hover:border-accent/40 hover:text-white"
            >
              Kelola
            </button>
          </section>

          <section className="rounded-2xl border border-white/8 bg-white/[0.025] p-3">
            <span className={`${sectionTitle} flex items-center gap-1.5`}>
              <Sparkles className="h-3 w-3 text-accent" />
              Data & cadangan
            </span>
            <p className="mt-1.5 text-[11px] leading-relaxed text-muted">
              Semua data tersimpan lokal di perangkat ini. Ekspor JSON sebelum
              pindah perangkat atau membersihkan browser.
            </p>

            <div className="mt-2.5 flex flex-wrap gap-2">
              <button
                type="button"
                onClick={handleExport}
                className="inline-flex h-9 items-center gap-1.5 rounded-full border border-white/10 bg-white/[0.04] px-3 text-[11px] font-medium text-white/75 transition hover:border-white/25 hover:text-white"
              >
                <Download className="h-3.5 w-3.5" />
                Ekspor backup
              </button>

              <label
                htmlFor="backup-file"
                className="inline-flex h-9 cursor-pointer items-center gap-1.5 rounded-full border border-white/10 bg-white/[0.04] px-3 text-[11px] font-medium text-white/75 transition hover:border-white/25 hover:text-white"
              >
                <Upload className="h-3.5 w-3.5" />
                Impor backup
              </label>
              <input
                id="backup-file"
                type="file"
                accept="application/json,.json"
                onChange={handleFile}
                className="hidden"
              />
            </div>

            {pending && (
              <div className="mt-2.5 rounded-xl border border-amber-400/25 bg-amber-400/[0.06] p-2.5">
                <p className="text-[11px] font-medium text-amber-100">
                  Ganti data dengan {pending.systems.length} tata surya (
                  {pendingTasks} tugas)?
                </p>
                {pendingMainGoal && (
                  <p className="mt-0.5 truncate text-[10.5px] text-amber-100/60">
                    Main goal pertama: {pendingMainGoal}
                  </p>
                )}
                <div className="mt-2 flex gap-1.5">
                  <button
                    type="button"
                    onClick={applyRestore}
                    className="rounded-lg bg-amber-300 px-2.5 py-1.5 text-[10.5px] font-semibold text-[#2a1a03] transition hover:brightness-105"
                  >
                    Ya, pulihkan
                  </button>
                  <button
                    type="button"
                    onClick={() => setPending(null)}
                    className="rounded-lg border border-white/10 px-2.5 py-1.5 text-[10.5px] text-white/70 transition hover:border-white/25"
                  >
                    Batal
                  </button>
                </div>
              </div>
            )}

            {status && (
              <p className="mt-2 text-[10.5px] text-mint/90">{status}</p>
            )}
          </section>

          <section className="flex items-center justify-between gap-3">
            <div>
              <p className="text-[12px] font-medium text-white/85">
                Panduan singkat
              </p>
              <p className="text-[10.5px] text-muted">
                Lihat lagi cara kerja bulan, komet, energi, dan tata surya.
              </p>
            </div>
            <button
              type="button"
              onClick={() => {
                reopenIntro();
                closeSettings();
              }}
              className="rounded-full border border-white/10 px-3 py-1.5 text-[10.5px] text-white/65 transition hover:border-white/25 hover:text-white"
            >
              Tampilkan
            </button>
          </section>
        </div>

        <div className="mt-5 flex items-center justify-between border-t border-white/8 pt-4">
          <span className="text-[10px] text-muted/70">
            Orbitask v3 · tersimpan lokal
          </span>
          <button
            type="button"
            onClick={closeSettings}
            className="h-9 rounded-full bg-white/[0.07] px-4 text-[11.5px] font-medium text-white transition hover:bg-white/[0.12]"
          >
            Selesai
          </button>
        </div>
      </div>
    </div>
  );
}
