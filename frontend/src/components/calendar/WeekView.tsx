import { useMemo } from 'react';
import { Box, Typography, Skeleton } from '@mui/material';
import { startOfWeek, addDays, format, isToday, isSameDay, startOfDay } from 'date-fns';
import { TimeGrid } from './TimeGrid';
import { useCalendarStore } from '../../stores/calendarStore';
import { useResponsiveCalendarLayout } from '../../hooks/useResponsiveCalendarLayout';
import { palette, transitions } from '../../theme/theme';
import type { CalendarEvent } from '../../types';

interface WeekViewProps {
  events: CalendarEvent[];
  isLoading: boolean;
}

export function WeekView({ events, isLoading }: WeekViewProps) {
  const { selectedDate, setSelectedDate, setViewMode } = useCalendarStore();
  const { gutterWidth, isMobile } = useResponsiveCalendarLayout();

  const weekDays = useMemo(() => {
    const start = startOfWeek(selectedDate, { weekStartsOn: 0 });
    return Array.from({ length: 7 }, (_, i) => addDays(start, i));
  }, [selectedDate]);

  const gridDays = useMemo(() => {
    if (!isMobile) return weekDays;
    const d0 = startOfDay(selectedDate);
    const inWeek = weekDays.some((wd) => isSameDay(wd, d0));
    return [inWeek ? d0 : startOfDay(weekDays[0]!)];
  }, [isMobile, selectedDate, weekDays]);

  if (isLoading) {
    return (
      <Box sx={{ p: { xs: 1, sm: 2 } }}>
        <Box
          sx={{
            display: 'flex',
            gap: { xs: 0.25, sm: 1 },
            mb: 2,
            pl: { xs: 0, sm: `${gutterWidth}px` },
          }}
        >
          {Array.from({ length: 7 }, (_, i) => (
            <Box
              key={i}
              sx={{
                flex: 1,
                minWidth: 0,
                textAlign: 'center',
              }}
            >
              <Skeleton variant="text" width={28} height={14} sx={{ mx: 'auto', mb: 0.5, bgcolor: palette.hoverBg }} />
              <Skeleton variant="circular" width={36} height={36} sx={{ mx: 'auto', bgcolor: palette.hoverBg }} />
            </Box>
          ))}
        </Box>
        {Array.from({ length: 8 }, (_, i) => (
          <Skeleton
            key={i}
            variant="rounded"
            height={60}
            sx={{ mb: 0.5, borderRadius: '6px', bgcolor: palette.hoverBg }}
          />
        ))}
      </Box>
    );
  }

  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', height: '100%', minHeight: 0 }}>
      <Box
        sx={{
          overflowX: { xs: 'hidden', sm: 'auto' },
          overflowY: 'hidden',
          WebkitOverflowScrolling: 'touch',
          flexShrink: 0,
          borderBottom: `1px solid ${palette.divider}`,
          backgroundColor: palette.surfaceBg,
        }}
      >
        <Box
          sx={{
            display: 'flex',
            minWidth: { xs: 0, sm: gutterWidth + 7 * 72 },
            width: { xs: '100%', sm: 'auto' },
          }}
        >
          <Box sx={{ width: gutterWidth, flexShrink: 0, display: { xs: 'none', sm: 'block' } }} />
          {weekDays.map((day) => {
            const today = isToday(day);
            const selected = isSameDay(day, selectedDate);
            const filled = selected;
            const weekdayColor = filled ? palette.accent : today ? palette.accent : palette.tertiary;
            return (
              <Box
                key={day.toISOString()}
                sx={{
                  flex: 1,
                  minWidth: { xs: 0, sm: 72 },
                  textAlign: 'center',
                  py: { xs: 1, sm: 1.5 },
                  cursor: 'pointer',
                  transition: transitions.fast,
                  borderRadius: 0,
                  '&:hover': { backgroundColor: palette.hoverBg },
                }}
                onClick={() => {
                  setSelectedDate(day);
                  if (!isMobile) {
                    setViewMode('day');
                  }
                }}
              >
                <Typography
                  sx={{
                    fontSize: { xs: 9, sm: 11 },
                    fontWeight: 500,
                    letterSpacing: { xs: '0.2px', sm: '0.5px' },
                    color: weekdayColor,
                    textTransform: 'uppercase',
                  }}
                >
                  {format(day, 'EEE')}
                </Typography>
                <Typography
                  sx={{
                    fontSize: { xs: 14, sm: 20 },
                    fontWeight: filled || today ? 600 : 400,
                    color: filled ? '#fff' : palette.primary,
                    width: { xs: 28, sm: 34 },
                    height: { xs: 28, sm: 34 },
                    borderRadius: '10px',
                    display: 'inline-flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    backgroundColor: filled ? palette.accent : 'transparent',
                    border:
                      !filled && today ? `2px solid ${palette.accent}` : filled ? 'none' : '2px solid transparent',
                    mt: 0.25,
                    transition: transitions.normal,
                    boxSizing: 'border-box',
                  }}
                >
                  {format(day, 'd')}
                </Typography>
              </Box>
            );
          })}
        </Box>
      </Box>

      <Box
        sx={{
          flex: 1,
          overflow: 'auto',
          overflowX: { xs: 'hidden', sm: 'auto', md: 'hidden' },
          WebkitOverflowScrolling: 'touch',
        }}
      >
        <Box sx={{ minWidth: { xs: 0, sm: gutterWidth + 7 * 72 }, width: { xs: '100%', sm: 'auto' } }}>
          <TimeGrid days={gridDays} events={events} />
        </Box>
      </Box>
    </Box>
  );
}
