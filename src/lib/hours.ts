/** Shared store-hours parsing and open/closed checks (America/Sao_Paulo). */

export const DAY_KEYS = [
  { key: "seg", label: "Segunda", short: "Seg", jsDay: 1 },
  { key: "ter", label: "Terça", short: "Ter", jsDay: 2 },
  { key: "qua", label: "Quarta", short: "Qua", jsDay: 3 },
  { key: "qui", label: "Quinta", short: "Qui", jsDay: 4 },
  { key: "sex", label: "Sexta", short: "Sex", jsDay: 5 },
  { key: "sab", label: "Sábado", short: "Sáb", jsDay: 6 },
  { key: "dom", label: "Domingo", short: "Dom", jsDay: 0 },
] as const;

export type DayKey = (typeof DAY_KEYS)[number]["key"];

export type DaySchedule = {
  open: boolean;
  start: string;
  end: string;
};

export type WeekSchedule = Record<DayKey, DaySchedule>;

const DEFAULT_DAY: DaySchedule = { open: true, start: "09:00", end: "18:00" };

export function defaultWeek(): WeekSchedule {
  return {
    seg: { ...DEFAULT_DAY },
    ter: { ...DEFAULT_DAY },
    qua: { ...DEFAULT_DAY },
    qui: { ...DEFAULT_DAY },
    sex: { ...DEFAULT_DAY },
    sab: { open: true, start: "09:00", end: "13:00" },
    dom: { open: false, start: "09:00", end: "18:00" },
  };
}

export function normalizeTime(t: string): string {
  const [h, m] = t.split(":");
  return `${h.padStart(2, "0")}:${(m ?? "00").padStart(2, "0")}`;
}

export function formatWeek(week: WeekSchedule): string {
  return DAY_KEYS.map(({ key, short }) => {
    const d = week[key];
    if (!d.open) return `${short} fechado`;
    return `${short} ${d.start}–${d.end}`;
  }).join(" · ");
}

export function parseWeek(value: string | null | undefined): WeekSchedule | null {
  if (!value?.trim()) return null;
  const week = defaultWeek();
  let matched = 0;
  for (const { key, short } of DAY_KEYS) {
    const re = new RegExp(
      `${short}\\s+(fechado|(\\d{1,2}:\\d{2})\\s*[–-]\\s*(\\d{1,2}:\\d{2}))`,
      "i",
    );
    const m = value.match(re);
    if (!m) continue;
    matched += 1;
    if (m[1].toLowerCase() === "fechado") {
      week[key] = { ...week[key], open: false };
    } else {
      week[key] = {
        open: true,
        start: normalizeTime(m[2]),
        end: normalizeTime(m[3]),
      };
    }
  }
  return matched >= 3 ? week : null;
}

function partsInSaoPaulo(date = new Date()) {
  const fmt = new Intl.DateTimeFormat("en-US", {
    timeZone: "America/Sao_Paulo",
    weekday: "short",
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
  });
  const parts = fmt.formatToParts(date);
  const weekday = parts.find((p) => p.type === "weekday")?.value ?? "";
  const hour = parts.find((p) => p.type === "hour")?.value ?? "00";
  const minute = parts.find((p) => p.type === "minute")?.value ?? "00";
  const weekdayMap: Record<string, number> = {
    Sun: 0,
    Mon: 1,
    Tue: 2,
    Wed: 3,
    Thu: 4,
    Fri: 5,
    Sat: 6,
  };
  return {
    jsDay: weekdayMap[weekday] ?? date.getDay(),
    minutes: Number(hour) * 60 + Number(minute === "24" ? "0" : minute),
  };
}

function timeToMinutes(t: string): number {
  const [h, m] = normalizeTime(t).split(":").map(Number);
  return h * 60 + m;
}

export type StoreOpenStatus = {
  /** Whether we could parse a structured week schedule. */
  scheduled: boolean;
  open: boolean;
  label: string;
  todayLabel: string | null;
};

/**
 * When businessHours is free-text (unparseable), returns scheduled:false and
 * open:true so we don't block orders on display-only notes.
 */
export function getStoreOpenStatus(
  businessHours: string | null | undefined,
  now = new Date(),
): StoreOpenStatus {
  const week = parseWeek(businessHours);
  if (!week) {
    return {
      scheduled: false,
      open: true,
      label: businessHours?.trim() ? "Horário informado" : "Sem horário definido",
      todayLabel: null,
    };
  }

  const { jsDay, minutes } = partsInSaoPaulo(now);
  const dayMeta = DAY_KEYS.find((d) => d.jsDay === jsDay)!;
  const day = week[dayMeta.key];

  if (!day.open) {
    return {
      scheduled: true,
      open: false,
      label: "Fechado",
      todayLabel: `${dayMeta.short} fechado`,
    };
  }

  const start = timeToMinutes(day.start);
  const end = timeToMinutes(day.end);
  const within =
    end > start
      ? minutes >= start && minutes < end
      : minutes >= start || minutes < end; // overnight window

  return {
    scheduled: true,
    open: within,
    label: within ? "Aberto" : "Fechado",
    todayLabel: `${dayMeta.short} ${day.start}–${day.end}`,
  };
}

export function isStoreOpenNow(
  businessHours: string | null | undefined,
  now = new Date(),
): boolean {
  return getStoreOpenStatus(businessHours, now).open;
}

/** JS weekday 0=Sun … 6=Sat → whether the store accepts orders that day. */
export function isStoreOpenOnWeekday(
  businessHours: string | null | undefined,
  jsDay: number,
): boolean | null {
  const week = parseWeek(businessHours);
  if (!week) return null;
  const dayMeta = DAY_KEYS.find((d) => d.jsDay === jsDay);
  if (!dayMeta) return null;
  return week[dayMeta.key].open;
}
