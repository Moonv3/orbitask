"use client";

import { useState, type FormEvent } from "react";
import {
  Archive,
  ArchiveRestore,
  Check,
  Orbit,
  Pencil,
  Plus,
  Sparkles,
  X,
  Zap,
} from "lucide-react";
import { formatMinutes } from "@/lib/format";
import { MAX_SYSTEM_NAME, MAX_SYSTEMS } from "@/lib/migrate";
import { SYSTEM_ACCENTS } from "@/lib/palette";
import { energySummary } from "@/lib/selectors";
import { useTaskStore } from "@/store/useTaskStore";
import type { System } from "@/lib/types";

const fieldClass =
  "w-full rounded-xl border border-white/10 bg-white/[0.04] px-3.5 py-2.5 text-sm text-white placeholder:text-muted/60 outline-none transition focus:border-accent/50 focus:bg-white/[0.06]";

const ENERGY_CHOICES = [120, 240, 360, 480, 720];

const labelClass =
  "mb-1.5 block text-[10px] font-medium uppercase tracking-[0.16em] text-muted";

function SystemRow({ system }: { system: System }) {
  const activeSystemId = useTaskStore((state) => state.activeSystemId);
  const switchSystem = useTaskStore((state) => state.switchSystem);
  const renameSystem = useTaskStore((state) => state.renameSystem);
  const archiveSystem = useTaskStore((state) => state.archiveSystem);
  const restoreSystem = useTaskStore((state) => state.restoreSystem);
  const systems = useTaskStore((state) => state.systems);

  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState(system.name);

  const active = system.id === activeSystemId;
  const activeCount = systems.filter((item) => !item.archived).length;
  const canArchive = !system.archived && activeCount > 1;
  const done = system.tasks.filter((task) => task.completed).length;
  const energy = energySummary(system.tasks, system.energyMinutes);

  const submitRename = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!draft.trim()) return;
    renameSystem(system.id, draft);
    setEditing(false);
  };

  return (
    <li
      className={`rounded-2xl border p-3 transition ${
        active
          ? "border-white/20 bg-white/[0.06]"
          : system.archived
            ? "border-white/8 bg-white/[0.015] opacity-70"
            : "border-white/8 bg-white/[0.03] hover:border-white/15"
      }`}
    >
      <div className="flex flex-wrap items-start gap-2.5">
        <span
          className="mt-1 h-3 w-3 shrink-0 rounded-full"
          style={{
            background: system.accent,
            boxShadow: active ? `0 0 12px ${system.accent}` : undefined,
          }}
        />

        <div className="min-w-0 flex-1">
          {editing ? (
            <form onSubmit={submitRename} className="flex items-center gap-1.5">
              <input
                value={draft}
                onChange={(event) => setDraft(event.target.value)}
                maxLength={MAX_SYSTEM_NAME}
                autoFocus
                aria-label={`Nama baru untuk ${system.name}`}
                className="h-8 min-w-0 flex-1 rounded-lg border border-white/15 bg-white/[0.06] px-2.5 text-[12.5px] text-white outline-none focus:border-accent/50"
              />
              <button
                type="submit"
                disabled={!draft.trim()}
                className="grid h-8 w-8 place-items-center rounded-lg border border-white/10 bg-white/[0.05] text-mint transition hover:border-mint/40 disabled:opacity-30"
                aria-label="Simpan nama"
              >
                <Check className="h-3.5 w-3.5" />
              </button>
              <button
                type="button"
                onClick={() => {
                  setDraft(system.name);
                  setEditing(false);
                }}
                className="grid h-8 w-8 place-items-center rounded-lg border border-white/10 text-white/55 transition hover:border-white/25 hover:text-white"
                aria-label="Batal ganti nama"
              >
                <X className="h-3.5 w-3.5" />
              </button>
            </form>
          ) : (
            <div className="flex items-center gap-2">
              <p className="truncate text-[13px] font-medium text-white/90">
                {system.name}
              </p>
              {active && (
                <span className="rounded-full border border-mint/30 bg-mint/10 px-1.5 py-0.5 font-mono text-[9px] uppercase tracking-[0.12em] text-mint">
                  aktif
                </span>
              )}
              {system.archived && (
                <span className="rounded-full border border-white/12 bg-white/[0.05] px-1.5 py-0.5 font-mono text-[9px] uppercase tracking-[0.12em] text-white/45">
                  arsip
                </span>
              )}
            </div>
          )}

          <p className="mt-0.5 truncate text-[11px] text-muted">
            {system.mainGoal}
          </p>

          <div className="mt-1.5 flex flex-wrap items-center gap-x-2 gap-y-1 font-mono text-[10px] text-muted">
            <span>
              {done}/{system.tasks.length} tugas
            </span>
            <span className="text-white/15">·</span>
            <span
              className="inline-flex items-center gap-1"
              style={{ color: energy.over ? energy.color : undefined }}
            >
              <Zap className="h-2.5 w-2.5" />
              {formatMinutes(energy.used)} / {formatMinutes(energy.budget)}
            </span>
            {system.streak.count > 0 && (
              <>
                <span className="text-white/15">·</span>
                <span className="text-orange-300/80">
                  {system.streak.count} hari
                </span>
              </>
            )}
          </div>
        </div>

        <div className="flex items-center gap-1.5">
          {!editing && (
            <button
              type="button"
              onClick={() => {
                setDraft(system.name);
                setEditing(true);
              }}
              className="grid h-8 w-8 place-items-center rounded-lg border border-white/8 bg-white/[0.02] text-white/45 transition hover:border-white/20 hover:text-white"
              aria-label={`Ganti nama ${system.name}`}
              title="Ganti nama"
            >
              <Pencil className="h-3.5 w-3.5" />
            </button>
          )}

          {system.archived ? (
            <button
              type="button"
              onClick={() => restoreSystem(system.id)}
              className="inline-flex h-8 items-center gap-1.5 rounded-lg border border-white/10 bg-white/[0.04] px-2.5 text-[11px] font-medium text-white/70 transition hover:border-mint/40 hover:text-mint"
            >
              <ArchiveRestore className="h-3.5 w-3.5" />
              Pulihkan
            </button>
          ) : (
            <>
              {!active && (
                <button
                  type="button"
                  onClick={() => switchSystem(system.id)}
                  className="inline-flex h-8 items-center gap-1.5 rounded-lg border border-white/10 bg-white/[0.05] px-2.5 text-[11px] font-medium text-white/80 transition hover:border-accent/40 hover:text-white"
                >
                  <Orbit className="h-3.5 w-3.5" />
                  Buka
                </button>
              )}
              <button
                type="button"
                onClick={() => archiveSystem(system.id)}
                disabled={!canArchive}
                className="grid h-8 w-8 place-items-center rounded-lg border border-white/8 bg-white/[0.02] text-white/35 transition hover:border-amber-300/30 hover:text-amber-200 disabled:opacity-25"
                aria-label={`Arsipkan ${system.name}`}
                title={
                  canArchive
                    ? "Arsipkan (bisa dipulihkan)"
                    : "Minimal satu tata surya harus tetap aktif"
                }
              >
                <Archive className="h-3.5 w-3.5" />
              </button>
            </>
          )}
        </div>
      </div>
    </li>
  );
}

