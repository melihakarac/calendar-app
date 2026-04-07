import { describe, it, expect } from 'vitest';
import {
  utcToLocal,
  localToUtc,
  formatTimeLabel,
  formatHourLabel,
  getMinutesFromMidnight,
  getDurationMinutes,
  parseISOSafe,
  roundToNearest15,
  createDateWithTime,
} from './date.utils';

describe('utcToLocal', () => {
  it('converts UTC to New York time (UTC-5 in winter)', () => {
    const local = utcToLocal('2026-01-15T17:00:00.000Z', 'America/New_York');
    expect(local.getHours()).toBe(12);
    expect(local.getMinutes()).toBe(0);
  });

  it('converts UTC to Tokyo time (UTC+9)', () => {
    const local = utcToLocal('2026-01-15T00:00:00.000Z', 'Asia/Tokyo');
    expect(local.getHours()).toBe(9);
  });

  it('converts UTC to London time (UTC+0 in winter)', () => {
    const local = utcToLocal('2026-01-15T12:00:00.000Z', 'Europe/London');
    expect(local.getHours()).toBe(12);
  });
});

describe('localToUtc', () => {
  it('converts New York local time to UTC', () => {
    const local = new Date(2026, 0, 15, 12, 0, 0);
    const utc = localToUtc(local, 'America/New_York');
    expect(utc.getUTCHours()).toBe(17);
  });

  it('round-trips correctly (utcToLocal -> localToUtc)', () => {
    const original = '2026-06-15T14:30:00.000Z';
    const tz = 'America/Los_Angeles';
    const local = utcToLocal(original, tz);
    const backToUtc = localToUtc(local, tz);
    expect(backToUtc.toISOString()).toBe(original);
  });
});

describe('formatTimeLabel', () => {
  it('formats morning time correctly', () => {
    const date = new Date(2026, 5, 15, 9, 30, 0);
    expect(formatTimeLabel(date)).toBe('9:30 AM');
  });

  it('formats afternoon time correctly', () => {
    const date = new Date(2026, 5, 15, 14, 0, 0);
    expect(formatTimeLabel(date)).toBe('2:00 PM');
  });

  it('formats midnight correctly', () => {
    const date = new Date(2026, 5, 15, 0, 0, 0);
    expect(formatTimeLabel(date)).toBe('12:00 AM');
  });

  it('formats noon correctly', () => {
    const date = new Date(2026, 5, 15, 12, 0, 0);
    expect(formatTimeLabel(date)).toBe('12:00 PM');
  });
});

describe('formatHourLabel', () => {
  it('returns "12 AM" for hour 0', () => {
    expect(formatHourLabel(0)).toBe('12 AM');
  });

  it('returns "12 PM" for hour 12', () => {
    expect(formatHourLabel(12)).toBe('12 PM');
  });

  it('returns "9 AM" for hour 9', () => {
    expect(formatHourLabel(9)).toBe('9 AM');
  });

  it('returns "3 PM" for hour 15', () => {
    expect(formatHourLabel(15)).toBe('3 PM');
  });

  it('returns "11 PM" for hour 23', () => {
    expect(formatHourLabel(23)).toBe('11 PM');
  });
});

describe('getMinutesFromMidnight', () => {
  it('returns 0 for midnight', () => {
    expect(getMinutesFromMidnight(new Date(2026, 5, 15, 0, 0, 0))).toBe(0);
  });

  it('returns 540 for 9:00 AM', () => {
    expect(getMinutesFromMidnight(new Date(2026, 5, 15, 9, 0, 0))).toBe(540);
  });

  it('returns 810 for 1:30 PM', () => {
    expect(getMinutesFromMidnight(new Date(2026, 5, 15, 13, 30, 0))).toBe(810);
  });
});

describe('getDurationMinutes', () => {
  it('returns 60 for a one-hour event', () => {
    expect(
      getDurationMinutes('2026-06-15T10:00:00.000Z', '2026-06-15T11:00:00.000Z'),
    ).toBe(60);
  });

  it('returns 30 for a half-hour event', () => {
    expect(
      getDurationMinutes('2026-06-15T10:00:00.000Z', '2026-06-15T10:30:00.000Z'),
    ).toBe(30);
  });

  it('returns 90 for a 1.5 hour event', () => {
    expect(
      getDurationMinutes('2026-06-15T10:00:00.000Z', '2026-06-15T11:30:00.000Z'),
    ).toBe(90);
  });
});

describe('parseISOSafe', () => {
  it('returns a Date for a valid ISO string', () => {
    const result = parseISOSafe('2026-06-15T10:00:00.000Z');
    expect(result).toBeInstanceOf(Date);
    expect(result!.toISOString()).toBe('2026-06-15T10:00:00.000Z');
  });

  it('returns null for an invalid string', () => {
    expect(parseISOSafe('not-a-date')).toBeNull();
  });

  it('returns null for an empty string', () => {
    expect(parseISOSafe('')).toBeNull();
  });
});

describe('roundToNearest15', () => {
  it('rounds 9:07 to 9:00', () => {
    const result = roundToNearest15(new Date(2026, 5, 15, 9, 7, 0));
    expect(result.getHours()).toBe(9);
    expect(result.getMinutes()).toBe(0);
  });

  it('rounds 9:08 to 9:15', () => {
    const result = roundToNearest15(new Date(2026, 5, 15, 9, 8, 0));
    expect(result.getHours()).toBe(9);
    expect(result.getMinutes()).toBe(15);
  });

  it('rounds 9:23 to 9:30', () => {
    const result = roundToNearest15(new Date(2026, 5, 15, 9, 23, 0));
    expect(result.getHours()).toBe(9);
    expect(result.getMinutes()).toBe(30);
  });

  it('rounds 9:45 to 9:45 (already aligned)', () => {
    const result = roundToNearest15(new Date(2026, 5, 15, 9, 45, 0));
    expect(result.getMinutes()).toBe(45);
  });
});

describe('createDateWithTime', () => {
  it('creates a date with the specified time', () => {
    const base = new Date(2026, 5, 15, 0, 0, 0);
    const result = createDateWithTime(base, 14, 30);
    expect(result.getHours()).toBe(14);
    expect(result.getMinutes()).toBe(30);
    expect(result.getDate()).toBe(15);
  });

  it('preserves the original date', () => {
    const base = new Date(2026, 11, 25, 0, 0, 0);
    const result = createDateWithTime(base, 8, 0);
    expect(result.getMonth()).toBe(11);
    expect(result.getDate()).toBe(25);
    expect(result.getHours()).toBe(8);
  });
});
