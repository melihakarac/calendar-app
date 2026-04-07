import { Box, Typography } from '@mui/material';
import EventBusyRoundedIcon from '@mui/icons-material/EventBusyRounded';
import { format, parseISO } from 'date-fns';
import type { ConflictingEvent } from '../../types';

export interface EventConflictPanelProps {
  conflicts: ConflictingEvent[];
}

function conflictRowKey(c: ConflictingEvent): string {
  return `${c.id}_${c.startUtc}`;
}

export function EventConflictPanel({ conflicts }: EventConflictPanelProps) {
  if (conflicts.length === 0) return null;

  return (
    <Box
      sx={{
        borderRadius: '12px',
        backgroundColor: '#FFFBEB',
        border: '1px solid #FDE68A',
        p: 2,
      }}
    >
      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1.5 }}>
        <EventBusyRoundedIcon sx={{ fontSize: 18, color: '#D97706' }} />
        <Typography sx={{ fontSize: 13, fontWeight: 600, color: '#92400E' }}>
          Time conflicts with{' '}
          {conflicts.length === 1 ? 'an existing event' : `${conflicts.length} existing events`}
        </Typography>
      </Box>
      <Box sx={{ display: 'flex', flexDirection: 'column', gap: 0.75 }}>
        {conflicts.map((c) => (
          <Box
            key={conflictRowKey(c)}
            sx={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              backgroundColor: '#FEF3C7',
              borderRadius: '8px',
              px: 1.5,
              py: 0.75,
            }}
          >
            <Typography sx={{ fontSize: 13, fontWeight: 500, color: '#78350F' }}>{c.title}</Typography>
            <Typography sx={{ fontSize: 12, color: '#92400E', whiteSpace: 'nowrap', ml: 1.5 }}>
              {format(parseISO(c.startUtc), 'h:mm a')} – {format(parseISO(c.endUtc), 'h:mm a')}
            </Typography>
          </Box>
        ))}
      </Box>
      <Typography sx={{ fontSize: 12, color: '#A16207', mt: 1.5 }}>
        Adjust the start or end time to avoid overlaps.
      </Typography>
    </Box>
  );
}
