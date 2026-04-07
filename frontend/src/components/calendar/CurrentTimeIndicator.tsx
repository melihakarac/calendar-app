import { useState, useEffect } from 'react';
import { Box } from '@mui/material';
import { isToday, differenceInMinutes, startOfDay } from 'date-fns';
import { palette } from '../../theme/theme';

interface CurrentTimeIndicatorProps {
  day: Date;
  hourHeight: number;
}

export function CurrentTimeIndicator({ day, hourHeight }: CurrentTimeIndicatorProps) {
  const [now, setNow] = useState(new Date());

  useEffect(() => {
    const interval = setInterval(() => setNow(new Date()), 60_000);
    return () => clearInterval(interval);
  }, []);

  if (!isToday(day)) return null;

  const minutes = differenceInMinutes(now, startOfDay(now));
  const top = (minutes / 60) * hourHeight;

  return (
    <Box
      sx={{
        position: 'absolute',
        top,
        left: -4,
        right: 0,
        zIndex: 10,
        pointerEvents: 'none',
      }}
    >
      <Box
        sx={{
          width: 8,
          height: 8,
          borderRadius: '50%',
          backgroundColor: palette.accent,
          position: 'absolute',
          top: -3,
          left: 0,
        }}
      />
      <Box
        sx={{
          height: '2px',
          backgroundColor: palette.accent,
          ml: '8px',
        }}
      />
    </Box>
  );
}
