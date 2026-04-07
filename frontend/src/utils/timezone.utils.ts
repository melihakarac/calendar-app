import { useMemo } from 'react';

export const COMMON_TIMEZONES = [
  'America/New_York',
  'America/Chicago',
  'America/Denver',
  'America/Los_Angeles',
  'America/Anchorage',
  'Pacific/Honolulu',
  'America/Toronto',
  'America/Vancouver',
  'America/Sao_Paulo',
  'Europe/London',
  'Europe/Paris',
  'Europe/Berlin',
  'Europe/Madrid',
  'Europe/Rome',
  'Europe/Moscow',
  'Europe/Istanbul',
  'Asia/Dubai',
  'Asia/Kolkata',
  'Asia/Bangkok',
  'Asia/Singapore',
  'Asia/Shanghai',
  'Asia/Tokyo',
  'Asia/Seoul',
  'Asia/Hong_Kong',
  'Australia/Sydney',
  'Australia/Melbourne',
  'Pacific/Auckland',
  'Africa/Cairo',
  'Africa/Johannesburg',
  'Africa/Lagos',
];

export function getAllTimezones(): string[] {
  try {
    return Intl.supportedValuesOf('timeZone');
  } catch {
    return COMMON_TIMEZONES;
  }
}

export function formatTimezoneLabel(tz: string): string {
  try {
    const now = new Date();
    const offset = new Intl.DateTimeFormat('en-US', {
      timeZone: tz,
      timeZoneName: 'shortOffset',
    })
      .formatToParts(now)
      .find((p) => p.type === 'timeZoneName')?.value;
    return `${tz.replace(/_/g, ' ')} (${offset || ''})`;
  } catch {
    return tz.replace(/_/g, ' ');
  }
}

export function useSortedTimezones(): string[] {
  const allTz = useMemo(() => getAllTimezones(), []);

  return useMemo(() => {
    const common = new Set(COMMON_TIMEZONES);
    return [...allTz].sort((a, b) => {
      const aCommon = common.has(a);
      const bCommon = common.has(b);
      if (aCommon && !bCommon) return -1;
      if (!aCommon && bCommon) return 1;
      return a.localeCompare(b);
    });
  }, [allTz]);
}
