import { createTheme } from '@mui/material/styles';

export const palette = {
  pageBg: '#F8F8FB',
  surfaceBg: '#FFFFFF',
  hoverBg: '#F1F0F5',
  activeBg: '#E8E7EF',
  primary: '#1A1A2E',
  secondary: '#6B6B80',
  tertiary: '#9D9DAF',
  accent: '#6366F1',
  accentHover: '#4F46E5',
  accentLight: '#EEF2FF',
  accentMuted: '#A5B4FC',
  error: '#EF4444',
  success: '#10B981',
  warning: '#F59E0B',
  eventIndigo: '#6366F1',
  eventViolet: '#8B5CF6',
  eventRose: '#F472B6',
  eventOrange: '#FB923C',
  eventTeal: '#2DD4BF',
  eventSky: '#38BDF8',
  eventAmber: '#FBBF24',
  eventEmerald: '#34D399',
  divider: '#EDEDF3',
  border: '#DDDDE5',
  cardShadow: '0 1px 3px rgba(0,0,0,0.04), 0 1px 2px rgba(0,0,0,0.02)',
} as const;

export const EVENT_COLORS = [
  palette.eventIndigo,
  palette.eventViolet,
  palette.eventRose,
  palette.eventOrange,
  palette.eventTeal,
  palette.eventSky,
  palette.eventAmber,
  palette.eventEmerald,
] as const;

export const transitions = {
  fast: '100ms ease',
  normal: '180ms cubic-bezier(0.4, 0, 0.2, 1)',
  slow: '300ms cubic-bezier(0.4, 0, 0.2, 1)',
  spring: '350ms cubic-bezier(0.34, 1.56, 0.64, 1)',
  viewSwitch: '250ms cubic-bezier(0.4, 0, 0.2, 1)',
} as const;

const fontFamily = [
  'Inter',
  '-apple-system',
  'BlinkMacSystemFont',
  '"Segoe UI"',
  'sans-serif',
].join(',');

export { fontFamily };

