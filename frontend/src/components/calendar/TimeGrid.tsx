import React, { useMemo, useCallback, useState, useRef, useEffect } from 'react';
import { Box, Typography } from '@mui/material';
import { startOfDay, differenceInMinutes, parseISO, isSameDay } from 'date-fns';
import { toZonedTime } from 'date-fns-tz';
import { EventBlock } from './EventBlock';
import { CurrentTimeIndicator } from './CurrentTimeIndicator';
import { useCalendarStore } from '../../stores/calendarStore';
import { formatHourLabel, createDateWithTime, formatTimeLabel } from '../../utils/date.utils';
import { palette } from '../../theme/theme';
import type { CalendarEvent } from '../../types';

export const HOUR_HEIGHT = 60;
const TOTAL_HOURS = 24;
const GRID_HEIGHT = HOUR_HEIGHT * TOTAL_HOURS;
export const GUTTER_WIDTH = 64;
const SNAP_MINUTES = 15;

interface TimeGridProps {
  days: Date[];
  events: CalendarEvent[];
}

interface PositionedEvent {
  event: CalendarEvent;
  top: number;
  height: number;
  column: number;
  totalColumns: number;
}

interface DragState {
  dayKey: string;
  day: Date;
  startMinutes: number;
  currentMinutes: number;
}

function snapToGrid(y: number): number {
  const totalMinutes = (y / HOUR_HEIGHT) * 60;
  return Math.round(totalMinutes / SNAP_MINUTES) * SNAP_MINUTES;
}

function layoutOverlapping(events: PositionedEvent[]): PositionedEvent[] {
  if (events.length === 0) return [];

  const sorted = [...events].sort((a, b) => a.top - b.top || b.height - a.height);
  const columns: PositionedEvent[][] = [];

  for (const ev of sorted) {
    let placed = false;
    for (let col = 0; col < columns.length; col++) {
      const colArr = columns[col];
      const lastInCol = colArr?.[colArr.length - 1];
      if (lastInCol && lastInCol.top + lastInCol.height <= ev.top) {
        ev.column = col;
        colArr.push(ev);
        placed = true;
        break;
      }
    }
    if (!placed) {
      ev.column = columns.length;
      columns.push([ev]);
    }
  }

  const totalCols = columns.length;
  for (const col of columns) {
    for (const ev of col) {
      ev.totalColumns = totalCols;
    }
  }

  return sorted;
}

function SelectionOverlay({ drag }: { drag: DragState }) {
  const topMin = Math.min(drag.startMinutes, drag.currentMinutes);
  const bottomMin = Math.max(drag.startMinutes, drag.currentMinutes);
  const height = Math.max(bottomMin - topMin, SNAP_MINUTES);

  const startH = Math.floor(topMin / 60);
  const startM = topMin % 60;
  const endTotal = topMin + height;
  const endH = Math.floor(endTotal / 60);
  const endM = endTotal % 60;

  const startLabel = formatTimeLabel(createDateWithTime(drag.day, startH, startM));
  const endLabel = formatTimeLabel(createDateWithTime(drag.day, endH, endM));

  return (
    <Box
      sx={{
        position: 'absolute',
        top: topMin,
        left: 2,
        right: 2,
        height,
        backgroundColor: palette.accentLight,
        border: `1.5px solid ${palette.accentMuted}`,
        borderLeft: `3px solid ${palette.accent}`,
        borderRadius: '6px',
        zIndex: 5,
        pointerEvents: 'none',
        overflow: 'visible',
        px: 1,
        py: 0.25,
        transition: 'height 60ms ease, top 60ms ease',
      }}
    >
      <Typography
        sx={{
          fontSize: 11,
          fontWeight: 600,
          color: palette.accent,
          lineHeight: 1,
          whiteSpace: 'nowrap',
        }}
      >
        {startLabel} – {endLabel}
      </Typography>
    </Box>
  );
}

