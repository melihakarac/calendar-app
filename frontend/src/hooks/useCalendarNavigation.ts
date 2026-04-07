import { useMemo } from 'react';
import {
  startOfDay,
  endOfDay,
  startOfWeek,
  endOfWeek,
  startOfMonth,
  endOfMonth,
  format,
  eachDayOfInterval,
} from 'date-fns';
import { useCalendarStore } from '../stores/calendarStore';

export function useCalendarNavigation() {
  const { viewMode, selectedDate } = useCalendarStore();

  const dateRange = useMemo(() => {
    let start: Date;
    let end: Date;

    if (viewMode === 'day') {
      start = startOfDay(selectedDate);
      end = endOfDay(selectedDate);
    } else if (viewMode === 'week') {
      start = startOfWeek(selectedDate, { weekStartsOn: 0 });
      end = endOfWeek(selectedDate, { weekStartsOn: 0 });
    } else {
      const monthStart = startOfMonth(selectedDate);
      const monthEnd = endOfMonth(selectedDate);
      start = startOfWeek(monthStart, { weekStartsOn: 0 });
      end = endOfWeek(monthEnd, { weekStartsOn: 0 });
    }

    return { start, end };
  }, [viewMode, selectedDate]);

  const queryRange = useMemo(
    () => ({
      from: dateRange.start.toISOString(),
      to: dateRange.end.toISOString(),
    }),
    [dateRange],
  );

  const days = useMemo(
    () => eachDayOfInterval({ start: dateRange.start, end: dateRange.end }),
    [dateRange],
  );

  const headerLabel = useMemo(() => {
    if (viewMode === 'day') return format(selectedDate, 'EEEE, MMMM d, yyyy');
    if (viewMode === 'week') {
      const weekStart = startOfWeek(selectedDate, { weekStartsOn: 0 });
      const weekEnd = endOfWeek(selectedDate, { weekStartsOn: 0 });
      if (weekStart.getMonth() === weekEnd.getMonth()) {
        return `${format(weekStart, 'MMMM d')} – ${format(weekEnd, 'd, yyyy')}`;
      }
      return `${format(weekStart, 'MMM d')} – ${format(weekEnd, 'MMM d, yyyy')}`;
    }
    return format(selectedDate, 'MMMM yyyy');
  }, [viewMode, selectedDate]);

  return {
    dateRange,
    queryRange,
    days,
    headerLabel,
  };
}