export const theme = createTheme({
  palette: {
    mode: 'light',
    primary: { main: palette.accent, dark: palette.accentHover, light: palette.accentLight },
    error: { main: palette.error },
    success: { main: palette.success },
    warning: { main: palette.warning },
    background: { default: palette.pageBg, paper: palette.surfaceBg },
    text: { primary: palette.primary, secondary: palette.secondary },
    divider: palette.divider,
  },
  typography: {
    fontFamily,
    h1: { fontSize: 28, fontWeight: 700, letterSpacing: '-0.5px', color: palette.primary },
    h2: { fontSize: 20, fontWeight: 600, letterSpacing: '-0.3px', color: palette.primary },
    h3: { fontSize: 18, fontWeight: 600, letterSpacing: '-0.2px', color: palette.primary },
    body1: { fontSize: 15, fontWeight: 400, letterSpacing: '-0.1px', color: palette.primary },
    body2: { fontSize: 13, fontWeight: 400, letterSpacing: '0px', color: palette.secondary },
    caption: { fontSize: 12, fontWeight: 400, letterSpacing: '0px', color: palette.secondary },
    button: { textTransform: 'none' as const, fontWeight: 500, fontSize: 14 },
  },
  shape: { borderRadius: 12 },
  shadows: [
    'none',
    '0 1px 2px rgba(0,0,0,0.03)',
    '0 1px 3px rgba(0,0,0,0.05)',
    '0 4px 12px rgba(0,0,0,0.06)',
    '0 8px 24px rgba(0,0,0,0.08)',
    '0 12px 36px rgba(0,0,0,0.10)',
    ...Array(19).fill('none'),
  ] as unknown as import('@mui/material/styles').Shadows,
  components: {
    MuiCssBaseline: {
      styleOverrides: {
        body: {
          backgroundColor: palette.pageBg,
          color: palette.primary,
          fontFamily,
          WebkitFontSmoothing: 'antialiased',
          MozOsxFontSmoothing: 'grayscale',
        },
      },
    },
    MuiButton: {
      defaultProps: { disableRipple: true, disableElevation: true },
      styleOverrides: {
        root: {
          borderRadius: 10,
          padding: '8px 18px',
          fontSize: 14,
          fontWeight: 500,
          transition: transitions.normal,
          '&:active': { transform: 'scale(0.97)' },
          '&.Mui-disabled': {
            cursor: 'not-allowed',
            pointerEvents: 'auto',
          },
        },
        contained: ({ theme }) => ({
          backgroundColor: palette.accent,
          color: '#FFFFFF',
          boxShadow: '0 1px 3px rgba(99,102,241,0.3)',
          '&:hover': {
            backgroundColor: palette.accentHover,
            boxShadow: '0 4px 12px rgba(99,102,241,0.3)',
          },
          '&.Mui-disabled': {
            cursor: 'not-allowed',
            pointerEvents: 'auto',
            backgroundColor: theme.palette.action.disabledBackground,
            color: theme.palette.action.disabled,
            boxShadow: 'none',
          },
          '&.Mui-disabled:hover': {
            backgroundColor: theme.palette.action.disabledBackground,
            color: theme.palette.action.disabled,
            boxShadow: 'none',
          },
        }),
        outlined: ({ theme }) => ({
          borderColor: palette.border,
          color: palette.primary,
          '&:hover': { backgroundColor: palette.hoverBg, borderColor: palette.secondary },
          '&.Mui-disabled': {
            cursor: 'not-allowed',
            pointerEvents: 'auto',
            borderColor: theme.palette.action.disabledBackground,
            color: theme.palette.action.disabled,
          },
          '&.Mui-disabled:hover': {
            borderColor: theme.palette.action.disabledBackground,
            color: theme.palette.action.disabled,
            backgroundColor: 'transparent',
          },
        }),
        text: ({ theme }) => ({
          color: palette.secondary,
          '&:hover': { backgroundColor: palette.hoverBg, color: palette.primary },
          '&.Mui-disabled': {
            cursor: 'not-allowed',
            pointerEvents: 'auto',
            color: theme.palette.action.disabled,
          },
          '&.Mui-disabled:hover': {
            color: theme.palette.action.disabled,
            backgroundColor: 'transparent',
          },
        }),
      },
    },
    MuiIconButton: {
      defaultProps: { disableRipple: true },
      styleOverrides: {
        root: ({ theme }) => ({
          transition: transitions.normal,
          '&:hover': { backgroundColor: palette.hoverBg },
          '&:active': { transform: 'scale(0.93)' },
          '&.Mui-disabled': {
            cursor: 'not-allowed',
            pointerEvents: 'auto',
            color: theme.palette.action.disabled,
          },
          '&.Mui-disabled:hover': {
            backgroundColor: 'transparent',
            color: theme.palette.action.disabled,
          },
        }),
      },
    },
    MuiPaper: {
      defaultProps: { elevation: 0 },
      styleOverrides: {
        root: {
          borderRadius: 16,
          backgroundColor: palette.surfaceBg,
          border: `1px solid ${palette.divider}`,
        },
      },
    },
    MuiDialog: {
      styleOverrides: {
        paper: {
          borderRadius: 16,
          border: `1px solid ${palette.divider}`,
          boxShadow: '0 24px 48px rgba(0,0,0,0.12)',
          backgroundColor: palette.surfaceBg,
        },
      },
    },
    MuiTextField: {
      styleOverrides: {
        root: {
          '& .MuiOutlinedInput-root': {
            borderRadius: 10,
            transition: transitions.normal,
            backgroundColor: palette.pageBg,
            '& fieldset': { borderColor: palette.divider },
            '&:hover fieldset': { borderColor: palette.border },
            '&.Mui-focused fieldset': { borderColor: palette.accent, borderWidth: 1.5 },
          },
        },
      },
    },
    MuiSelect: {
      styleOverrides: {
        root: { borderRadius: 10 },
      },
    },
    MuiChip: {
      styleOverrides: {
        root: { borderRadius: 8, fontWeight: 500 },
      },
    },
    MuiTooltip: {
      styleOverrides: {
        tooltip: {
          backgroundColor: palette.primary,
          borderRadius: 8,
          fontSize: 12,
          fontWeight: 500,
          padding: '6px 12px',
          boxShadow: '0 4px 12px rgba(0,0,0,0.15)',
        },
      },
    },
    MuiToggleButton: {
      defaultProps: { disableRipple: true },
      styleOverrides: {
        root: {
          '&.Mui-disabled': {
            cursor: 'not-allowed',
            pointerEvents: 'auto',
          },
          '&.Mui-disabled:hover': {
            backgroundColor: 'transparent',
          },
        },
      },
    },
    MuiAutocomplete: {
      styleOverrides: {
        paper: {
          borderRadius: 12,
          border: `1px solid ${palette.divider}`,
          boxShadow: '0 8px 24px rgba(0,0,0,0.08)',
        },
      },
    },
    MuiLinearProgress: {
      styleOverrides: {
        root: {
          backgroundColor: palette.accentLight,
          '& .MuiLinearProgress-bar': { backgroundColor: palette.accent },
        },
      },
    },
    MuiSkeleton: {
      styleOverrides: {
        root: {
          backgroundColor: palette.hoverBg,
        },
      },
    },
  },
});
