import { useRef, useEffect, useState, lazy, Suspense } from 'react';
import { Box, LinearProgress, Fade, Skeleton } from '@mui/material';
import { CalendarHeader } from './CalendarHeader';
import { EventFormModal } from './EventFormModal';
import { ErrorBoundary } from '../ui/ErrorBoundary';

const DayView = lazy(() => import('./DayView').then((m) => ({ default: m.DayView })));
const WeekView = lazy(() => import('./WeekView').then((m) => ({ default: m.WeekView })));
const MonthView = lazy(() => import('./MonthView').then((m) => ({ default: m.MonthView })));
import { useCalendarStore } from '../../stores/calendarStore';
import { useCalendarNavigation } from '../../hooks/useCalendarNavigation';
import { useEventsList, useDeleteEvent } from '../../hooks/useEvents';
import { palette } from '../../theme/theme';

export function CalendarApp() {
  const { viewMode } = useCalendarStore();
  const { queryRange } = useCalendarNavigation();
  const { data: events = [], isLoading, isFetching } = useEventsList(queryRange.from, queryRange.to);
  const deleteMutation = useDeleteEvent();

  const isBusy = isFetching || deleteMutation.isPending;
  const [showProgress, setShowProgress] = useState(false);
  const hideTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    if (isBusy) {
      if (hideTimer.current) { clearTimeout(hideTimer.current); hideTimer.current = null; }
      setShowProgress(true);
    } else if (showProgress) {
      hideTimer.current = setTimeout(() => setShowProgress(false), 600);
      return () => { if (hideTimer.current) clearTimeout(hideTimer.current); };
    }
  }, [isBusy]); // eslint-disable-line react-hooks/exhaustive-deps

  const [rendered, setRendered] = useState(viewMode);
  const [animClass, setAnimClass] = useState('');
  const prevMode = useRef(viewMode);

  useEffect(() => {
    if (viewMode !== prevMode.current) {
      setAnimClass('calendar-view-exit');
      const t = setTimeout(() => {
        setRendered(viewMode);
        prevMode.current = viewMode;
        setAnimClass('calendar-view-enter');
        const t2 = setTimeout(() => setAnimClass(''), 250);
        return () => clearTimeout(t2);
      }, 120);
      return () => clearTimeout(t);
    }
  }, [viewMode]);

  return (
    <Box
      sx={{
        display: 'flex',
        flexDirection: 'column',
        height: '100dvh',
        minHeight: '100vh',
        backgroundColor: palette.pageBg,
        overflow: 'hidden',
        pb: 'env(safe-area-inset-bottom, 0px)',
      }}
    >
      <CalendarHeader />
      <Box sx={{ position: 'relative', height: 0, flexShrink: 0, zIndex: 10 }}>
        <Fade in={showProgress} unmountOnExit>
          <LinearProgress
            sx={{
              position: 'absolute',
              top: 0,
              left: 0,
              right: 0,
              height: 3,
              backgroundColor: 'rgba(99,102,241,0.12)',
              '& .MuiLinearProgress-bar': {
                backgroundColor: palette.accent,
              },
            }}
          />
        </Fade>
      </Box>
      <ErrorBoundary fallbackMessage="Calendar view encountered an error">
        <Box
          className={animClass}
          sx={{
            flex: 1,
            overflow: 'auto',
            '&.calendar-view-exit': {
              opacity: 0,
              transition: 'opacity 120ms ease-out',
            },
            '&.calendar-view-enter': {
              animation: 'fadeIn 200ms ease-out forwards',
            },
          }}
        >
          <Suspense
            fallback={
              <Box sx={{ p: 3 }}>
                {Array.from({ length: 8 }, (_, i) => (
                  <Skeleton key={i} variant="rounded" height={60} sx={{ mb: 0.5, borderRadius: '6px' }} />
                ))}
              </Box>
            }
          >
            {rendered === 'day' && <DayView events={events} isLoading={isLoading} />}
            {rendered === 'week' && <WeekView events={events} isLoading={isLoading} />}
            {rendered === 'month' && <MonthView events={events} isLoading={isLoading} />}
          </Suspense>
        </Box>
      </ErrorBoundary>
      <ErrorBoundary fallbackMessage="Event form encountered an error">
        <EventFormModal />
      </ErrorBoundary>
    </Box>
  );
}
