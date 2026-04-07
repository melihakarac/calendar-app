import {
  format,
  differenceInMinutes,
  startOfDay,
  parseISO,
  isValid,
  addMinutes,
  setHours,
  setMinutes,
} from 'date-fns';
import { toZonedTime, fromZonedTime } from 'date-fns-tz';

export function utcToLocal(utcDateStr: string, timezone: string): Date {
  return toZonedTime(parseISO(utcDateStr), timezone);
}

export function localToUtc(localDate: Date, timezone: string): Date {
  return fromZonedTime(localDate, timezone);
}

export function formatTimeLabel(date: Date): string {
  return format(date, 'h:mm a');
}

export function formatHourLabel(hour: number): string {
  if (hour === 0) return '12 AM';
  if (hour === 12) return '12 PM';
  if (hour < 12) return `${hour} AM`;
  return `${hour - 12} PM`;
}

export function getMinutesFromMidnight(date: Date): number {
  return differenceInMinutes(date, startOfDay(date));
}

export function getDurationMinutes(startUtc: string, endUtc: string): number {
  return differenceInMinutes(parseISO(endUtc), parseISO(startUtc));
}

export function parseISOSafe(dateStr: string): Date | null {
  const d = parseISO(dateStr);
  return isValid(d) ? d : null;
}

export function roundToNearest15(date: Date): Date {
  const mins = date.getMinutes();
  const rounded = Math.round(mins / 15) * 15;
  return setMinutes(setHours(new Date(date), date.getHours()), rounded);
}

export function createDateWithTime(date: Date, hours: number, minutes: number): Date {
  return setMinutes(setHours(new Date(date), hours), minutes);
}

export function formatDatetimeLocal(date: Date): string {
  return format(date, "yyyy-MM-dd'T'HH:mm");
}

export { addMinutes, format, parseISO, isValid };
