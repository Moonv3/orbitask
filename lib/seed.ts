import { createOrbit } from "./orbit";
import { planetColor, planetSize } from "./palette";
import type { Lane, Priority, Task } from "./types";

export const DEFAULT_MAIN_GOAL = "Rilis versi pertama Orbitask";
/** Kept as an alias so older imports keep working. */
export const SEED_MAIN_GOAL = DEFAULT_MAIN_GOAL;

const pad = (value: number) => String(value).padStart(2, "0");

const addDays = (days: number) => {
  const date = new Date();
  date.setDate(date.getDate() + days);
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}`;
};

type SeedInput = {
  title: string;
  description: string;
  priority: Priority;
  dueDate?: string;
  completed?: boolean;
  lane: Lane;
  effortMinutes: number;
  tags: string[];
  subtasks: string[];
  completedSubtasks?: number;
};

const SEED_INPUT: SeedInput[] = [
  {
    title: "Luncurkan landing page",
    description:
      "Selesaikan copywriting, aset visual, dan QA responsif sebelum deploy ke produksi.",
    priority: "high",
    dueDate: addDays(0),
    lane: "now",
    effortMinutes: 120,
    tags: ["rilis", "web"],
    subtasks: ["Finalkan copy hero", "Cek tampilan mobile", "Deploy preview"],
    completedSubtasks: 1,
  },
  {
    title: "Review proposal klien",
    description:
      "Cek ruang lingkup, estimasi biaya, dan timeline pengiriman sebelum proposal dikirim.",
    priority: "high",
    dueDate: addDays(1),
    lane: "now",
    effortMinutes: 60,
    tags: ["klien"],
    subtasks: ["Cek ruang lingkup", "Hitung estimasi", "Kirim revisi"],
  },
  {
    title: "Rapat sinkronisasi tim",
    description:
      "Bahasa progres mingguan dan tentukan prioritas sprint berikutnya bersama tim produk.",
    priority: "medium",
    dueDate: addDays(0),
    completed: true,
    lane: "today",
    effortMinutes: 45,
    tags: ["tim"],
    subtasks: ["Siapkan agenda", "Catat keputusan"],
    completedSubtasks: 2,
  },
  {
    title: "Olahraga 30 menit",
    description:
      "Jalan cepat atau latihan kekuatan ringan supaya tubuh dan kepala tetap segar.",
    priority: "medium",
    dueDate: addDays(0),
    lane: "today",
    effortMinutes: 30,
    tags: ["kesehatan", "rutinitas"],
    subtasks: [],
  },
  {
    title: "Baca 20 halaman",
    description:
      "Lanjutkan buku Atomic Habits sebelum tidur. Tidak perlu cepat, yang penting konsisten.",
    priority: "low",
    dueDate: addDays(2),
    completed: true,
    lane: "later",
    effortMinutes: 30,
    tags: ["buku"],
    subtasks: ["Baca bab 4", "Tulis satu insight"],
    completedSubtasks: 2,
  },
  {
    title: "Rapikan inbox email",
    description:
      "Arsipkan email lama dan balas pesan yang masih menunggu jawaban sejak pekan lalu.",
    priority: "low",
    dueDate: addDays(3),
    lane: "later",
    effortMinutes: 45,
    tags: ["administrasi"],
    subtasks: ["Arsipkan 20 email", "Balas 5 pesan"],
  },
];

export function createSeedTasks(): Task[] {
  const now = Date.now();

  return SEED_INPUT.map((input, index) => {
    const createdAt = now - index * 86_400_000;
    const subtasks = input.subtasks.map((title, subIndex) => ({
      id: `seed-${index + 1}-moon-${subIndex + 1}`,
      title,
      completed: subIndex < (input.completedSubtasks ?? 0),
      createdAt: createdAt + subIndex * 3_600_000,
    }));

    return {
      id: `seed-${index + 1}`,
      title: input.title,
      description: input.description,
      priority: input.priority,
      dueDate: input.dueDate,
      completed: input.completed ?? false,
      createdAt,
      color: planetColor(input.priority, index),
      size: planetSize(input.priority, index),
      orbit: createOrbit(index),
      lane: input.lane,
      effortMinutes: input.effortMinutes,
      tags: input.tags,
      subtasks,
      focusSessions: input.completed ? 1 : 0,
      focusMinutes: input.completed ? Math.round(input.effortMinutes / 2) : 0,
      completedAt: input.completed ? createdAt + 2 * 3_600_000 : undefined,
    };
  });
}
