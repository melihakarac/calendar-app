import { useMemo } from 'react';
import { Box, Typography, Skeleton } from '@mui/material';
import {
  startOfMonth,
  endOfMonth,
  startOfWeek,
  endOfWeek,
  eachDayOfInterval,
  format,
  isSameMonth,
  isSameDay,
  isToday,
  parseISO,
} from 'date-fns';
import { toZonedTime } from 'date-fns-tz';
import { useCalendarStore } from '../../stores/calendarStore';
import { getEventColor } from '../../utils/color.utils';
import { palette, transitions } from '../../theme/theme';
import type { CalendarEvent } from '../../types';

const WEEKDAY_LABELS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
const MAX_VISIBLE_EVENTS = 3;

interface MonthViewProps {
  events: CalendarEvent[];
  isLoading: boolean;
}

export function MonthView({ events, isLoading }: MonthViewProps) {
  const { selectedDate, setSelectedDate, setViewMode, viewingTimezone, openEditForm } =
    useCalendarStore();

  const calendarDays = useMemo(() => {
    const monthStart = startOfMonth(selectedDate);
    const monthEnd = endOfMonth(selectedDate);
    const calStart = startOfWeek(monthStart, { weekStartsOn: 0 });
    const calEnd = endOfWeek(monthEnd, { weekStartsOn: 0 });
    return eachDayOfInterval({ start: calStart, end: calEnd });
  }, [selectedDate]);

  const eventsByDay = useMemo(() => {
    const map = new Map<string, CalendarEvent[]>();
    for (const day of calendarDays) {
      map.set(day.toDateString(), []);
    }
    for (const event of events) {
      const start = toZonedTime(parseISO(event.startUtc), viewingTimezone);
      for (const day of calendarDays) {
        if (isSameDay(start, day)) {
          map.get(day.toDateString())?.push(event);
        }
      }
    }
    return map;
  }, [events, calendarDays, viewingTimezone]);

  const weeks = useMemo(() => {
    const result: Date[][] = [];
    for (let i = 0; i < calendarDays.length; i += 7) {
      result.push(calendarDays.slice(i, i + 7));
    }
    return result;
  }, [calendarDays]);

  if (isLoading) {
    return (
      <Box sx={{ p: { xs: 1, sm: 2 } }}>
        <Box sx={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', mb: 1, gap: 1 }}>
          {WEEKDAY_LABELS.map((label) => (
            <Skeleton
              key={label}
              variant="text"
              width={28}
              height={14}
              sx={{ mx: 'auto', bgcolor: palette.hoverBg }}
            />
          ))}
        </Box>
        {Array.from({ length: 5 }, (_, wi) => (
          <Box
            key={wi}
            sx={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', gap: 1, mb: 1 }}
          >
            {Array.from({ length: 7 }, (_, di) => (
              <Skeleton
                key={di}
                variant="rounded"
                sx={{
                  height: { xs: 64, sm: 80 },
                  borderRadius: '8px',
                  bgcolor: palette.hoverBg,
                }}
              />
            ))}
          </Box>
        ))}
      </Box>
    );
  }

  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', height: '100%', p: { xs: 1, sm: 2 } }}>
      <Box sx={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', mb: 0.5 }}>
        {WEEKDAY_LABELS.map((label) => (
          <Typography
            key={label}
            sx={{
              textAlign: 'center',
              fontSize: { xs: 10, sm: 11 },
              fontWeight: 500,
              letterSpacing: '0.5px',
              color: palette.tertiary,
              textTransform: 'uppercase',
              py: 0.5,
            }}
          >
            {label}
          </Typography>
        ))}
      </Box>

      <Box sx={{ flex: 1, display: 'flex', flexDirection: 'column' }}>
        {weeks.map((week, wi) => (
          <Box
            key={wi}
            sx={{
              display: 'grid',
              gridTemplateColumns: 'repeat(7, 1fr)',
              flex: 1,
              minHeight: { xs: 72, sm: 90 },
              borderTop: `1px solid ${palette.divider}`,
            }}
          >
            {week.map((day) => {
              const dayEvents = eventsByDay.get(day.toDateString()) || [];
              const today = isToday(day);
              const inMonth = isSameMonth(day, selectedDate);
              const overflow = dayEvents.length - MAX_VISIBLE_EVENTS;

              return (
                <Box
                  key={day.toISOString()}
                  role="gridcell"
                  aria-label={day.toLocaleDateString()}
                  sx={{
                    borderRight: `1px solid ${palette.divider}`,
                    '&:last-child': { borderRight: 'none' },
                    p: { xs: 0.5, sm: 0.75 },
                    cursor: 'pointer',
                    transition: transitions.fast,
                    '&:hover': { backgroundColor: palette.hoverBg },
                    opacity: inMonth ? 1 : 0.35,
                  }}
                  onClick={() => {
                    setSelectedDate(day);
                    setViewMode('day');
                  }}
                >
                  <Typography
                    sx={{
                      fontSize: { xs: 12, sm: 13 },
                      fontWeight: today ? 600 : 400,
                      color: today ? '#fff' : palette.primary,
                      width: { xs: 26, sm: 28 },
                      height: { xs: 26, sm: 28 },
                      borderRadius: '8px',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      backgroundColor: today ? palette.accent : 'transparent',
                      mx: 'auto',
                      mb: 0.5,
                    }}
                  >
                    {format(day, 'd')}
                  </Typography>

                  {dayEvents.slice(0, MAX_VISIBLE_EVENTS).map((event) => {
                    const color = getEventColor(event.id);
                    return (
                      <Box
                        key={`${event.id}_${event.startUtc}`}
                        onClick={(e) => {
                          e.stopPropagation();
                          openEditForm(event.id);
                        }}
                        sx={{
                          fontSize: { xs: 10, sm: 11 },
                          fontWeight: 500,
                          color,
                          backgroundColor: `${color}12`,
                          borderLeft: `2px solid ${color}`,
                          borderRadius: '4px',
                          px: 0.5,
                          py: 0.125,
                          mb: 0.25,
                          whiteSpace: 'nowrap',
                          overflow: 'hidden',
                          textOverflow: 'ellipsis',
                          cursor: 'pointer',
                          transition: transitions.fast,
                          '&:hover': { backgroundColor: `${color}20` },
                        }}
                      >
                        {event.title}
                      </Box>
                    );
                  })}

                  {overflow > 0 && (
                    <Typography
                      sx={{
                        fontSize: { xs: 10, sm: 11 },
                        color: palette.tertiary,
                        textAlign: 'center',
                        fontWeight: 500,
                      }}
                    >
                      +{overflow} more
                    </Typography>
                  )}
                </Box>
              );
            })}
          </Box>
        ))}
      </Box>
    </Box>
  );
}
