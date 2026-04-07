import React, { useMemo } from 'react';
import { Box, Typography, Tooltip } from '@mui/material';
import RepeatRoundedIcon from '@mui/icons-material/RepeatRounded';
import { useCalendarStore } from '../../stores/calendarStore';
import { utcToLocal, formatTimeLabel } from '../../utils/date.utils';
import { getEventColor, hexToSolidTint } from '../../utils/color.utils';
import { palette, transitions } from '../../theme/theme';
import type { CalendarEvent } from '../../types';

interface EventBlockProps {
  event: CalendarEvent;
  top: number;
  height: number;
  left?: number;
  width?: number;
}

export const EventBlock = React.memo(function EventBlock({
  event,
  top,
  height,
  left = 0,
  width = 100,
}: EventBlockProps) {
  const { openEditForm, viewingTimezone } = useCalendarStore();

  const color = getEventColor(event.id);
  const showTimezoneBadge = event.timezone !== viewingTimezone;

  const { startLabel, endLabel } = useMemo(() => {
    const start = utcToLocal(event.startUtc, viewingTimezone);
    const end = utcToLocal(event.endUtc, viewingTimezone);
    return { startLabel: formatTimeLabel(start), endLabel: formatTimeLabel(end) };
  }, [event.startUtc, event.endUtc, viewingTimezone]);

  const displayHeight = Math.max(height, 20);

  return (
    <Tooltip
      title={`${event.title} · ${startLabel} – ${endLabel}${event.isRecurring ? ' (recurring)' : ''}${showTimezoneBadge ? ` · ${event.timezone}` : ''}`}
      placement="top"
      arrow
    >
      <Box
        onClick={(e) => {
          e.stopPropagation();
          openEditForm(event.id);
        }}
        role="button"
        aria-label={`Event: ${event.title}`}
        tabIndex={0}
        onKeyDown={(e) => {
          if (e.key === 'Enter' || e.key === ' ') {
            e.preventDefault();
            openEditForm(event.id);
          }
        }}
        sx={{
          position: 'absolute',
          top,
          left: `calc(${left}% + 2px)`,
          width: `calc(${width}% - 4px)`,
          height: displayHeight,
          backgroundColor: hexToSolidTint(color, 0.15),
          border: `1px solid ${hexToSolidTint(color, 0.25)}`,
          borderLeft: `3px solid ${color}`,
          borderRadius: '6px',
          px: 1,
          py: 0.25,
          cursor: 'pointer',
          overflow: 'hidden',
          transition: transitions.normal,
          zIndex: 2,
          '&:hover': {
            backgroundColor: hexToSolidTint(color, 0.22),
            boxShadow: `0 2px 8px ${hexToSolidTint(color, 0.2)}`,
            transform: 'scale(1.005)',
          },
          '&:active': { transform: 'scale(0.995)' },
        }}
      >
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.25, overflow: 'hidden' }}>
          {event.isRecurring && (
            <RepeatRoundedIcon sx={{ fontSize: 11, color, flexShrink: 0 }} />
          )}
          <Typography
            sx={{
              fontSize: displayHeight < 30 ? 11 : 12,
              fontWeight: 600,
              color,
              lineHeight: 1.3,
              whiteSpace: 'nowrap',
              overflow: 'hidden',
              textOverflow: 'ellipsis',
            }}
          >
            {event.title}
          </Typography>
        </Box>
        {displayHeight >= 36 && (
          <Typography
            sx={{
              fontSize: 11,
              color: palette.secondary,
              lineHeight: 1.3,
              whiteSpace: 'nowrap',
            }}
          >
            {startLabel} – {endLabel}
          </Typography>
        )}
        {showTimezoneBadge && displayHeight >= 52 && (
          <Typography
            sx={{
              fontSize: 10,
              color: palette.tertiary,
              mt: 0.25,
              display: 'inline-block',
              backgroundColor: palette.pageBg,
              borderRadius: '4px',
              px: 0.5,
            }}
          >
            {event.timezone.split('/').pop()?.replace(/_/g, ' ')}
          </Typography>
        )}
      </Box>
    </Tooltip>
  );
});
