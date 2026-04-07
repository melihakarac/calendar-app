import { useMemo } from 'react';
import { Box, Typography, Skeleton } from '@mui/material';
import { startOfWeek, addDays, format, isToday } from 'date-fns';
import { TimeGrid, GUTTER_WIDTH } from './TimeGrid';
import { useCalendarStore } from '../../stores/calendarStore';
import { palette, transitions } from '../../theme/theme';
import type { CalendarEvent } from '../../types';

interface WeekViewProps {
  events: CalendarEvent[];
  isLoading: boolean;
}

export function WeekView({ events, isLoading }: WeekViewProps) {
  const { selectedDate, setSelectedDate, setViewMode } = useCalendarStore();

  const weekDays = useMemo(() => {
    const start = startOfWeek(selectedDate, { weekStartsOn: 0 });
    return Array.from({ length: 7 }, (_, i) => addDays(start, i));
  }, [selectedDate]);

  if (isLoading) {
    return (
      <Box sx={{ p: 2 }}>
        <Box sx={{ display: 'flex', gap: 1, mb: 2, pl: `${GUTTER_WIDTH}px` }}>
          {Array.from({ length: 7 }, (_, i) => (
            <Box key={i} sx={{ flex: 1, textAlign: 'center' }}>
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
    <Box sx={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
      <Box
        sx={{
          display: 'flex',
          borderBottom: `1px solid ${palette.divider}`,
          flexShrink: 0,
          backgroundColor: palette.surfaceBg,
        }}
      >
        <Box sx={{ width: GUTTER_WIDTH, flexShrink: 0 }} />
        {weekDays.map((day) => {
          const today = isToday(day);
          return (
            <Box
              key={day.toISOString()}
              sx={{
                flex: 1,
                textAlign: 'center',
                py: 1.5,
                cursor: 'pointer',
                transition: transitions.fast,
                borderRadius: 0,
                '&:hover': { backgroundColor: palette.hoverBg },
              }}
              onClick={() => {
                setSelectedDate(day);
                setViewMode('day');
              }}
            >
              <Typography
                sx={{
                  fontSize: 11,
                  fontWeight: 500,
                  letterSpacing: '0.5px',
                  color: today ? palette.accent : palette.tertiary,
                  textTransform: 'uppercase',
                }}
              >
                {format(day, 'EEE')}
              </Typography>
              <Typography
                sx={{
                  fontSize: 20,
                  fontWeight: today ? 600 : 400,
                  color: today ? '#fff' : palette.primary,
                  width: 34,
                  height: 34,
                  borderRadius: '10px',
                  display: 'inline-flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  backgroundColor: today ? palette.accent : 'transparent',
                  mt: 0.25,
                  transition: transitions.normal,
                }}
              >
                {format(day, 'd')}
              </Typography>
            </Box>
          );
        })}
      </Box>

      <Box sx={{ flex: 1, overflow: 'auto' }}>
        <TimeGrid days={weekDays} events={events} />
      </Box>
    </Box>
  );
}
