const arabicDateFormatter = new Intl.DateTimeFormat("ar", {
  weekday: "long",
  year: "numeric",
  month: "long",
  day: "numeric",
});

const arabicTimeFormatter = new Intl.DateTimeFormat("ar", {
  hour: "numeric",
  minute: "2-digit",
  hour12: true,
});

export function parseWorkshopDate(value: string | null | undefined): Date | undefined {
  if (!value || !/^\d{4}-\d{2}-\d{2}$/.test(value)) return undefined;
  const [year, month, day] = value.split("-").map(Number);
  if (!year || !month || !day) return undefined;
  return new Date(year, month - 1, day);
}

export function toWorkshopDateValue(date: Date): string {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

export function formatWorkshopDate(value: string): string {
  const date = parseWorkshopDate(value);
  return date ? arabicDateFormatter.format(date) : value;
}

export function formatWorkshopTime(value: string): string {
  if (!/^\d{2}:\d{2}(?::\d{2})?$/.test(value)) return value;
  const [hours, minutes] = value.split(":").map(Number);
  if (hours === undefined || minutes === undefined || hours > 23 || minutes > 59) return value;
  return arabicTimeFormatter.format(new Date(2000, 0, 1, hours, minutes));
}

export function formatWorkshopTimeRange(start: string, finish: string): string {
  if (!/^\d{2}:\d{2}/.test(finish)) return `${formatWorkshopTime(start)} · ${finish}`;
  return `${formatWorkshopTime(start)} – ${formatWorkshopTime(finish)}`;
}

export function isWorkshopPast(day: string, finish: string, now: Date = new Date()): boolean {
  const date = parseWorkshopDate(day);
  if (!date) return false;
  const match = /^(\d{2}):(\d{2})/.exec(finish ?? "");
  const end = new Date(date);
  if (match) end.setHours(Number(match[1]), Number(match[2]), 0, 0);
  else end.setHours(23, 59, 59, 999);
  return end.getTime() < now.getTime();
}

export function isValidTimeRange(start: string, finish: string): boolean {
  return /^\d{2}:\d{2}$/.test(start) && /^\d{2}:\d{2}$/.test(finish) && finish > start;
}