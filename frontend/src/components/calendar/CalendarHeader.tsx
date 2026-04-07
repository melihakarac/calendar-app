import { useRef, useEffect, useState, useCallback } from 'react';
import { Box, Typography, Button, IconButton, useMediaQuery, useTheme } from '@mui/material';
import ChevronLeftIcon from '@mui/icons-material/ChevronLeft';
import ChevronRightIcon from '@mui/icons-material/ChevronRight';
import AddRoundedIcon from '@mui/icons-material/AddRounded';
import { useCalendarStore } from '../../stores/calendarStore';
import { useCalendarNavigation } from '../../hooks/useCalendarNavigation';
import { TimezoneSelector } from './TimezoneSelector';
import { palette, transitions } from '../../theme/theme';
import type { ViewMode } from '../../types';

const VIEW_MODES: { value: ViewMode; label: string }[] = [
  { value: 'day', label: 'Day' },
  { value: 'week', label: 'Week' },
  { value: 'month', label: 'Month' },
];

function ViewTabs({ value, onChange }: { value: ViewMode; onChange: (v: ViewMode) => void }) {
  const theme = useTheme();
  const compact = useMediaQuery(theme.breakpoints.down('sm'));
  const containerRef = useRef<HTMLDivElement>(null);
  const buttonRefs = useRef<Map<ViewMode, HTMLButtonElement>>(new Map());
  const [indicator, setIndicator] = useState({ left: 0, width: 0 });

  const updateIndicator = useCallback(() => {
    const btn = buttonRefs.current.get(value);
    const container = containerRef.current;
    if (btn && container) {
      const cRect = container.getBoundingClientRect();
      const bRect = btn.getBoundingClientRect();
      setIndicator({ left: bRect.left - cRect.left, width: bRect.width });
    }
  }, [value]);

  useEffect(() => {
    updateIndicator();
  }, [updateIndicator]);

  useEffect(() => {
    window.addEventListener('resize', updateIndicator);
    return () => window.removeEventListener('resize', updateIndicator);
  }, [updateIndicator]);

  return (
    <Box
      ref={containerRef}
      sx={{
        position: 'relative',
        display: 'inline-flex',
        maxWidth: '100%',
        backgroundColor: palette.hoverBg,
        borderRadius: '10px',
        p: '3px',
        flexShrink: 0,
      }}
    >
      <Box
        sx={{
          position: 'absolute',
          top: 3,
          left: indicator.left,
          width: indicator.width,
          height: 'calc(100% - 6px)',
          backgroundColor: palette.surfaceBg,
          borderRadius: '8px',
          boxShadow: '0 1px 3px rgba(0,0,0,0.08)',
          transition: 'left 250ms cubic-bezier(0.4, 0, 0.2, 1), width 250ms cubic-bezier(0.4, 0, 0.2, 1)',
          zIndex: 0,
        }}
      />
      {VIEW_MODES.map(({ value: mode, label }) => (
        <Box
          component="button"
          key={mode}
          ref={(el: HTMLButtonElement | null) => {
            if (el) buttonRefs.current.set(mode, el);
          }}
          onClick={() => onChange(mode)}
          sx={{
            position: 'relative',
            zIndex: 1,
            px: compact ? 1.25 : 2,
            py: compact ? 0.5 : 0.75,
            fontSize: compact ? 12 : 13,
            fontWeight: value === mode ? 600 : 500,
            color: value === mode ? palette.primary : palette.secondary,
            border: 'none',
            background: 'none',
            cursor: 'pointer',
            borderRadius: '8px',
            fontFamily: 'inherit',
            transition: 'color 200ms ease',
            minWidth: compact ? 48 : 56,
            whiteSpace: 'nowrap',
            '&:hover': {
              color: palette.primary,
            },
          }}
        >
          {label}
        </Box>
      ))}
    </Box>
  );
}

export function CalendarHeader() {
  const {
    viewMode,
    setViewMode,
    navigateForward,
    navigateBackward,
    navigateToToday,
    openCreateForm,
  } = useCalendarStore();
  const { headerLabel } = useCalendarNavigation();

  return (
    <Box
      sx={{
        display: 'flex',
        flexDirection: { xs: 'column', md: 'row' },
        alignItems: { xs: 'stretch', md: 'center' },
        justifyContent: 'space-between',
        px: { xs: 1.5, sm: 2, md: 3 },
        py: { xs: 1.25, md: 1.75 },
        pt: { xs: 'max(12px, env(safe-area-inset-top, 0px))', md: 1.75 },
        backgroundColor: palette.surfaceBg,
        borderBottom: `1px solid ${palette.divider}`,
        minHeight: { xs: 'auto', md: 64 },
        gap: { xs: 1.5, md: 2 },
        flexShrink: 0,
      }}
    >
      <Box
        sx={{
          display: 'flex',
          flexWrap: 'wrap',
          alignItems: 'center',
          gap: 1,
          minWidth: 0,
        }}
      >
        <Button
          variant="outlined"
          size="small"
          onClick={navigateToToday}
          sx={{
            borderColor: palette.border,
            color: palette.primary,
            fontWeight: 500,
            fontSize: { xs: 12, sm: 13 },
            px: { xs: 1.5, sm: 2 },
            py: 0.5,
            minWidth: 'auto',
            borderRadius: '8px',
          }}
        >
          Today
        </Button>
        <IconButton onClick={navigateBackward} size="small" aria-label="Previous">
          <ChevronLeftIcon sx={{ fontSize: 18, color: palette.secondary }} />
        </IconButton>
        <IconButton onClick={navigateForward} size="small" aria-label="Next">
          <ChevronRightIcon sx={{ fontSize: 18, color: palette.secondary }} />
        </IconButton>
        <Typography
          sx={{
            fontSize: { xs: 17, sm: 18, md: 20 },
            fontWeight: 600,
            letterSpacing: '-0.3px',
            color: palette.primary,
            ml: { xs: 0, sm: 0.5 },
            userSelect: 'none',
            flex: { xs: '1 1 100%', md: 'none' },
            minWidth: 0,
            overflow: 'hidden',
            textOverflow: 'ellipsis',
            whiteSpace: 'nowrap',
            order: { xs: 3, md: 0 },
          }}
        >
          {headerLabel}
        </Typography>
      </Box>

      <Box
        sx={{
          display: 'flex',
          flexWrap: 'wrap',
          alignItems: 'center',
          gap: { xs: 1, md: 2 },
          minWidth: 0,
          justifyContent: { xs: 'flex-start', md: 'flex-end' },
        }}
      >
        <TimezoneSelector />

        <ViewTabs value={viewMode} onChange={setViewMode} />

        <IconButton
          onClick={() => openCreateForm()}
          sx={{
            backgroundColor: palette.accent,
            color: '#fff',
            width: 36,
            height: 36,
            borderRadius: '10px',
            boxShadow: '0 2px 8px rgba(99,102,241,0.3)',
            transition: transitions.normal,
            '&:hover': {
              backgroundColor: palette.accentHover,
              boxShadow: '0 4px 14px rgba(99,102,241,0.35)',
              transform: 'translateY(-1px)',
            },
            '&:active': { transform: 'scale(0.95)' },
          }}
          aria-label="Create event"
        >
          <AddRoundedIcon sx={{ fontSize: 20 }} />
        </IconButton>
      </Box>
    </Box>
  );
}
