import { useMemo } from 'react';
import { Box, Skeleton } from '@mui/material';
import { startOfDay } from 'date-fns';
import { TimeGrid } from './TimeGrid';
import { useCalendarStore } from '../../stores/calendarStore';
import { palette } from '../../theme/theme';
import type { CalendarEvent } from '../../types';

interface DayViewProps {
  events: CalendarEvent[];
  isLoading: boolean;
}

export function DayView({ events, isLoading }: DayViewProps) {
  const { selectedDate } = useCalendarStore();
  const days = useMemo(() => [startOfDay(selectedDate)], [selectedDate]);

  if (isLoading) {
    return (
      <Box sx={{ display: 'flex', p: 2, gap: 1 }}>
        <Box sx={{ width: 64, flexShrink: 0, pt: 1 }}>
          {Array.from({ length: 12 }, (_, i) => (
            <Skeleton
              key={i}
              variant="text"
              width={32}
              height={14}
              sx={{ mb: '46px', ml: 'auto', borderRadius: 0.5, bgcolor: palette.hoverBg }}
            />
          ))}
        </Box>
        <Box sx={{ flex: 1 }}>
          {Array.from({ length: 12 }, (_, i) => (
            <Box
              key={i}
              sx={{
                height: 60,
                borderBottom: `1px solid ${palette.divider}`,
                display: 'flex',
                alignItems: 'center',
                px: 1,
              }}
            >
              {i % 3 === 0 && (
                <Skeleton
                  variant="rounded"
                  width="60%"
                  height={36}
                  sx={{ borderRadius: '6px', bgcolor: palette.hoverBg }}
                />
              )}
            </Box>
          ))}
        </Box>
      </Box>
    );
  }

  return (
    <Box sx={{ overflow: 'auto', height: '100%' }}>
      <TimeGrid days={days} events={events} />
    </Box>
  );
}
