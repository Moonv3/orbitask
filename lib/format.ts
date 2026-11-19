const DAY = 86_400_000;

export function parseLocalDate(iso: string): Date {
  const [year, month, day] = iso.split("-").map(Number);
  return new Date(year, (month ?? 1) - 1, day ?? 1);
}

const pad = (value: number) => String(value).padStart(2, "0");

/** Local date key in YYYY-MM-DD form. */
export function todayKey(date = new Date()): string {
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}`;
}

export function dateFromToday(offset: number): string {
  const date = new Date();
  date.setDate(date.getDate() + offset);
  return todayKey(date);
}

export function formatDate(iso?: string): string {
  if (!iso) return "Tanpa tenggat";
  return parseLocalDate(iso).toLocaleDateString("id-ID", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
}

/** Whole days from today to the target date. Negative means overdue. */
export function daysUntil(iso?: string): number | null {
  if (!iso) return null;
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const target = parseLocalDate(iso);
  target.setHours(0, 0, 0, 0);
  return Math.round((target.getTime() - today.getTime()) / DAY);
}

export function dueLabel(iso?: string): string {
  if (!iso) return "Tanpa tenggat";
  const diff = daysUntil(iso);
  if (diff === null) return "Tanpa tenggat";

  if (diff === 0) return "Hari ini";
  if (diff === 1) return "Besok";
  if (diff === -1) return "Kemarin";
  if (diff > 1) return `${diff} hari lagi`;
  return `Terlambat ${Math.abs(diff)} hari`;
}

export function isOverdue(iso?: string): boolean {
  if (!iso) return false;
  const diff = daysUntil(iso);
  return diff !== null && diff < 0;
}

export function isToday(iso?: string): boolean {
  if (!iso) return false;
  return daysUntil(iso) === 0;
}

/** 95 -> "1j 35m", 45 -> "45m". */
export function formatMinutes(total: number): string {
  const minutes = Math.max(0, Math.round(total));
  const hours = Math.floor(minutes / 60);
  const rest = minutes % 60;
  if (hours > 0 && rest > 0) return `${hours}j ${rest}m`;
  if (hours > 0) return `${hours}j`;
  return `${rest}m`;
}

export function todayLabel(): string {
  return new Date().toLocaleDateString("id-ID", {
    weekday: "long",
    day: "numeric",
    month: "long",
  });
}