export const TimeGrid = React.memo(function TimeGrid({ days, events }: TimeGridProps) {
  const { viewingTimezone, openCreateForm } = useCalendarStore();

  const [drag, setDrag] = useState<DragState | null>(null);
  const isDragging = useRef(false);
  const columnRefs = useRef<Map<string, HTMLDivElement>>(new Map());

  const eventsByDay = useMemo(() => {
    const map = new Map<string, CalendarEvent[]>();
    for (const day of days) {
      map.set(day.toDateString(), []);
    }
    for (const event of events) {
      const start = toZonedTime(parseISO(event.startUtc), viewingTimezone);
      const end = toZonedTime(parseISO(event.endUtc), viewingTimezone);
      for (const day of days) {
        if (
          isSameDay(start, day) ||
          isSameDay(end, day) ||
          (start < day && end > day)
        ) {
          const arr = map.get(day.toDateString());
          if (arr) arr.push(event);
        }
      }
    }
    return map;
  }, [events, days, viewingTimezone]);

  const getMinutesFromY = useCallback((el: HTMLDivElement, clientY: number) => {
    const rect = el.getBoundingClientRect();
    const y = Math.max(0, Math.min(clientY - rect.top, GRID_HEIGHT));
    return snapToGrid(y);
  }, []);

  const handleMouseDown = useCallback(
    (day: Date, e: React.MouseEvent<HTMLDivElement>) => {
      if (e.button !== 0) return;
      const target = e.target as HTMLElement;
      if (target.closest('[role="button"]')) return;
      const el = e.currentTarget;
      const minutes = getMinutesFromY(el, e.clientY);
      isDragging.current = true;
      document.body.style.userSelect = 'none';
      setDrag({
        dayKey: day.toDateString(),
        day,
        startMinutes: minutes,
        currentMinutes: minutes + SNAP_MINUTES,
      });
    },
    [getMinutesFromY],
  );

  useEffect(() => {
    if (!drag) return;

    const handleMouseMove = (e: MouseEvent) => {
      if (!isDragging.current || !drag) return;
      const el = columnRefs.current.get(drag.dayKey);
      if (!el) return;
      const minutes = getMinutesFromY(el, e.clientY);
      setDrag((prev) => (prev ? { ...prev, currentMinutes: minutes } : null));
    };

    const handleMouseUp = () => {
      if (!isDragging.current || !drag) return;
      isDragging.current = false;
      document.body.style.userSelect = '';

      const topMin = Math.min(drag.startMinutes, drag.currentMinutes);
      const bottomMin = Math.max(drag.startMinutes, drag.currentMinutes);
      const duration = Math.max(bottomMin - topMin, SNAP_MINUTES);

      const startH = Math.floor(topMin / 60);
      const startM = topMin % 60;
      const endTotal = topMin + duration;
      const endH = Math.floor(endTotal / 60);
      const endM = endTotal % 60;

      const start = createDateWithTime(drag.day, startH, startM);
      const end = createDateWithTime(drag.day, endH, endM);

      setDrag(null);
      openCreateForm(start, end);
    };

    window.addEventListener('mousemove', handleMouseMove);
    window.addEventListener('mouseup', handleMouseUp);
    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mouseup', handleMouseUp);
    };
  }, [drag, getMinutesFromY, openCreateForm]);

  const setColumnRef = useCallback((day: Date, el: HTMLDivElement | null) => {
    if (el) {
      columnRefs.current.set(day.toDateString(), el);
    }
  }, []);

  const hours = useMemo(() => Array.from({ length: TOTAL_HOURS }, (_, i) => i), []);
  const isSingleDay = days.length === 1;

  return (
    <Box
      sx={{
        display: 'flex',
        position: 'relative',
        userSelect: 'auto',
      }}
    >
      <Box
        sx={{
          width: GUTTER_WIDTH,
          flexShrink: 0,
          position: 'relative',
          borderRight: `1px solid ${palette.divider}`,
        }}
      >
        {hours.map((hour) => (
          <Box
            key={hour}
            sx={{
              height: HOUR_HEIGHT,
              display: 'flex',
              alignItems: 'flex-start',
              justifyContent: 'flex-end',
              pr: 1.5,
            }}
          >
            {hour > 0 && (
              <Typography
                sx={{
                  fontSize: 11,
                  fontWeight: 500,
                  letterSpacing: '0.2px',
                  color: palette.tertiary,
                  position: 'relative',
                  top: -7,
                  userSelect: 'none',
                }}
              >
                {formatHourLabel(hour)}
              </Typography>
            )}
          </Box>
        ))}
      </Box>

      <Box sx={{ display: 'flex', flex: 1 }}>
        {days.map((day) => {
          const dayEvents = eventsByDay.get(day.toDateString()) || [];
          const dayStart = startOfDay(day);

          const positioned: PositionedEvent[] = dayEvents.map((event) => {
            const start = toZonedTime(parseISO(event.startUtc), viewingTimezone);
            const end = toZonedTime(parseISO(event.endUtc), viewingTimezone);
            const topMin = Math.max(differenceInMinutes(start, dayStart), 0);
            const bottomMin = Math.min(differenceInMinutes(end, dayStart), TOTAL_HOURS * 60);
            return {
              event,
              top: topMin,
              height: Math.max(bottomMin - topMin, 15),
              column: 0,
              totalColumns: 1,
            };
          });

          const laid = layoutOverlapping(positioned);
          const showSelection = drag && drag.dayKey === day.toDateString();

          return (
            <Box
              key={day.toISOString()}
              ref={(el: HTMLDivElement | null) => setColumnRef(day, el)}
              role="gridcell"
              aria-label={day.toLocaleDateString()}
              sx={{
                flex: 1,
                position: 'relative',
                height: GRID_HEIGHT,
                borderRight: isSingleDay ? 'none' : `1px solid ${palette.divider}`,
                cursor: 'crosshair',
                '&:last-child': { borderRight: 'none' },
              }}
              onMouseDown={(e) => handleMouseDown(day, e)}
            >
              {hours.map((hour) => (
                <Box
                  key={hour}
                  sx={{
                    height: HOUR_HEIGHT,
                    borderBottom: `1px solid ${palette.divider}`,
                    '&:last-child': { borderBottom: 'none' },
                  }}
                />
              ))}

              {laid.map((pe) => (
                <EventBlock
                  key={pe.event.id}
                  event={pe.event}
                  top={pe.top}
                  height={pe.height}
                  left={(pe.column / pe.totalColumns) * 100}
                  width={(1 / pe.totalColumns) * 100}
                />
              ))}

              {showSelection && <SelectionOverlay drag={drag} />}

              <CurrentTimeIndicator day={day} hourHeight={HOUR_HEIGHT} />
            </Box>
          );
        })}
      </Box>
    </Box>
  );
});
