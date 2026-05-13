import { useMemo } from 'react';
import { Box, Typography, Skeleton, useMediaQuery, useTheme } from '@mui/material';
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
  const theme = useTheme();
  const compactMonth = useMediaQuery(theme.breakpoints.down('sm'));
  const maxVisibleEvents = compactMonth ? 2 : MAX_VISIBLE_EVENTS;

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
      <Box
        sx={{
          flex: 1,
          minHeight: 0,
          width: '100%',
          p: { xs: 0.75, sm: 2 },
          pb: 'max(12px, env(safe-area-inset-bottom, 12px))',
        }}
      >
        <Box sx={{ display: 'grid', gridTemplateColumns: 'repeat(7, minmax(0, 1fr))', mb: 1, gap: 1 }}>
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
            sx={{
              display: 'grid',
              gridTemplateColumns: 'repeat(7, minmax(0, 1fr))',
              gap: 1,
              mb: 1,
            }}
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
    <Box
      sx={{
        flex: 1,
        display: 'flex',
        flexDirection: 'column',
        minHeight: 0,
        overflow: 'hidden',
        width: '100%',
        maxWidth: '100%',
        p: { xs: 0.75, sm: 2 },
        pb: 'max(12px, env(safe-area-inset-bottom, 12px))',
      }}
    >
      <Box
        sx={{
          display: 'grid',
          gridTemplateColumns: 'repeat(7, minmax(0, 1fr))',
          mb: 0.5,
          minWidth: 0,
        }}
      >
        {WEEKDAY_LABELS.map((label) => (
          <Typography
            key={label}
            sx={{
              m: 0,
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

      <Box
        sx={{
          flex: 1,
          display: 'flex',
          flexDirection: 'column',
          minHeight: 0,
          minWidth: 0,
          WebkitOverflowScrolling: 'touch',
        }}
      >
        {weeks.map((week, wi) => (
          <Box
            key={wi}
            sx={{
              display: 'grid',
              gridTemplateColumns: 'repeat(7, minmax(0, 1fr))',
              gridTemplateRows: 'minmax(0, 1fr)',
              flex: '1 1 0%',
              height: '100%',
              minHeight: 0,
              minWidth: 0,
              overflow: 'hidden',
              alignContent: 'stretch',
              borderTop: `1px solid ${palette.divider}`,
            }}
          >
            {week.map((day) => {
              const dayEvents = eventsByDay.get(day.toDateString()) || [];
              const today = isToday(day);
              const inMonth = isSameMonth(day, selectedDate);
              const overflow = dayEvents.length - maxVisibleEvents;

              return (
                <Box
                  key={day.toISOString()}
                  role="gridcell"
                  aria-label={day.toLocaleDateString()}
                  sx={{
                    minWidth: 0,
                    minHeight: 0,
                    overflow: 'hidden',
                    alignSelf: 'stretch',
                    borderRight: `1px solid ${palette.divider}`,
                    '&:last-child': { borderRight: 'none' },
                    p: { xs: 0.35, sm: 0.75 },
                    pt: { xs: 0.35, sm: 0.5 },
                    cursor: 'pointer',
                    transition: transitions.fast,
                    touchAction: 'manipulation',
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'stretch',
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
                      flexShrink: 0,
                      m: 0,
                      fontSize: { xs: 11, sm: 13 },
                      fontWeight: today ? 600 : 400,
                      color: today ? '#fff' : palette.primary,
                      width: { xs: 24, sm: 28 },
                      height: { xs: 24, sm: 28 },
                      borderRadius: { xs: '6px', sm: '8px' },
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      backgroundColor: today ? palette.accent : 'transparent',
                      mx: 'auto',
                      mb: { xs: 0.25, sm: 0.5 },
                    }}
                  >
                    {format(day, 'd')}
                  </Typography>

                  <Box
                    sx={{
                      flex: '1 1 0%',
                      minHeight: 0,
                      minWidth: 0,
                      display: 'flex',
                      flexDirection: 'column',
                      gap: 0.125,
                      overflow: 'hidden',
                    }}
                  >
                  {dayEvents.slice(0, maxVisibleEvents).map((event) => {
                    const color = getEventColor(event.id);
                    return (
                      <Box
                        key={`${event.id}_${event.startUtc}`}
                        onClick={(e) => {
                          e.stopPropagation();
                          openEditForm(event.id);
                        }}
                        sx={{
                          flexShrink: 0,
                          maxWidth: '100%',
                          fontSize: { xs: '0.5625rem', sm: 11 },
                          lineHeight: 1.25,
                          fontWeight: 500,
                          color,
                          backgroundColor: `${color}12`,
                          borderLeft: `2px solid ${color}`,
                          borderRadius: '4px',
                          px: { xs: 0.375, sm: 0.5 },
                          py: 0.125,
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
                      component="div"
                      variant="caption"
                      title={`${overflow} more events`}
                      sx={{
                        flexShrink: 0,
                        m: 0,
                        fontSize: { xs: '0.5625rem', sm: 11 },
                        lineHeight: 1.25,
                        color: palette.tertiary,
                        textAlign: 'center',
                        fontWeight: 500,
                        pt: { xs: 0.125, sm: 0.25 },
                        overflow: 'hidden',
                        whiteSpace: 'nowrap',
                        textOverflow: 'ellipsis',
                      }}
                    >
                      +{overflow} more
                    </Typography>
                  )}
                  </Box>
                </Box>
              );
            })}
          </Box>
        ))}
      </Box>
    </Box>
  );
}