export default function SystemDialog() {
  const isOpen = useTaskStore((state) => state.isSystemOpen);
  const closeSystem = useTaskStore((state) => state.closeSystem);
  const systems = useTaskStore((state) => state.systems);
  const addSystem = useTaskStore((state) => state.addSystem);

  const [name, setName] = useState("");
  const [mainGoal, setMainGoal] = useState("");
  const [accent, setAccent] = useState(SYSTEM_ACCENTS[1].value);
  const [energy, setEnergy] = useState(360);
  const [error, setError] = useState("");

  if (!isOpen) return null;

  const activeSystems = systems.filter((system) => !system.archived);
  const archived = systems.filter((system) => system.archived);
  const full = systems.length >= MAX_SYSTEMS;

  const handleCreate = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!name.trim()) {
      setError("Beri nama tata suryanya dulu, ya.");
      return;
    }

    const id = addSystem({ name, mainGoal, accent, energyMinutes: energy });
    if (!id) {
      setError(`Maksimal ${MAX_SYSTEMS} tata surya.`);
      return;
    }

    setName("");
    setMainGoal("");
    setError("");
  };

  return (
    <div
      className="fixed inset-0 z-50 grid place-items-center bg-[#02040a]/70 p-4 backdrop-blur-md"
      onMouseDown={(event) => {
        if (event.target === event.currentTarget) closeSystem();
      }}
      role="presentation"
    >
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="system-title"
        className="glass panel-scroll max-h-[90dvh] w-full max-w-xl animate-rise-in overflow-y-auto rounded-3xl p-5 sm:p-6"
      >
        <div className="flex items-start justify-between gap-4">
          <div>
            <span className="font-mono text-[10px] uppercase tracking-[0.24em] text-accent">
              Banyak matahari
            </span>
            <h2
              id="system-title"
              className="mt-1.5 text-xl font-semibold tracking-tight text-white"
            >
              Tata surya
            </h2>
            <p className="mt-1 text-[12px] leading-relaxed text-muted">
              Setiap tata surya punya matahari, planet, energi, dan streak
              sendiri. Arsip tidak menghapus apa pun.
            </p>
          </div>
          <button
            type="button"
            onClick={closeSystem}
            className="grid h-8 w-8 shrink-0 place-items-center rounded-full border border-white/10 bg-white/[0.04] text-white/60 transition hover:border-white/20 hover:text-white"
            aria-label="Tutup tata surya"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        <ul className="mt-4 space-y-2">
          {[...activeSystems, ...archived].map((system) => (
            <SystemRow key={system.id} system={system} />
          ))}
        </ul>

        <div className="mt-5 rounded-2xl border border-white/8 bg-white/[0.025] p-3.5">
          <div className="flex items-center justify-between gap-2">
            <span className="flex items-center gap-1.5 text-[10px] font-semibold uppercase tracking-[0.18em] text-muted">
              <Sparkles className="h-3 w-3 text-accent" />
              Tata surya baru
            </span>
            <span className="font-mono text-[10px] text-muted/70">
              {systems.length}/{MAX_SYSTEMS}
            </span>
          </div>

          {full ? (
            <p className="mt-2 text-[11.5px] leading-relaxed text-amber-100/80">
              Batas {MAX_SYSTEMS} tata surya sudah tercapai. Arsipkan salah
              satunya untuk memberi ruang.
            </p>
          ) : (
            <form onSubmit={handleCreate} className="mt-3 space-y-3">
              <div className="grid gap-3 sm:grid-cols-2">
                <div>
                  <label htmlFor="system-name" className={labelClass}>
                    Nama <span className="text-accent">*</span>
                  </label>
                  <input
                    id="system-name"
                    value={name}
                    onChange={(event) => {
                      setName(event.target.value);
                      setError("");
                    }}
                    maxLength={MAX_SYSTEM_NAME}
                    placeholder="Contoh: Skripsi"
                    className={fieldClass}
                  />
                </div>
                <div>
                  <label htmlFor="system-goal" className={labelClass}>
                    Matahari / main goal
                  </label>
                  <input
                    id="system-goal"
                    value={mainGoal}
                    onChange={(event) => setMainGoal(event.target.value)}
                    maxLength={90}
                    placeholder="Contoh: Lulus semester ini"
                    className={fieldClass}
                  />
                </div>
              </div>

              <div>
                <span className={labelClass}>Warna matahari</span>
                <div className="flex flex-wrap gap-2">
                  {SYSTEM_ACCENTS.map((option) => {
                    const selected = accent === option.value;
                    return (
                      <button
                        key={option.value}
                        type="button"
                        onClick={() => setAccent(option.value)}
                        aria-pressed={selected}
                        aria-label={`Warna ${option.label}`}
                        title={option.label}
                        className={`grid h-8 w-8 place-items-center rounded-full border transition ${
                          selected
                            ? "border-white/60"
                            : "border-white/10 hover:border-white/30"
                        }`}
                      >
                        <span
                          className="h-5 w-5 rounded-full"
                          style={{
                            background: option.value,
                            boxShadow: selected
                              ? `0 0 12px ${option.value}`
                              : undefined,
                          }}
                        />
                      </button>
                    );
                  })}
                </div>
              </div>

              <div>
                <span className={labelClass}>Energi harian</span>
                <div className="flex flex-wrap gap-1.5">
                  {ENERGY_CHOICES.map((minutes) => {
                    const selected = energy === minutes;
                    return (
                      <button
                        key={minutes}
                        type="button"
                        onClick={() => setEnergy(minutes)}
                        aria-pressed={selected}
                        className={`rounded-lg border px-2.5 py-1.5 font-mono text-[11px] transition ${
                          selected
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

              {error && (
                <p className="text-[11px] text-rose-300">{error}</p>
              )}

              <div className="flex items-center justify-between gap-2 pt-1">
                <p className="text-[10.5px] leading-snug text-muted/80">
                  Kamu akan langsung pindah ke tata surya baru.
                </p>
                <button
                  type="submit"
                  disabled={!name.trim()}
                  className="inline-flex h-9 shrink-0 items-center gap-1.5 rounded-full bg-gradient-to-r from-emerald-300 to-teal-300 px-4 text-[11.5px] font-semibold text-[#04211b] transition hover:brightness-105 disabled:opacity-40"
                >
                  <Plus className="h-3.5 w-3.5" strokeWidth={2.5} />
                  Buat
                </button>
              </div>
            </form>
          )}
        </div>

        <div className="mt-4 flex items-center justify-between border-t border-white/8 pt-4">
          <span className="text-[10px] text-muted/70">
            Data semua tata surya tersimpan bersama di perangkat ini.
          </span>
          <button
            type="button"
            onClick={closeSystem}
            className="h-9 rounded-full bg-white/[0.07] px-4 text-[11.5px] font-medium text-white transition hover:bg-white/[0.12]"
          >
            Selesai
          </button>
        </div>
      </div>
    </div>
  );
}
