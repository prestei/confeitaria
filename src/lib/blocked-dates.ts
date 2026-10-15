import { isSameDay } from "date-fns";

export type BlockedDateRow = {
  id: string;
  date: string;
  reason: string | null;
};

export function isDateBlocked(
  blocked: BlockedDateRow[],
  day: Date,
): BlockedDateRow | undefined {
  return blocked.find((b) => isSameDay(new Date(b.date), day));
}
